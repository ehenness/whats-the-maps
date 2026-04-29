// general rule: if it
//      does NOT call DB
//      does NOT depend on req/session
// it belongs in utils
// this is essentially a bunch of pure helper functions that don't interact between layers

const {
    QUESTION_TIME_LIMIT_MS,
    questionPrompts, 
    MAX_BASE_SCORE,
    CORRECTNESS_SCORE_SHARE,
    MAX_STREAK,
    STREAK_BONUS_STEP,
    ANSWERS_PER_QUESTION
} = require('../gameData');

/**
 * Converts a raw fact record into a human-readable string.
 * Handles number formatting, units, and type-specific logic.
 * Returns null if the value cannot be displayed.
 */
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

// builds the question text for a given fact using predefined prompts or a generic fallback
function buildQuestionText(fact) {
  const promptKey = `${fact.factTypeName}:${fact.dataType}`;
  const promptBuilder = gameData.questionPrompts[promptKey];

  if (promptBuilder) {
    return promptBuilder(fact);
  }

  return `Which answer matches ${fact.cityName}'s ${fact.factTypeName.replaceAll('_', ' ')}?`;
}

// splits a total score into a specified number of parts, distributing any remainder points as evenly as possible
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

// clamps the response time to be within the range of 0 to the defined question time limit, ensuring it's a valid number
function clampResponseTime(responseTimeMs) {
  return Math.min(
    QUESTION_TIME_LIMIT_MS,
    Math.max(0, Number(responseTimeMs) || QUESTION_TIME_LIMIT_MS)
  );
}

// normalizes a value to a number, returning null if it's not a valid finite number
function normalizeNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return numericValue;
}

// formats a number with commas as thousands separators, returning null for non-finite values
function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Number.isInteger(value) ? value.toLocaleString('en-US') : value.toLocaleString('en-US');
}

// builds a description for a city based on its facts, prioritizing nicknames or fun facts if available
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

// maps internal fact type names to user-friendly labels for display purposes
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

// builds an array of city information entries based on a prioritized list of fact types, ensuring no duplicate labels and filtering out missing values
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

/**
 * Builds a multiple-choice question from a fact.
 * Selects unique distractors of the same type.
 * Returns null if not enough valid distractors exist.
 */
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

/**
 * Computes scoring components for a single question.
 * Includes:
 * - base correctness points
 * - speed bonus (time-based)
 * - streak bonus (consecutive correct answers)
 */
function calculateQuestionScore({
  isCorrect,
  responseTimeMs,
  basePoints,
  speedPoints,
  currentStreak,
  constants
}) {
  if (!isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      streakBonus: 0,
      newStreak: 0
    };
  }

  const newStreak = Math.min(currentStreak + 1, constants.MAX_STREAK);

  const speedBonus = Math.max(
    0, 
    Math.round(((constants.TIME_LIMIT - responseTimeMs) / constants.TIME_LIMIT) * speedPoints)
  );

  const streakBonus =
    newStreak > 1 ? (newStreak - 1) * constants.STREAK_BONUS_STEP : 0;

  return {
    basePoints,
    speedBonus,
    streakBonus,
    newStreak
  };
}

/**
 * Evaluates a user's response against a question.
 * Returns:
 *  - normalized result object for UI
 *  - updated streak value
 */
function evaluateQuestion({
    question,
    response,
    index,
    correctnessPoints,
    speedPoints,
    currentStreak,
    constants
    }) 
{
  const selectedAnswerId = Number(response?.answerId);
  const selectedAnswer = question.possibleAnswers.find(
    (a) => Number(a.answerId) === selectedAnswerId
  );

  const responseTimeMs = clampResponseTime(response?.responseTimeMs);
  const isCorrect = selectedAnswerId === question.correctAnswerId;

  const score = calculateQuestionScore({
    isCorrect,
    responseTimeMs,
    basePoints: correctnessPoints[index] || 0,
    speedPoints: speedPoints[index] || 0,
    currentStreak,
    constants
  });

  const totalPoints =
    score.basePoints + score.speedBonus + score.streakBonus;

  return {
    result: {
      questionId: question.questionId,
      questionText: question.questionText,
      selectedAnswerText: selectedAnswer?.answerText || 'No answer',
      correctAnswerText: question.correctAnswerText,
      isCorrect,
      responseTimeMs,
      basePoints: score.basePoints,
      speedBonus: score.speedBonus,
      streakBonus: score.streakBonus,
      totalPoints
    },
    newStreak: score.newStreak
  };
}

/**
 * Aggregates all question-level results into final quiz totals.
 */
