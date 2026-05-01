const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const userController = require('../../controllers/user.controller');
const userService = require('../../services/user.service');
const scoreRepository = require('../../repositories/score.repository');

afterEach(() => sinon.restore());

test('signup redirects to login after creating an account', async () => {
  const req = {
    body: {
      username: 'player1',
      email: 'player@example.com',
      password: 'secret'
    }
  };
  const res = {
    redirect: sinon.spy(),
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(userService, 'signup').resolves(12);

  await userController.signup(req, res);

  assert.equal(
    userService.signup.calledOnceWithExactly('player1', 'player@example.com', 'secret'),
    true
  );
  assert.equal(res.redirect.calledOnceWithExactly('/login'), true);
});

test('signup returns a 400 error for duplicate accounts', async () => {
  const req = {
    body: {
      username: 'player1',
      email: 'player@example.com',
      password: 'secret'
    }
  };
  const res = {
    redirect: sinon.spy(),
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };
  const error = new Error('duplicate');
  error.code = 'ER_DUP_ENTRY';

  sinon.stub(console, 'error');
  sinon.stub(userService, 'signup').rejects(error);

  await userController.signup(req, res);

  assert.equal(res.status.calledOnceWithExactly(400), true);
  assert.deepEqual(res.json.firstCall.args[0], {
    error: 'Username or email already exists'
  });
});

test('login saves a pending guest score and redirects to dashboard', async () => {
  const req = {
    body: { email: 'player@example.com', password: 'secret' },
    session: {
      pendingGuestScore: {
        totalPoints: 620
      }
    }
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(userService, 'login').resolves({
    user: {
      id: 12,
      username: 'player1',
      email: 'player@example.com'
    },
    storedProfile: {
      bio: 'Saved bio',
      profileImageUrl: null
    }
  });
  sinon.stub(scoreRepository, 'saveScore').resolves();

  await userController.login(req, res);

  assert.equal(scoreRepository.saveScore.calledOnceWithExactly(12, 620), true);
  assert.equal(req.session.pendingGuestScore, undefined);
  assert.equal(res.redirect.calledOnceWithExactly('/dashboard?scoreSaved=1'), true);
});

test('login redirects home when there is no pending guest score', async () => {
  const req = {
    body: { email: 'player@example.com', password: 'secret' },
    session: {}
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(userService, 'login').resolves({
    user: {
      id: 12,
      username: 'player1',
      email: 'player@example.com'
    },
    storedProfile: {
      bio: '',
      profileImageUrl: null
    }
  });
  sinon.stub(scoreRepository, 'saveScore').resolves();

  await userController.login(req, res);

  assert.equal(scoreRepository.saveScore.called, false);
  assert.equal(res.redirect.calledOnceWithExactly('/'), true);
});

test('login re-renders the form when credentials are invalid', async () => {
  const req = {
    body: { email: ' player@example.com ', password: 'wrong' },
    session: {}
  };
  const res = {
    redirect: sinon.spy(),
    render: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(console, 'error');
  sinon.stub(userService, 'login').rejects(new Error('Incorrect password'));

  await userController.login(req, res);

  assert.equal(res.status.calledOnceWithExactly(401), true);
  assert.equal(res.render.calledOnce, true);
  assert.equal(res.render.firstCall.args[0], 'login');
  assert.deepEqual(res.render.firstCall.args[1], {
    errorMessage: 'No user found with that email and password',
    email: 'player@example.com'
  });
});

test('deleteAccount requires a password', async () => {
  const req = {
    body: {},
    session: {
      user: { id: 12 }
    }
  };
  const res = {
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  await userController.deleteAccount(req, res);

  assert.equal(res.status.calledOnceWithExactly(401), true);
  assert.equal(res.send.calledOnceWithExactly('Password is required.'), true);
});

test('deleteAccount logs the user out after a successful delete', async () => {
  const req = {
    body: { password: 'secret' },
    session: {
      user: { id: 12 },
      destroy(callback) {
        callback(null);
      }
    }
  };
  const res = {
    redirect: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(userService, 'deleteAccount').resolves();

  await userController.deleteAccount(req, res);

  assert.equal(userService.deleteAccount.calledOnceWithExactly(12, 'secret'), true);
  assert.equal(res.redirect.calledOnceWithExactly('/'), true);
});

test('deleteAccount returns a 400 error when deletion fails', async () => {
  const req = {
    body: { password: 'wrong' },
    session: {
      user: { id: 12 }
    }
  };
  const res = {
    redirect: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(console, 'error');
  sinon.stub(userService, 'deleteAccount').rejects(new Error('Incorrect password.'));

  await userController.deleteAccount(req, res);

  assert.equal(res.status.calledOnceWithExactly(400), true);
  assert.equal(res.send.calledOnceWithExactly('Incorrect password.'), true);
});
