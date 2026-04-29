const test = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const gameService = require('../../services/game.service');
const gameRepository = require('../../repositories/game.repository');
const scoreRepository = require('../../repositories/score.repository');
const gameUtil = require('../../utils/game.util');

const {afterEach} = require('node:test');
afterEach(() => sinon.restore());

test('getRandomCity returns null if no cities exist', async () => {
  sinon.stub(gameRepository, 'getCityRows').resolves([]);

  const result = await gameService.getHomeData();

  assert.equal(result.randomCity, null);
});

test('getRandomCity returns a random city', async () => {
  const mockCities = [
    { cityId: 1, cityName: 'Austin' },
    { cityId: 2, cityName: 'Dallas' }
  ];

  sinon.stub(gameRepository, 'getCityRows').resolves(mockCities);

  const result = await gameService.getHomeData();

  assert.ok(mockCities.includes(result.randomCity));
});


test('submitQuiz returns null if quiz missing', async () => {
  sinon.stub(gameService, 'buidlQuizForCity').resolves(null);

  const result = await gameService.submitQuiz(1, [], null);

  assert.equal(result, null);
});

test('submitQuiz handles guest user', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves({
    city: { cityId: 1 },
    questionTimeLimitMs: 15000,
    questions: []
  });

  sinon.stub(gameUtil, 'calculateQuizResultFromQuiz').returns({
    totalPoints: 100
  });

  const result = await gameService.submitQuiz(1, [], null);

  assert.equal(result.saved, false);
  assert.ok(result.savedMessage);
});

test('buildQuizForCity works', async () => {
  const mockCities = [
    { cityId: 1, cityName: 'Austin', state: 'TX' }
  ];

  const mockFacts = [
    { factId: 1, cityId: 1, factType: 'population', value: 1000000 },
    { factId: 2, cityId: 2, factType: 'population', value: 500000 }
  ];

  sinon.stub(gameRepository, 'getCityRows').resolves(mockCities);
  sinon.stub(gameRepository, 'getAllFacts').resolves(mockFacts);

  const quiz = await gameService.buildQuizForCity(1);

  assert.ok(quiz);
  assert.equal(quiz.city.cityId, 1);
  assert.ok(Array.isArray(quiz.questions));
  assert.ok(quiz.questions.length > 0);
});

test('submitQuiz saves score for logged-in user', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves({
    city: { cityId: 1 },
    questionTimeLimitMs: 15000,
    questions: []
  });

  sinon.stub(gameUtil, 'calculateQuizResultFromQuiz').returns({
    totalPoints: 200
  });

  sinon.stub(scoreRepository, 'saveScore').resolves();

  const result = await gameService.submitQuiz(1, [], { id: 5 });

  assert.equal(result.saved, true);
});

test('submitQuiz handles DB failure', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves({
    city: { cityId: 1 },
    questionTimeLimitMs: 15000,
    questions: []
  });

  sinon.stub(gameUtil, 'calculateQuizResultFromQuiz').returns({
    totalPoints: 300
  });

  sinon.stub(scoreRepository, 'saveScore').rejects(new Error('fail'));

  const result = await gameService.submitQuiz(1, [], { id: 5 });

  assert.equal(result.saved, false);
  assert.match(result.savedMessage, /could not be saved/i);
});