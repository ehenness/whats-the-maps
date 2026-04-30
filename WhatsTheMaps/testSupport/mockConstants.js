const fakeGameRepository = {
  getCityRows: sinon.stub(),
  getAllFacts: sinon.stub()
};

const fakeScoreRepository = {
  saveScore: sinon.stub()
};

const fakeGameUtil = {
  buildQuizFromData: sinon.stub(),
  calculateQuizResultFromQuiz: sinon.stub()
};

const gameService = createGameService({
  gameRepository: fakeGameRepository,
  scoreRepository: fakeScoreRepository,
  gameUtil: fakeGameUtil
});

module.exports = {fakeGameRepository, fakeScoreRepository, fakeGameUtil, createGameService}