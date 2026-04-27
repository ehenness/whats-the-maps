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
      overrides.buildSessionUser ||
      ((user, storedProfile = {}) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        bio: storedProfile.bio || '',
        profileImageUrl: storedProfile.profileImageUrl || null
      })),
    buildLoginViewModel:
      overrides.buildLoginViewModel || ((viewModel = {}) => ({ errorMessage: null, email: '', ...viewModel }))
  });
}

test('POST /users/login re-renders the login page for invalid credentials', async () => {
  const usersRouter = createStubUsersRouter({
    runQuery: async () => []
  });
  const { res } = await invokeRoute(usersRouter, {
    body: { email: ' missing@example.com ', password: 'wrong' },
    method: 'POST',
    session: {},
    url: '/login'
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.viewName, 'login');
  assert.deepEqual(res.viewData, {
    errorMessage: 'No user found with that email and password',
    email: 'missing@example.com'
  });
});

test('POST /users/update-profile rejects oversized or invalid uploaded images', async () => {
  const usersRouter = createStubUsersRouter({
    maxUploadedImageLength: 20
  });
  const session = {
    user: {
      id: 15,
      username: 'player15',
      email: 'player15@example.com',
      bio: '',
      profileImageUrl: null
    }
  };

  const { res: updateResponse } = await invokeRoute(usersRouter, {
    body: {
      bio: 'Updated bio',
      uploadedImageData: 'data:image/png;base64,this-image-is-too-large'
    },
    method: 'POST',
    session,
    url: '/update-profile'
  });

  assert.equal(updateResponse.statusCode, 302);
  assert.equal(updateResponse.redirectUrl, '/dashboard?edit=1&error=image');
});

test('POST /users/update-profile saves valid profile changes for a logged-in user', async () => {
  const savedProfiles = [];

  const usersRouter = createStubUsersRouter({
    listPresetProfileImages: () => ['/images/avatars/Dr_Horn1.jpeg'],
    saveStoredProfile: (userId, profile) => {
      savedProfiles.push({ userId, profile });
      return true;
    }
  });
  const session = {
    user: {
      id: 18,
      username: 'player18',
      email: 'player18@example.com',
      bio: '',
      profileImageUrl: null
    }
  };

  const { res: updateResponse } = await invokeRoute(usersRouter, {
    body: {
      bio: '  New profile bio  ',
      selectedAvatar: '/images/avatars/Dr_Horn1.jpeg'
    },
    method: 'POST',
    session,
    url: '/update-profile'
  });

  assert.equal(updateResponse.statusCode, 302);
  assert.equal(updateResponse.redirectUrl, '/dashboard?updated=1');
  assert.deepEqual(savedProfiles, [
    {
      userId: 18,
      profile: {
        bio: 'New profile bio',
        profileImageUrl: '/images/avatars/Dr_Horn1.jpeg'
      }
    }
  ]);
  assert.deepEqual(session.user, {
    id: 18,
    username: 'player18',
    email: 'player18@example.com',
    bio: 'New profile bio',
    profileImageUrl: '/images/avatars/Dr_Horn1.jpeg'
  });
});
