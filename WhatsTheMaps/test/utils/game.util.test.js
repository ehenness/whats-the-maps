const { expect } = require('chai');
const sinon = require('sinon');
const {
  splitScorePool,
  calculateQuestionScore,
  aggregateResults,
  clampResponseTime,
  evaluateQuestion,
  groupFactsByCityId
} = require('../../utils/game.util');
const gameUtil = require('../../utils/game.util');
const test = require('node:test'); 
const assert = require('node:assert');
const constants = {
  MAX_STREAK: 5,
  STREAK_BONUS_STEP: 5,
  TIME_LIMIT: 15000
};
const {afterEach} = require('node:test');
afterEach(() => sinon.restore());


test('splitScorePool splits evenly', () => {
  const result = splitScorePool(10, 3);
  assert.deepEqual(result, [4, 3, 3]);
});
test('returns empty array for invalid count', () => {
    const result = splitScorePool(10, 0);
    assert.deepEqual(result, []);
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

  const result = gameUtil.calculateQuizResultFromQuiz(mockQuiz, [
    { questionId: 1, answerId: 10, responseTimeMs: 3000 }
  ]);

  assert.equal(result.totalQuestions, 1);
  assert.equal(result.correctAnswers, 1);
  assert.ok(result.totalPoints > 0);
});
test('buildQuizFromData builds quiz correctly', () => {
  const cities = [{ cityId: 1, name: 'Test City' }];
  const facts = [
    { cityId: 1, factType: 'population', value: 1000 }
  ];

  const quiz = gameUtil.buildQuizFromData(cities, facts, 1);

  assert.ok(quiz);
  assert.equal(quiz.city.cityId, 1);
  assert.ok(quiz.questions.length > 0);
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
  assert.equal(totals.correctAnswers, 1)
});
test('clamps response time correctly', () => {
  const result = clampResponseTime(-100);
  assert.equal(result, 0);

  const result2 = clampResponseTime(999999);
  assert.ok(result2 <= 15000);
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
    constants: {
      MAX_STREAK: 5,
      STREAK_BONUS_STEP: 5,
      TIME_LIMIT: 15000
    }
  });

  assert.equal(result.isCorrect, false);
});

test('groups facts by cityId', () => {
  const facts = [
    { cityId: 1 },
    { cityId: 1 },
    { cityId: 2 }
  ];

  const map = groupFactsByCityId(facts);

  assert.equal(map.get(1).length, 2);
  assert.equal(map.get(2).length, 1);
});