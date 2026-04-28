const { expect } = require('chai');
const sinon = require('sinon');
const gameController = require('../../controllers/game.controller');
const gameService = require('../../services/game.service');

describe('game.controller submitQuiz', () => {

  afterEach(() => sinon.restore());

  it('stores guest score in session', async () => {
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

    expect(req.session.pendingGuestScore.totalPoints).to.equal(150);
  });

  it('does NOT store session score for logged-in user', async () => {
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

    expect(req.session.pendingGuestScore).to.be.undefined;
  });

});