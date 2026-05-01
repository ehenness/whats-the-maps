const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const gameService = require('../../services/game.service');
const gameRepository = require('../../repositories/game.repository');
const scoreRepository = require('../../repositories/score.repository');
const gameUtil = require('../../utils/game.util');

afterEach(() => sinon.restore());

function createCities() {
  return [
    { cityId: 1, cityName: 'Austin', state: 'Texas' },
    { cityId: 2, cityName: 'Dallas', state: 'Texas' },
    { cityId: 3, cityName: 'Houston', state: 'Texas' },
    { cityId: 4, cityName: 'El Paso', state: 'Texas' }
  ];
}

function createPopulationFacts() {
  return [
    {
      factId: 11,
      cityId: 1,
      cityName: 'Austin',
      state: 'Texas',
      factTypeId: 1,
      factTypeName: 'population',
      dataType: 'number',
      unit: 'people',
      valueNumber: 974447,
      valueText: null,
      valueBoolean: null,
      answerText: '974,447'
    },
    {
      factId: 12,
      cityId: 2,
      cityName: 'Dallas',
      state: 'Texas',
      factTypeId: 1,
      factTypeName: 'population',
      dataType: 'number',
      unit: 'people',
      valueNumber: 1304379,
      valueText: null,
      valueBoolean: null,
      answerText: '1,304,379'
    },
    {
      factId: 13,
      cityId: 3,
      cityName: 'Houston',
      state: 'Texas',
      factTypeId: 1,
      factTypeName: 'population',
      dataType: 'number',
      unit: 'people',
      valueNumber: 2304580,
      valueText: null,
      valueBoolean: null,
      answerText: '2,304,580'
    },
    {
      factId: 14,
      cityId: 4,
      cityName: 'El Paso',
      state: 'Texas',
      factTypeId: 1,
      factTypeName: 'population',
      dataType: 'number',
      unit: 'people',
      valueNumber: 678815,
      valueText: null,
      valueBoolean: null,
      answerText: '678,815'
    }
  ];
}

test('getRandomCity returns null if no cities exist', async () => {
  sinon.stub(gameRepository, 'getCityRows').resolves([]);

  const result = await gameService.getHomeData();

  assert.equal(result.randomCity, null);
});

test('getRandomCity returns a random city', async () => {
  const mockCities = createCities();
  sinon.stub(gameRepository, 'getCityRows').resolves(mockCities);

  const result = await gameService.getHomeData();

  assert.ok(mockCities.includes(result.randomCity));
});

test('submitQuiz returns null if quiz missing', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves(null);

  const result = await gameService.submitQuiz(1, [], null);

  assert.equal(result, null);
});

test('submitQuiz handles guest user', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves({
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    questionTimeLimitMs: 15000,
    questions: []
  });
  sinon.stub(gameUtil, 'calculateQuizResultFromQuiz').returns({
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    totalPoints: 100,
    questionResults: []
  });

  const result = await gameService.submitQuiz(1, [], null);

  assert.deepEqual(result, {
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    totalPoints: 100,
    questionResults: [],
    saved: false,
    savedMessage: 'Log in to save your score to the dashboard.'
  });
});

test('buildQuizForCity builds a quiz when enough distractors exist', async () => {
  sinon.stub(gameRepository, 'getCityRows').resolves(createCities());
  sinon.stub(gameRepository, 'getAllFacts').resolves(createPopulationFacts());

  const quiz = await gameService.buildQuizForCity(1);

  assert.ok(quiz);
  assert.deepEqual(quiz.city, { cityId: 1, cityName: 'Austin', state: 'Texas' });
  assert.equal(quiz.questions.length, 1);
  assert.equal(quiz.questions[0].possibleAnswers.length, 4);
});

test('submitQuiz saves score for logged-in user', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves({
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    questionTimeLimitMs: 15000,
    questions: []
  });
  sinon.stub(gameUtil, 'calculateQuizResultFromQuiz').returns({
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    totalPoints: 200,
    questionResults: []
  });
  sinon.stub(scoreRepository, 'saveScore').resolves();

  const result = await gameService.submitQuiz(1, [], { id: 5 });

  assert.equal(result.saved, true);
  assert.equal(result.savedMessage, 'Your score has been saved.');
  assert.equal(scoreRepository.saveScore.calledOnceWithExactly(5, 200), true);
});

test('submitQuiz handles DB failure', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves({
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    questionTimeLimitMs: 15000,
    questions: []
  });
  sinon.stub(gameUtil, 'calculateQuizResultFromQuiz').returns({
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    totalPoints: 300,
    questionResults: []
  });
  sinon.stub(scoreRepository, 'saveScore').rejects(new Error('fail'));

  const result = await gameService.submitQuiz(1, [], { id: 5 });

  assert.equal(result.saved, false);
  assert.match(result.savedMessage, /could not be saved/i);
});
