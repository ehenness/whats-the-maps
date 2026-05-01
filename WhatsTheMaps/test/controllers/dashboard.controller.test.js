const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const dashboardController = require('../../controllers/dashboard.controller');
const dashboardService = require('../../services/dashboard.service');

afterEach(() => sinon.restore());

test('getDashboard redirects to login when the user profile cannot be loaded', async () => {
  const req = {
    query: {},
    session: { user: { id: 12 } }
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(dashboardService, 'getDashboardProfile').resolves(null);

  await dashboardController.getDashboard(req, res);

  assert.equal(res.redirect.calledOnceWithExactly('/login'), true);
});

test('getDashboard renders the editable dashboard with status messages', async () => {
  const req = {
    query: {
      edit: '1',
      updated: '1',
      error: 'image'
    },
    session: { user: { id: 12 } }
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };
  const data = {
    profile: {
      userId: 12,
      username: 'player12',
      bio: 'Space City fan',
      profileImageUrl: '/images/avatars/Dr_Horn1.jpeg'
    },
    stats: {
      quizzesPlayed: 10,
      totalPoints: 6000,
      bestScore: 800,
      averageScore: 600,
      highestLeaderboardRank: 2
    }
  };

  sinon.stub(dashboardService, 'getDashboardProfile').resolves(data);

  await dashboardController.getDashboard(req, res);

  assert.equal(res.render.calledOnce, true);
  assert.equal(res.render.firstCall.args[0], 'dashboard');
  assert.deepEqual(
    {
      isEditing: res.render.firstCall.args[1].isEditing,
      isReadOnlyProfile: res.render.firstCall.args[1].isReadOnlyProfile,
      isOwnProfile: res.render.firstCall.args[1].isOwnProfile,
      profile: res.render.firstCall.args[1].profile,
      stats: res.render.firstCall.args[1].stats,
      successMessage: res.render.firstCall.args[1].successMessage,
      errorMessage: res.render.firstCall.args[1].errorMessage
    },
    {
      isEditing: true,
      isReadOnlyProfile: false,
      isOwnProfile: true,
      profile: data.profile,
      stats: data.stats,
      successMessage: 'Profile updated.',
      errorMessage:
        'That image could not be saved. Try a smaller file or image dimensions.'
    }
  );
  assert.equal(Array.isArray(res.render.firstCall.args[1].presetAvatars), true);
});

test('getDashboard returns a 500 error when the dashboard load fails', async () => {
  const req = {
    query: {},
    session: { user: { id: 12 } }
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(console, 'error');
  sinon.stub(dashboardService, 'getDashboardProfile').rejects(new Error('boom'));

  await dashboardController.getDashboard(req, res);

  assert.equal(res.status.calledOnceWithExactly(500), true);
  assert.equal(res.send.calledOnceWithExactly('Error loading dashboard.'), true);
});

test('getPlayerProfile rejects invalid player ids', async () => {
  const req = {
    params: { userId: 'abc' },
    session: {}
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  await dashboardController.getPlayerProfile(req, res);

  assert.equal(res.status.calledOnceWithExactly(404), true);
  assert.equal(res.send.calledOnceWithExactly('Player not found.'), true);
});

test('getPlayerProfile redirects to the main dashboard for the signed-in user', async () => {
  const req = {
    params: { userId: '12' },
    session: { user: { id: 12 } }
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  await dashboardController.getPlayerProfile(req, res);

  assert.equal(res.redirect.calledOnceWithExactly('/dashboard'), true);
});

test('getPlayerProfile returns 404 when the player does not exist', async () => {
  const req = {
    params: { userId: '33' },
    session: {}
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(dashboardService, 'getDashboardProfile').resolves(null);

  await dashboardController.getPlayerProfile(req, res);

  assert.equal(res.status.calledOnceWithExactly(404), true);
  assert.equal(res.send.calledOnceWithExactly('Player not found.'), true);
});

test('getPlayerProfile renders the read-only dashboard for other players', async () => {
  const req = {
    params: { userId: '34' },
    session: { user: { id: 12 } }
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };
  const data = {
    profile: {
      userId: 34,
      username: 'player34',
      bio: 'Ready to compete',
      profileImageUrl: null
    },
    stats: {
      quizzesPlayed: 7,
      totalPoints: 4100,
      bestScore: 700,
      averageScore: 586,
      highestLeaderboardRank: 4
    }
  };

  sinon.stub(dashboardService, 'getDashboardProfile').resolves(data);

  await dashboardController.getPlayerProfile(req, res);

  assert.equal(res.render.calledOnceWithExactly('dashboard', {
    isEditing: false,
    isReadOnlyProfile: true,
    isOwnProfile: false,
    profile: data.profile,
    presetAvatars: [],
    stats: data.stats,
    successMessage: null,
    errorMessage: null
  }), true);
});

test('getPlayerProfile returns a 500 error when the profile load fails', async () => {
  const req = {
    params: { userId: '34' },
    session: {}
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(console, 'error');
  sinon.stub(dashboardService, 'getDashboardProfile').rejects(new Error('boom'));

  await dashboardController.getPlayerProfile(req, res);

  assert.equal(res.status.calledOnceWithExactly(500), true);
  assert.equal(res.send.calledOnceWithExactly('Error loading player profile.'), true);
});
