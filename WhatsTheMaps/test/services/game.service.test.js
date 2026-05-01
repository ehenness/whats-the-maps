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

function createCityFacts() {
  return [
    {
      factId: 21,
      cityId: 1,
      cityName: 'Austin',
      state: 'Texas',
      factTypeId: 7,
      factTypeName: 'nickname',
      dataType: 'text',
      unit: null,
      valueNumber: null,
      valueText: 'Live Music Capital',
      valueBoolean: null,
      answerText: 'Live Music Capital'
    },
    {
      factId: 22,
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
      factId: 23,
      cityId: 2,
      cityName: 'Boston',
      state: 'Massachusetts',
      factTypeId: 1,
      factTypeName: 'population',
      dataType: 'number',
      unit: 'people',
      valueNumber: 675647,
      valueText: null,
      valueBoolean: null,
      answerText: '675,647'
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

test('getStates de-duplicates and sorts states alphabetically', async () => {
  sinon.stub(gameRepository, 'getCityRows').resolves([
    { cityId: 1, cityName: 'Austin', state: 'Texas' },
    { cityId: 2, cityName: 'Dallas', state: 'Texas' },
    { cityId: 3, cityName: 'Boston', state: 'Massachusetts' },
    { cityId: 4, cityName: 'Mystery City', state: '' }
  ]);

  const states = await gameService.getStates();

  assert.deepEqual(states, ['Massachusetts', 'Texas']);
});

test('getCities filters and sorts city cards using their facts', async () => {
  sinon.stub(gameRepository, 'getCityRows').resolves([
    { cityId: 1, cityName: 'Austin', state: 'Texas' },
    { cityId: 2, cityName: 'Boston', state: 'Massachusetts' },
    { cityId: 3, cityName: 'Dallas', state: 'Texas' }
  ]);
  sinon.stub(gameRepository, 'getAllFacts').resolves([
    ...createCityFacts(),
    {
      factId: 24,
      cityId: 3,
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
    }
  ]);

  const cities = await gameService.getCities({ state: 'Texas', sort: 'alpha-desc' });

  assert.deepEqual(cities.map((city) => city.cityName), ['Dallas', 'Austin']);
  assert.equal(cities[1].description, 'Live Music Capital');
  assert.deepEqual(cities[1].cityInfo, [
    { label: 'Nickname', value: 'Live Music Capital' },
    { label: 'Population', value: '974,447' }
  ]);
});

test('getCitiesData returns city list, random city, and selected filters', async () => {
  sinon.stub(gameRepository, 'getCityRows').resolves([
    { cityId: 1, cityName: 'Austin', state: 'Texas' },
    { cityId: 2, cityName: 'Boston', state: 'Massachusetts' }
  ]);
  sinon.stub(gameRepository, 'getAllFacts').resolves(createCityFacts());
  sinon.stub(Math, 'random').returns(0);

  const data = await gameService.getCitiesData({ state: 'Massachusetts', sort: 'alpha-desc' });

  assert.equal(data.selectedState, 'Massachusetts');
  assert.equal(data.selectedSort, 'alpha-desc');
  assert.deepEqual(data.states, ['Massachusetts', 'Texas']);
  assert.deepEqual(data.cities.map((city) => city.cityName), ['Boston']);
  assert.deepEqual(data.randomCity, { cityId: 1, cityName: 'Austin', state: 'Texas' });
});

test('getQuiz returns null when the city has no quiz data', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves(null);

  const result = await gameService.getQuiz(99);

  assert.equal(result, null);
});

test('getQuiz strips server-only answer keys before returning quiz data', async () => {
  sinon.stub(gameService, 'buildQuizForCity').resolves({
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    questionTimeLimitMs: 15000,
    questions: [
      {
        questionId: 11,
        cityId: 1,
        questionText: 'What is the population of Austin?',
        correctAnswerId: 11,
        correctAnswerText: '974,447',
        possibleAnswers: [{ answerId: 11, answerText: '974,447' }]
      }
    ]
  });

  const result = await gameService.getQuiz(1);

  assert.deepEqual(result, {
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    quizData: {
      city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
      questionTimeLimitMs: 15000,
      questions: [
        {
          questionId: 11,
          cityId: 1,
          questionText: 'What is the population of Austin?',
          possibleAnswers: [{ answerId: 11, answerText: '974,447' }]
        }
      ]
    }
  });
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

test('submitQuizFromQuiz preserves selected wrong-answer text from the served quiz', async () => {
  const quiz = {
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    questionTimeLimitMs: 15000,
    questions: [
      {
        questionId: 31,
        cityId: 1,
        questionText: 'What is the population of Austin?',
        correctAnswerId: 31,
        correctAnswerText: '974,447',
        possibleAnswers: [
          { answerId: 31, answerText: '974,447' },
          { answerId: 32, answerText: '1,304,379' },
          { answerId: 33, answerText: '2,304,580' },
          { answerId: 34, answerText: '678,815' }
        ]
      }
    ]
  };

  const result = await gameService.submitQuizFromQuiz(
    quiz,
    [{ questionId: 31, answerId: 32, responseTimeMs: 4000 }],
    null
  );

  assert.equal(result.questionResults[0].isCorrect, false);
  assert.equal(result.questionResults[0].selectedAnswerText, '1,304,379');
  assert.equal(result.questionResults[0].correctAnswerText, '974,447');
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
  sinon.stub(console, 'error');
  sinon.stub(scoreRepository, 'saveScore').rejects(new Error('fail'));

  const result = await gameService.submitQuiz(1, [], { id: 5 });

  assert.equal(result.saved, false);
  assert.match(result.savedMessage, /could not be saved/i);
});
