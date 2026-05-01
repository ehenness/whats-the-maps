const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const gameController = require('../../controllers/game.controller');
const gameService = require('../../services/game.service');

afterEach(() => sinon.restore());

test('stores guest score in session', async () => {
  const req = {
    params: { cityId: 1 },
    body: { responses: [] },
    session: {}
  };

  const res = {
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'submitQuiz').resolves({
    totalPoints: 150,
    saved: false
  });

  await gameController.submitQuiz(req, res);

  assert.equal(req.session.pendingGuestScore.totalPoints, 150);
});

test('does not store session score for logged-in user', async () => {
  const req = {
    params: { cityId: 1 },
    body: { responses: [] },
    session: { user: { id: 10 } }
  };

  const res = {
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'submitQuiz').resolves({
    totalPoints: 150,
    saved: true
  });

  await gameController.submitQuiz(req, res);

  assert.equal(req.session.pendingGuestScore, undefined);
});