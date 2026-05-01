const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const pageController = require('../../controllers/page.controller');
const gameService = require('../../services/game.service');

afterEach(() => sinon.restore());

test('getHomePage renders the home view with a random city', async () => {
  const randomCity = { cityId: 4, cityName: 'Houston', state: 'Texas' };
  const req = {};
  const res = {
    render: sinon.spy()
  };

  sinon.stub(gameService, 'getHomeData').resolves({ randomCity });

  await pageController.getHomePage(req, res);

  assert.equal(res.render.calledOnceWithExactly('home', { randomCity }), true);
});

test('getHomePage falls back to an empty random city when loading fails', async () => {
  const req = {};
  const res = {
    render: sinon.spy()
  };

  sinon.stub(console, 'error');
  sinon.stub(gameService, 'getHomeData').rejects(new Error('boom'));

  await pageController.getHomePage(req, res);

  assert.equal(res.render.calledOnceWithExactly('home', { randomCity: null }), true);
});

test('getSignupPage renders the signup view', () => {
  const req = {};
  const res = {
    render: sinon.spy()
  };

  pageController.getSignupPage(req, res);

  assert.equal(res.render.calledOnceWithExactly('signup'), true);
});

test('getLoginPage renders the login view with the default view model', () => {
  const req = {};
  const res = {
    render: sinon.spy()
  };

  pageController.getLoginPage(req, res);

  assert.equal(res.render.calledOnce, true);
  assert.equal(res.render.firstCall.args[0], 'login');
  assert.deepEqual(res.render.firstCall.args[1], {
    errorMessage: null,
    email: ''
  });
});
