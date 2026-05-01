const test = require('node:test');
const assert = require('node:assert/strict');

const authMiddleware = require('../../middleware/auth.middleware');

test('redirectToLogin calls next for authenticated users', () => {
  let nextCalled = false;
  const req = {
    session: {
      user: { id: 12 }
    }
  };
  const res = {
    redirect() {
      throw new Error('should not redirect');
    }
  };

  authMiddleware.redirectToLogin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('redirectToLogin redirects guests to the login page', () => {
  let redirectedTo = null;
  const req = {
    session: {}
  };
  const res = {
    redirect(url) {
      redirectedTo = url;
      return this;
    }
  };

  authMiddleware.redirectToLogin(req, res, () => {
    throw new Error('should not call next');
  });

  assert.equal(redirectedTo, '/login');
});

test('requireSessionUser calls next for authenticated users', () => {
  let nextCalled = false;
  const req = {
    session: {
      user: { id: 14 }
    }
  };
  const res = {
    status() {
      throw new Error('should not set a status');
    }
  };

  authMiddleware.requireSessionUser(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('requireSessionUser returns a 401 error for guests', () => {
  let statusCode = null;
  let message = null;
  const req = {
    session: {}
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    send(payload) {
      message = payload;
      return this;
    }
  };

  authMiddleware.requireSessionUser(req, res, () => {
    throw new Error('should not call next');
  });

  assert.equal(statusCode, 401);
  assert.equal(message, 'You must be logged in.');
});