function aggregateResults(results) {
  return results.reduce(
    (acc, r) => {
      acc.totalPoints += r.totalPoints;
      acc.baseScore += r.basePoints + r.speedBonus;
      acc.streakBonusTotal += r.streakBonus;
      if (r.isCorrect) acc.correctAnswers += 1;
      return acc;
    },
    {
      totalPoints: 0,
      baseScore: 0,
      streakBonusTotal: 0,
      correctAnswers: 0
    }
  );
}

/**
 * Converts internal quiz structure into client-safe payload.
 * Removes correct answers and sensitive data.
 */
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

/**
 * Groups facts by cityId for efficient lookup.
 */
function groupFactsByCityId(facts) {
  return facts.reduce((lookup, fact) => {
    if (!lookup.has(fact.cityId)) {
      lookup.set(fact.cityId, []);
    }

    lookup.get(fact.cityId).push(fact);
    return lookup;
  }, new Map());
}

/**
 * Attaches derived fields (description, info) to each city.
 */
function enrichCities(cities, factsByCityId) {
  return cities.map(city => ({
    ...city,
    description: buildCityDescription(city, factsByCityId.get(city.cityId) || []),
    cityInfo: buildCityInfo(factsByCityId.get(city.cityId) || [])
  }));
}

// helper to sort cities alphabetically in either direction
function sortCities(cities, sort) {
  return cities.sort((left, right) => {
    const cmp = left.cityName.localeCompare(right.cityName);
    return sort === 'alpha-desc' ? -cmp : cmp;
  });
}

// utility function to shuffle an array in place using the Fisher-Yates algorithm
function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

// helper to normalize fact rows for getAllFacts function
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

function buildQuizFromData(cities, facts, cityId) {
  const city = getCityById(cities, cityId);
  if (!city) return null;

  const cityFacts = facts.filter((fact) => fact.cityId === Number(cityId));
  const questions = getQuestionsForCity(cityFacts, facts);

  if (questions.length === 0) return null;

  return {
    city,
    questionTimeLimitMs: QUESTION_TIME_LIMIT_MS,
    questions
  };
}

function calculateQuizResultFromQuiz(quiz, responses = []) {
  if (!quiz) return null;

  const responseMap = new Map(
    responses.map((r) => [Number(r.questionId), r])
  );

  const correctnessPoints = splitScorePool(
    Math.round(MAX_BASE_SCORE * CORRECTNESS_SCORE_SHARE),
    quiz.questions.length
  );

  const speedPoints = splitScorePool(
    MAX_BASE_SCORE - Math.round(MAX_BASE_SCORE * CORRECTNESS_SCORE_SHARE),
    quiz.questions.length
  );

  let currentStreak = 0;
  let maxStreak = 0;

  const evaluated = quiz.questions.map((question, index) => {
    const { result, newStreak } = evaluateQuestion({
      question,
      response: responseMap.get(question.questionId),
      index,
      correctnessPoints,
      speedPoints,
      currentStreak,
      constants: {
        MAX_STREAK,
        STREAK_BONUS_STEP,
        TIME_LIMIT: QUESTION_TIME_LIMIT_MS
      }
    });

    currentStreak = newStreak;
    maxStreak = Math.max(maxStreak, currentStreak);

    return result;
  });

  const totals = aggregateResults(evaluated);

  return {
    city: quiz.city,
    questionTimeLimitMs: QUESTION_TIME_LIMIT_MS,
    maxBaseScore: MAX_BASE_SCORE,
    maxStreak,
    totalQuestions: quiz.questions.length,
    ...totals,
    questionResults: evaluated
  };
}


function processCities(cities, facts, {state, sort}){
  const factsByCityId = groupFactsByCityId(facts);

  // may be unnecessary to normalize state since DB should enforce consistent values, but just in case...
  const normalizedState = state || 'all';
  
  const filteredCities =
    normalizedState === 'all'
      ? cities
      : cities.filter((city) => city.state === normalizedState);

  const citiesWithDescriptions = enrichCities(filteredCities, factsByCityId);

  return sortCities(citiesWithDescriptions, sort);
}
function getCityById(cities, cityId) {
  return cities.find(c => c.cityId === Number(cityId));
}

function getQuestionsForCity(cityFacts, allFacts) {
  return cityFacts
    .map(f => buildQuestionForFact(f, allFacts))
    .filter(Boolean);
}

module.exports = { 
    shuffle,     
    splitScorePool, 
    clampResponseTime, 
    normalizeNumber,
    formatNumber,
    formatFactValue, 
    buildQuestionText, 
    buildCityDescription, 
    getFactLabel,
    buildCityInfo, 
    normalizeFactRows, 
    buildQuestionForFact,
    calculateQuestionScore,
    evaluateQuestion,
    aggregateResults,
    groupFactsByCityId,
    enrichCities,
    sortCities,
    toClientQuiz, 
    buildQuizFromData,
    calculateQuizResultFromQuiz,
    processCities,
    getCityById,
    getQuestionsForCity
};