const test = require('node:test');
const assert = require('node:assert/strict');

const {
  QUESTION_TIME_LIMIT_MS,
  buildCityInfo,
  calculateQuizResultFromQuiz,
  formatFactValue,
  toClientQuiz
} = require('../../lib/quizUtils');

test('formatFactValue formats numbers, years, booleans, and text consistently', () => {
  assert.equal(
    formatFactValue({ dataType: 'number', valueNumber: 1837.4, unit: 'year' }),
    '1837'
  );
  assert.equal(
    formatFactValue({ dataType: 'number', valueNumber: 5280, unit: 'feet' }),
    '5,280 feet'
  );
  assert.equal(
    formatFactValue({ dataType: 'number', valueNumber: 1200000, unit: 'people' }),
    '1,200,000'
  );
  assert.equal(formatFactValue({ dataType: 'boolean', valueBoolean: 1 }), 'True');
  assert.equal(formatFactValue({ dataType: 'text', valueText: '  Space City  ' }), 'Space City');
  assert.equal(formatFactValue({ dataType: 'text', valueText: '   ' }), null);
});

test('buildCityInfo orders facts and avoids duplicate labels for nickname variants', () => {
  const cityInfo = buildCityInfo([
    { factTypeName: 'nearest_boarder', answerText: 'Louisiana' },
    { factTypeName: 'fun_fact', answerText: 'Space City' },
    { factTypeName: 'nickname', answerText: 'Bayou City' },
    { factTypeName: 'population', answerText: '2,314,157' }
  ]);

  assert.deepEqual(cityInfo, [
    { label: 'Nickname', value: 'Bayou City' },
    { label: 'Population', value: '2,314,157' },
    { label: 'Nearest Border', value: 'Louisiana' }
  ]);
});

test('toClientQuiz removes server-only answer keys before sending quiz data to the browser', () => {
  const clientQuiz = toClientQuiz({
    city: { cityId: 7, cityName: 'Houston', state: 'Texas' },
    questionTimeLimitMs: QUESTION_TIME_LIMIT_MS,
    questions: [
      {
        questionId: 11,
        cityId: 7,
        questionText: 'Which nickname is associated with Houston?',
        correctAnswerId: 99,
        correctAnswerText: 'Space City',
        possibleAnswers: [{ answerId: 99, answerText: 'Space City' }]
      }
    ]
  });

  assert.deepEqual(clientQuiz, {
    city: { cityId: 7, cityName: 'Houston', state: 'Texas' },
    questionTimeLimitMs: QUESTION_TIME_LIMIT_MS,
    questions: [
      {
        questionId: 11,
        cityId: 7,
        questionText: 'Which nickname is associated with Houston?',
        possibleAnswers: [{ answerId: 99, answerText: 'Space City' }]
      }
    ]
  });
});

test('calculateQuizResultFromQuiz scores correctness, speed, streaks, and unanswered questions', () => {
  const quiz = {
    city: { cityId: 7, cityName: 'Houston', state: 'Texas' },
    questionTimeLimitMs: QUESTION_TIME_LIMIT_MS,
    questions: [
      {
        questionId: 101,
        cityId: 7,
        questionText: 'Q1',
        correctAnswerId: 1,
        correctAnswerText: 'A',
        possibleAnswers: [{ answerId: 1, answerText: 'A' }]
      },
      {
        questionId: 102,
        cityId: 7,
        questionText: 'Q2',
        correctAnswerId: 2,
        correctAnswerText: 'B',
        possibleAnswers: [{ answerId: 2, answerText: 'B' }]
      },
      {
        questionId: 103,
        cityId: 7,
        questionText: 'Q3',
        correctAnswerId: 3,
        correctAnswerText: 'C',
        possibleAnswers: [{ answerId: 3, answerText: 'C' }]
      }
    ]
  };

  const result = calculateQuizResultFromQuiz(quiz, [
    { questionId: 101, answerId: 1, responseTimeMs: 0 },
    { questionId: 102, answerId: 2, responseTimeMs: QUESTION_TIME_LIMIT_MS + 500 }
  ]);

  assert.equal(result.baseScore, 584);
  assert.equal(result.streakBonusTotal, 5);
  assert.equal(result.totalPoints, 589);
  assert.equal(result.correctAnswers, 2);
  assert.equal(result.maxStreak, 2);
  assert.equal(result.totalQuestions, 3);
  assert.deepEqual(result.questionResults, [
    {
      questionId: 101,
      questionText: 'Q1',
      selectedAnswerText: 'A',
      correctAnswerText: 'A',
      isCorrect: true,
      responseTimeMs: 0,
      basePoints: 250,
      speedBonus: 84,
      streakBonus: 0,
      totalPoints: 334
    },
    {
      questionId: 102,
      questionText: 'Q2',
      selectedAnswerText: 'B',
      correctAnswerText: 'B',
      isCorrect: true,
      responseTimeMs: QUESTION_TIME_LIMIT_MS,
      basePoints: 250,
      speedBonus: 0,
      streakBonus: 5,
      totalPoints: 255
    },
    {
      questionId: 103,
      questionText: 'Q3',
      selectedAnswerText: 'No answer',
      correctAnswerText: 'C',
      isCorrect: false,
      responseTimeMs: QUESTION_TIME_LIMIT_MS,
      basePoints: 0,
      speedBonus: 0,
      streakBonus: 0,
      totalPoints: 0
    }
  ]);
});

test('calculateQuizResultFromQuiz returns null when no quiz is available', () => {
  assert.equal(calculateQuizResultFromQuiz(null, []), null);
});
