const { expect } = require('chai');
const sinon = require('sinon');

const gameService = require('../../services/game.service');
const gameRepository = require('../../repositories/game.repository');

describe('game.service', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('getRandomCity', () => {
    it('returns null if no cities exist', async () => {
      sinon.stub(gameRepository, 'getCityRows').resolves([]);

      const result = await gameService.getHomeData();

      expect(result.randomCity).to.equal(null);
    });

    it('returns a random city', async () => {
      const mockCities = [
        { cityId: 1, cityName: 'Austin' },
        { cityId: 2, cityName: 'Dallas' }
      ];

      sinon.stub(gameRepository, 'getCityRows').resolves(mockCities);

      const result = await gameService.getHomeData();

      expect(mockCities).to.include(result.randomCity);
    });
  });

  describe('calculateQuizResult', () => {

    it('calculates quiz results correctly', async () => {

      const mockQuiz = {
        city: { cityId: 1, cityName: 'Austin' },
        questionTimeLimitMs: 15000,
        questions: [
          {
            questionId: 1,
            correctAnswerId: 10,
            correctAnswerText: 'Correct',
            possibleAnswers: [
              { answerId: 10, answerText: 'Correct' }
            ]
          }
        ]
      };

      // IMPORTANT: stub internal dependency
      sinon.stub(gameService, 'buildQuizForCity').resolves(mockQuiz);

      const responses = [
        { questionId: 1, answerId: 10, responseTimeMs: 3000 }
      ];

      const result = await gameService.calculateQuizResult(1, responses);

      expect(result.totalQuestions).to.equal(1);
      expect(result.correctAnswers).to.equal(1);
      expect(result.totalPoints).to.be.greaterThan(0);
    });

  });
  
  describe('submitQuiz', () => {

    afterEach(() => sinon.restore());

    it('returns null if quiz does not exist', async () => {
      sinon.stub(gameService, 'calculateQuizResult').resolves(null);

      const result = await gameService.submitQuiz(1, [], null);

      expect(result).to.equal(null);
    });

    it('returns unsaved result for guest user', async () => {
      sinon.stub(gameService, 'calculateQuizResult').resolves({
        totalPoints: 100
      });

      const result = await gameService.submitQuiz(1, [], null);

      expect(result.saved).to.equal(false);
      expect(result.savedMessage).to.exist;
    });

    it('saves score for logged-in user', async () => {
      sinon.stub(gameService, 'calculateQuizResult').resolves({
        totalPoints: 200
      });

      sinon.stub(scoreRepository, 'saveScore').resolves();

      const result = await gameService.submitQuiz(1, [], { id: 5 });

      expect(result.saved).to.equal(true);
    });

    it('handles DB failure gracefully', async () => {
      sinon.stub(gameService, 'calculateQuizResult').resolves({
        totalPoints: 300
      });

      sinon.stub(scoreRepository, 'saveScore').rejects(new Error('DB fail'));

      const result = await gameService.submitQuiz(1, [], { id: 5 });

      expect(result.saved).to.equal(false);
      expect(result.savedMessage).to.include('could not be saved');
    });

  });

});