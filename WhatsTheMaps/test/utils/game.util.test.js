const test = require('node:test');
const assert = require('node:assert/strict');

const {
  aggregateResults,
  buildQuizFromData,
  calculateQuestionScore,
  calculateQuizResultFromQuiz,
  clampResponseTime,
  evaluateQuestion,
  groupFactsByCityId,
  normalizeFactRows,
  processCities,
  splitScorePool
} = require('../../utils/game.util');

const constants = {
  MAX_STREAK: 5,
  STREAK_BONUS_STEP: 5,
  TIME_LIMIT: 15000
};

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

test('splitScorePool splits evenly', () => {
  assert.deepEqual(splitScorePool(10, 3), [4, 3, 3]);
});

test('returns empty array for invalid count', () => {
  assert.deepEqual(splitScorePool(10, 0), []);
});

test('calculateQuizResult works for correct answer', () => {
  const mockQuiz = {
    city: { cityId: 1 },
    questionTimeLimitMs: 15000,
    questions: [
      {
        questionId: 1,
        correctAnswerId: 10,
        correctAnswerText: 'Correct',
        possibleAnswers: [{ answerId: 10, answerText: 'Correct' }]
      }
    ]
  };

  const result = calculateQuizResultFromQuiz(mockQuiz, [
    { questionId: 1, answerId: 10, responseTimeMs: 3000 }
  ]);

  assert.equal(result.totalQuestions, 1);
  assert.equal(result.correctAnswers, 1);
  assert.equal(result.baseScore, 120);
  assert.equal(result.streakBonusTotal, 5);
  assert.equal(result.totalPoints, 125);
});

test('buildQuizFromData builds quiz correctly', () => {
  const quiz = buildQuizFromData(createCities(), createPopulationFacts(), 1);

  assert.ok(quiz);
  assert.deepEqual(quiz.city, { cityId: 1, cityName: 'Austin', state: 'Texas' });
  assert.equal(quiz.questions.length, 1);
  assert.equal(quiz.questions[0].possibleAnswers.length, 4);
});

test('buildQuizFromData returns null when the city is missing', () => {
  const quiz = buildQuizFromData(createCities(), createPopulationFacts(), 99);

  assert.equal(quiz, null);
});

test('buildQuizFromData returns null when a city lacks enough distractors', () => {
  const quiz = buildQuizFromData(
    [{ cityId: 1, cityName: 'Austin', state: 'Texas' }],
    [createPopulationFacts()[0]],
    1
  );

  assert.equal(quiz, null);
});

test('returns zero values for incorrect answer', () => {
  const result = calculateQuestionScore({
    isCorrect: false,
    responseTimeMs: 5000,
    basePoints: 100,
    speedPoints: 50,
    currentStreak: 2,
    constants
  });

  assert.equal(result.basePoints, 0);
  assert.equal(result.speedBonus, 0);
  assert.equal(result.streakBonus, 0);
  assert.equal(result.newStreak, 0);
});

test('calculates correct scoring for correct answer', () => {
  const result = calculateQuestionScore({
    isCorrect: true,
    responseTimeMs: 5000,
    basePoints: 100,
    speedPoints: 50,
    currentStreak: 1,
    constants
  });

  assert.equal(result.basePoints, 100);
  assert.ok(result.speedBonus >= 0);
  assert.equal(result.streakBonus, 10);
  assert.equal(result.newStreak, 2);
});

test('aggregates totals correctly', () => {
  const results = [
    { totalPoints: 100, basePoints: 80, speedBonus: 10, streakBonus: 10, isCorrect: true },
    { totalPoints: 50, basePoints: 50, speedBonus: 0, streakBonus: 0, isCorrect: false }
  ];

  const totals = aggregateResults(results);

  assert.equal(totals.totalPoints, 150);
  assert.equal(totals.baseScore, 140);
  assert.equal(totals.streakBonusTotal, 10);
  assert.equal(totals.correctAnswers, 1);
});

test('clamps response time correctly', () => {
  assert.equal(clampResponseTime(-100), 0);
  assert.ok(clampResponseTime(999999) <= 15000);
});

test('handles unanswered question', () => {
  const question = {
    questionId: 1,
    correctAnswerId: 10,
    correctAnswerText: 'Correct',
    possibleAnswers: []
  };

  const { result } = evaluateQuestion({
    question,
    response: null,
    index: 0,
    correctnessPoints: [100],
    speedPoints: [50],
    currentStreak: 0,
    constants
  });

  assert.equal(result.isCorrect, false);
});

test('groups facts by cityId', () => {
  const facts = [{ cityId: 1 }, { cityId: 1 }, { cityId: 2 }];
  const map = groupFactsByCityId(facts);

  assert.equal(map.get(1).length, 2);
  assert.equal(map.get(2).length, 1);
});

test('normalizeFactRows formats valid facts and drops undiplayable rows', () => {
  const facts = normalizeFactRows([
    {
      factId: 1,
      cityId: 1,
      cityName: 'Austin',
      state: 'Texas',
      factTypeId: 1,
      factTypeName: 'population',
      dataType: 'number',
      unit: 'people',
      valueNumber: 974447,
      valueText: null,
      valueBoolean: null
    },
    {
      factId: 2,
      cityId: 1,
      cityName: 'Austin',
      state: 'Texas',
      factTypeId: 7,
      factTypeName: 'nickname',
      dataType: 'text',
      unit: null,
      valueNumber: null,
      valueText: '   ',
      valueBoolean: null
    }
  ]);

  assert.deepEqual(facts, [
    {
      factId: 1,
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
    }
  ]);
});

test('processCities filters by state, sorts results, and enriches city cards', () => {
  const cities = [
    { cityId: 1, cityName: 'Austin', state: 'Texas' },
    { cityId: 2, cityName: 'Boston', state: 'Massachusetts' },
    { cityId: 3, cityName: 'Dallas', state: 'Texas' }
  ];
  const facts = [
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
  ];

  const result = processCities(cities, facts, { state: 'Texas', sort: 'alpha-desc' });

  assert.deepEqual(result.map((city) => city.cityName), ['Dallas', 'Austin']);
  assert.equal(result[1].description, 'Live Music Capital');
  assert.deepEqual(result[1].cityInfo, [
    { label: 'Nickname', value: 'Live Music Capital' },
    { label: 'Population', value: '974,447' }
  ]);
});
