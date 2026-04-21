/** Builds quiz data, formats city facts, calculates quiz results */
const runQuery = require('./lib/runQuery');

const QUESTION_TIME_LIMIT_MS = 15_000;
const MAX_BASE_SCORE = 1_000;
const CORRECTNESS_SCORE_SHARE = 0.75;
const MAX_STREAK = 5;
const STREAK_BONUS_STEP = 5;
const ANSWERS_PER_QUESTION = 4;

// Prompt builders live near quiz rules so content wording is easy to maintain
const questionPrompts = {
  'founding_year:number': (city) => `In what year was ${city.cityName} founded?`,
  'elevation:number': (city) => `What is the elevation of ${city.cityName}?`,
  'population:number': (city) => `What is the population of ${city.cityName}?`,
  'tallest_structure:number': (city) => `How tall is the tallest structure in ${city.cityName}?`,
  'tallest_structure:text': (city) => `What is the tallest structure in ${city.cityName}?`,
  'nearest_boarder:text': (city) => `Which nearby border or neighboring place is listed for ${city.cityName}?`,
  'nearest_border:text': (city) => `Which nearby border or neighboring place is listed for ${city.cityName}?`,
  'fun_fact:text': (city) => `Which nickname is associated with ${city.cityName}?`,
  'nickname:text': (city) => `Which nickname is associated with ${city.cityName}?`
};

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

// Split available points evenly
function splitScorePool(totalPoints, itemsCount) {
  if (itemsCount <= 0) {
    return [];
  }

  const baseAmount = Math.floor(totalPoints / itemsCount);
  const remainder = totalPoints % itemsCount;

  return Array.from({ length: itemsCount }, (_, index) =>
    baseAmount + (index < remainder ? 1 : 0)
  );
}

function clampResponseTime(responseTimeMs) {
  return Math.min(
    QUESTION_TIME_LIMIT_MS,
    Math.max(0, Number(responseTimeMs) || QUESTION_TIME_LIMIT_MS)
  );
}

function normalizeNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return numericValue;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Number.isInteger(value) ? value.toLocaleString('en-US') : value.toLocaleString('en-US');
}

// Normalize raw database values into readable answer text for quiz UI
function formatFactValue(fact) {
  if (fact.dataType === 'number') {
    const numericValue = normalizeNumber(fact.valueNumber);

    if (numericValue === null) {
      return null;
    }

    if (fact.unit === 'year') {
      return String(Math.round(numericValue));
    }

    const formattedNumber = formatNumber(numericValue);
    return fact.unit && fact.unit !== 'people' ? `${formattedNumber} ${fact.unit}` : formattedNumber;
  }

  if (fact.dataType === 'boolean') {
    return fact.valueBoolean ? 'True' : 'False';
  }

  return typeof fact.valueText === 'string' && fact.valueText.trim() ? fact.valueText.trim() : null;
}

function buildQuestionText(fact) {
  const promptKey = `${fact.factTypeName}:${fact.dataType}`;
  const promptBuilder = questionPrompts[promptKey];

  if (promptBuilder) {
    return promptBuilder(fact);
  }

  return `Which answer matches ${fact.cityName}'s ${fact.factTypeName.replaceAll('_', ' ')}?`;
}

function buildCityDescription(city, facts = []) {
  const nickname = facts.find(
    (fact) =>
      (fact.factTypeName === 'fun_fact' || fact.factTypeName === 'nickname') &&
      fact.dataType === 'text'
  );

  if (nickname) {
    return nickname.answerText;
  }

  return `Play a quiz built from real facts about ${city.cityName}.`;
}

function getFactLabel(factTypeName) {
  const labels = {
    founding_year: 'Founded',
    elevation: 'Elevation',
    population: 'Population',
    tallest_structure: 'Tallest Structure',
    nearest_boarder: 'Nearest Border',
    nearest_border: 'Nearest Border',
    fun_fact: 'Nickname',
    nickname: 'Nickname'
  };

  return labels[factTypeName] || factTypeName.replaceAll('_', ' ');
}

function buildCityInfo(facts = []) {
  const factOrder = [
    'nickname',
    'fun_fact',
    'population',
    'founding_year',
    'elevation',
    'tallest_structure',
    'nearest_border',
    'nearest_boarder'
  ];

  return factOrder
    .map((factTypeName) => facts.find((fact) => fact.factTypeName === factTypeName))
    .filter(Boolean)
    .reduce((info, fact) => {
      const label = getFactLabel(fact.factTypeName);

      if (info.some((entry) => entry.label === label)) {
        return info;
      }

      info.push({
        label,
        value: fact.answerText
      });

      return info;
    }, []);
}

