/** AI (Codex) was used to help write tests */

const test = require('node:test');
const assert = require('node:assert/strict');

const createIndexRouter = require('../../routes/index');
const createUsersRouter = require('../../routes/users');
const { redirectToLogin, requireSessionUser } = require('../../middleware/auth');
const { invokeRoute } = require('../../testSupport/routerTestUtils');

function createStubIndexRouter(overrides = {}) {
  return createIndexRouter({
    runQuery: overrides.runQuery || (async () => []),
    redirectToLogin: overrides.redirectToLogin || redirectToLogin,
    listPresetProfileImages: overrides.listPresetProfileImages || (() => []),
    dashboardErrorMessages: overrides.dashboardErrorMessages || {},
    getDashboardProfile: overrides.getDashboardProfile || (async () => null),
    buildLoginViewModel:
      overrides.buildLoginViewModel || ((viewModel = {}) => ({ errorMessage: null, email: '', ...viewModel })),
    buildQuizForCity: overrides.buildQuizForCity || (async () => null),
    calculateQuizResult: overrides.calculateQuizResult || (async () => null),
    getCities: overrides.getCities || (async () => []),
    getRandomCity: overrides.getRandomCity || (async () => null),
    getStates: overrides.getStates || (async () => []),
    toClientQuiz: overrides.toClientQuiz || ((quiz) => quiz)
  });
}

function createStubUsersRouter(overrides = {}) {
  return createUsersRouter({
    bcrypt: overrides.bcrypt || { compare: async () => false, hash: async () => 'hashed-password' },
    runQuery: overrides.runQuery || (async () => []),
    requireSessionUser: overrides.requireSessionUser || requireSessionUser,
    listPresetProfileImages: overrides.listPresetProfileImages || (() => []),
    maxBioLength: overrides.maxBioLength ?? 500,
    maxUploadedImageLength: overrides.maxUploadedImageLength ?? 12_000_000,
    deleteStoredProfile: overrides.deleteStoredProfile || (() => true),
    getStoredProfile: overrides.getStoredProfile || (() => null),
    saveStoredProfile: overrides.saveStoredProfile || (() => true),
    buildSessionUser:
      overrides.buildSessionUser || ((user, storedProfile = {}) => ({ id: user.id, bio: storedProfile.bio || '' })),
    buildLoginViewModel:
      overrides.buildLoginViewModel || ((viewModel = {}) => ({ errorMessage: null, email: '', ...viewModel }))
  });
}

test('GET /dashboard redirects guests to /login', async () => {
  const router = createStubIndexRouter();
  const { res } = await invokeRoute(router, {
    method: 'GET',
    session: {},
    url: '/dashboard'
  });

  assert.equal(res.statusCode, 302);
  assert.equal(res.redirectUrl, '/login');
});

test('POST /cities/:cityId/game/submit stores a guest score in session until login', async () => {
  const quizResult = {
    city: { cityId: 7, cityName: 'Houston', state: 'Texas' },
    totalPoints: 620,
    questionResults: []
  };
  const recordedQueries = [];

  const indexRouter = createStubIndexRouter({
    calculateQuizResult: async () => quizResult
  });
  const usersRouter = createStubUsersRouter({
    runQuery: async (sql, params) => {
      recordedQueries.push({ sql, params });

      if (sql.includes('SELECT * FROM users')) {
        return [
          {
            id: 12,
            username: 'player1',
            email: 'player@example.com',
            password: 'hashed-password'
          }
        ];
      }

      return [];
    },
    bcrypt: {
      compare: async () => true,
      hash: async () => 'hashed-password'
    },
    getStoredProfile: () => ({ bio: 'Saved bio', profileImageUrl: null }),
    buildSessionUser: (user, storedProfile = {}) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: storedProfile.bio || '',
      profileImageUrl: storedProfile.profileImageUrl || null
    })
  });
  const session = {};

  const { res: submitResponse } = await invokeRoute(indexRouter, {
    body: { responses: [{ questionId: 1, answerId: 99 }] },
    method: 'POST',
    params: { cityId: '7' },
    session,
    url: '/cities/:cityId/game/submit'
  });

  assert.equal(submitResponse.statusCode, 200);
  assert.deepEqual(submitResponse.jsonBody, {
    ...quizResult,
    saved: false,
    savedMessage: 'Log in to save this score to your dashboard and leaderboard.'
  });

  const { res: loginResponse } = await invokeRoute(usersRouter, {
    body: { email: ' player@example.com ', password: 'secret' },
    method: 'POST',
    session,
    url: '/login'
  });

  assert.equal(loginResponse.statusCode, 302);
  assert.equal(loginResponse.redirectUrl, '/dashboard?scoreSaved=1');
  assert.deepEqual(recordedQueries, [
    {
      sql: 'SELECT * FROM users WHERE email = ? AND is_deleted = FALSE',
      params: ['player@example.com']
    },
    {
      sql: 'INSERT INTO scores (user_id, score) VALUES (?, ?)',
      params: [12, 620]
    }
  ]);
  assert.equal(session.pendingGuestScore, undefined);
});

test('POST /cities/:cityId/game/submit saves a logged-in user score immediately', async () => {
  const recordedQueries = [];

  const indexRouter = createStubIndexRouter({
    calculateQuizResult: async () => ({
      city: { cityId: 8, cityName: 'Dallas', state: 'Texas' },
      totalPoints: 700,
      questionResults: []
    }),
    runQuery: async (sql, params) => {
      recordedQueries.push({ sql, params });
      return [];
    }
  });
  const usersRouter = createStubUsersRouter({
    runQuery: async (sql, params) => {
      recordedQueries.push({ sql, params });

      if (sql.includes('SELECT * FROM users')) {
        return [
          {
            id: 12,
            username: 'player1',
            email: 'player@example.com',
            password: 'hashed-password'
          }
        ];
      }

      return [];
    },
    bcrypt: {
      compare: async () => true,
      hash: async () => 'hashed-password'
    },
    buildSessionUser: (user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: '',
      profileImageUrl: null
    })
  });
  const session = {};

  const { res: loginResponse } = await invokeRoute(usersRouter, {
    body: { email: 'player@example.com', password: 'secret' },
    method: 'POST',
    session,
    url: '/login'
  });

  assert.equal(loginResponse.statusCode, 302);
  assert.equal(loginResponse.redirectUrl, '/');

  const { res: submitResponse } = await invokeRoute(indexRouter, {
    body: { responses: [] },
    method: 'POST',
    params: { cityId: '8' },
    session,
    url: '/cities/:cityId/game/submit'
  });

  assert.equal(submitResponse.statusCode, 200);
  assert.deepEqual(submitResponse.jsonBody, {
    city: { cityId: 8, cityName: 'Dallas', state: 'Texas' },
    totalPoints: 700,
    questionResults: [],
    saved: true,
    savedMessage: 'Your score has been saved.'
  });
  assert.deepEqual(recordedQueries.slice(-1), [
    {
      sql: 'INSERT INTO scores (user_id, score) VALUES (?, ?)',
      params: [12, 700]
    }
  ]);
});