// Turn fact rows into stable structure for quiz builder
function normalizeFactRows(rows) {
  return rows
    .map((row) => {
      const fact = {
        factId: Number(row.factId),
        cityId: Number(row.cityId),
        cityName: row.cityName,
        state: row.state,
        factTypeId: Number(row.factTypeId),
        factTypeName: row.factTypeName,
        dataType: row.dataType,
        unit: row.unit || null,
        valueNumber: row.valueNumber,
        valueText: row.valueText,
        valueBoolean: row.valueBoolean
      };
      const answerText = formatFactValue(fact);

      if (!answerText) {
        return null;
      }

      return {
        ...fact,
        answerText
      };
    })
    .filter(Boolean);
}

// Pull all saved facts once so quiz generation can mix real answers with distractors
async function getAllFacts() {
  const sql = `
    SELECT
      cf.id AS factId,
      c.id AS cityId,
      c.name AS cityName,
      c.state AS state,
      ft.id AS factTypeId,
      ft.name AS factTypeName,
      ft.data_type AS dataType,
      ft.unit AS unit,
      cf.value_number AS valueNumber,
      cf.value_text AS valueText,
      cf.value_boolean AS valueBoolean
    FROM city_facts cf
    JOIN cities c ON c.id = cf.city_id
    JOIN fact_types ft ON ft.id = cf.fact_type_id
    ORDER BY c.name ASC, cf.id ASC
  `;

  const rows = await runQuery(sql);
  return normalizeFactRows(rows);
}

async function getCityRows() {
  const sql = 'SELECT id AS cityId, name AS cityName, state FROM cities';
  const rows = await runQuery(sql);

  return rows.map((row) => ({
    cityId: Number(row.cityId),
    cityName: row.cityName,
    state: row.state || ''
  }));
}

// Quiz questions use matching fact types from other cities as distractor answers
function buildQuestionForFact(targetFact, allFacts) {
  const distractorPool = allFacts.filter(
    (fact) =>
      fact.factTypeId === targetFact.factTypeId &&
      fact.factId !== targetFact.factId &&
      fact.answerText !== targetFact.answerText
  );

  const uniqueDistractors = [];
  const seenAnswers = new Set([targetFact.answerText]);

  shuffle(distractorPool).forEach((fact) => {
    if (seenAnswers.has(fact.answerText) || uniqueDistractors.length >= ANSWERS_PER_QUESTION - 1) {
      return;
    }

    seenAnswers.add(fact.answerText);
    uniqueDistractors.push(fact);
  });

  if (uniqueDistractors.length < ANSWERS_PER_QUESTION - 1) {
    return null;
  }

  const possibleAnswers = shuffle([
    {
      answerId: targetFact.factId,
      answerText: targetFact.answerText
    },
    ...uniqueDistractors.map((fact) => ({
      answerId: fact.factId,
      answerText: fact.answerText
    }))
  ]);

  return {
    questionId: targetFact.factId,
    cityId: targetFact.cityId,
    questionText: buildQuestionText(targetFact),
    correctAnswerId: targetFact.factId,
    correctAnswerText: targetFact.answerText,
    possibleAnswers
  };
}

// Browser only needs public question data, not the correct answers
function toClientQuiz(quiz) {
  return {
    city: quiz.city,
    questionTimeLimitMs: quiz.questionTimeLimitMs,
    questions: quiz.questions.map((question) => ({
      questionId: question.questionId,
      cityId: question.cityId,
      questionText: question.questionText,
      possibleAnswers: question.possibleAnswers
    }))
  };
}

async function getStates() {
  const cities = await getCityRows();
  return [...new Set(cities.map((city) => city.state).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

// City listing pages reuse same fact data for descriptions/hover details
async function getCities({ state = 'all', sort = 'alpha-asc' } = {}) {
  const [cities, facts] = await Promise.all([getCityRows(), getAllFacts()]);
  const factsByCityId = facts.reduce((lookup, fact) => {
    if (!lookup.has(fact.cityId)) {
      lookup.set(fact.cityId, []);
    }

    lookup.get(fact.cityId).push(fact);
    return lookup;
  }, new Map());

  const normalizedState = state || 'all';
  const filteredCities =
    normalizedState === 'all'
      ? cities
      : cities.filter((city) => city.state === normalizedState);

  const citiesWithDescriptions = filteredCities.map((city) => ({
    ...city,
    description: buildCityDescription(city, factsByCityId.get(city.cityId) || []),
    cityInfo: buildCityInfo(factsByCityId.get(city.cityId) || [])
  }));

  citiesWithDescriptions.sort((left, right) => {
    const comparison = left.cityName.localeCompare(right.cityName);
    return sort === 'alpha-desc' ? comparison * -1 : comparison;
  });

  return citiesWithDescriptions;
}

async function getRandomCity() {
  const cities = await getCityRows();

  if (cities.length === 0) {
    return null;
  }

  return cities[Math.floor(Math.random() * cities.length)];
}

async function buildQuizForCity(cityId) {
  const [cities, facts] = await Promise.all([getCityRows(), getAllFacts()]);
  const city = cities.find((entry) => entry.cityId === Number(cityId));

  if (!city) {
    return null;
  }

  const cityFacts = facts.filter((fact) => fact.cityId === Number(cityId));
  const questions = cityFacts
    .map((fact) => buildQuestionForFact(fact, facts))
    .filter(Boolean);

  if (questions.length === 0) {
    return null;
  }

  return {
    city,
    questionTimeLimitMs: QUESTION_TIME_LIMIT_MS,
    questions
  };
}

// Build scoring breakdown
async function calculateQuizResult(cityId, responses = []) {
  const quiz = await buildQuizForCity(cityId);

  if (!quiz) {
    return null;
  }

  const responseMap = new Map(responses.map((response) => [Number(response.questionId), response]));
  const totalCorrectnessPoints = Math.round(MAX_BASE_SCORE * CORRECTNESS_SCORE_SHARE);
  const totalSpeedPoints = MAX_BASE_SCORE - totalCorrectnessPoints;
  const correctnessPointsByQuestion = splitScorePool(totalCorrectnessPoints, quiz.questions.length);
  const speedPointsByQuestion = splitScorePool(totalSpeedPoints, quiz.questions.length);

  let currentStreak = 0;
  let maxStreak = 0;
  let totalPoints = 0;
  let correctAnswers = 0;
  let baseScore = 0;
  let streakBonusTotal = 0;

  const questionResults = quiz.questions.map((question, index) => {
    const response = responseMap.get(question.questionId) || {};
    const selectedAnswerId = Number(response.answerId);
    const selectedAnswer = question.possibleAnswers.find(
      (answer) => Number(answer.answerId) === selectedAnswerId
    );
    const responseTimeMs = clampResponseTime(response.responseTimeMs);
    const isCorrect = selectedAnswerId === question.correctAnswerId;

    let basePoints = 0;
    let speedBonus = 0;
    let streakBonus = 0;

    if (isCorrect) {
      currentStreak = Math.min(currentStreak + 1, MAX_STREAK);
      maxStreak = Math.max(maxStreak, currentStreak);
      correctAnswers += 1;
      basePoints = correctnessPointsByQuestion[index] || 0;
      speedBonus = Math.max(
        0,
        Math.round(
          ((QUESTION_TIME_LIMIT_MS - responseTimeMs) / QUESTION_TIME_LIMIT_MS) *
            (speedPointsByQuestion[index] || 0)
        )
      );
      streakBonus = currentStreak > 1 ? (currentStreak - 1) * STREAK_BONUS_STEP : 0;
    } else {
      currentStreak = 0;
    }

    const totalQuestionPoints = basePoints + speedBonus + streakBonus;
    baseScore += basePoints + speedBonus;
    streakBonusTotal += streakBonus;
    totalPoints += totalQuestionPoints;

    return {
      questionId: question.questionId,
      questionText: question.questionText,
      selectedAnswerText: selectedAnswer?.answerText || 'No answer',
      correctAnswerText: question.correctAnswerText,
      isCorrect,
      responseTimeMs,
      basePoints,
      speedBonus,
      streakBonus,
      totalPoints: totalQuestionPoints
    };
  });

  return {
    city: quiz.city,
    questionTimeLimitMs: QUESTION_TIME_LIMIT_MS,
    maxBaseScore: MAX_BASE_SCORE,
    baseScore,
    streakBonusTotal,
    totalPoints,
    correctAnswers,
    maxStreak,
    totalQuestions: quiz.questions.length,
    questionResults
  };
}

module.exports = {
  QUESTION_TIME_LIMIT_MS,
  buildQuizForCity,
  calculateQuizResult,
  getCities,
  getRandomCity,
  getStates,
  toClientQuiz
};
