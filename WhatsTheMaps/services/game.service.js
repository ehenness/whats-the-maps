const gameRepository = require('../repositories/game.repository');
const scoreRepository = require('../repositories/score.repository');
const gameUtil = require('../utils/game.util');
const {
  QUESTION_TIME_LIMIT_MS,
  MAX_BASE_SCORE,
  CORRECTNESS_SCORE_SHARE,
  MAX_STREAK,
  STREAK_BONUS_STEP
} = require('../gameData');


async function getCitiesData(query) {
  const state = query.state || 'all';
  const sort = query.sort || 'alpha-asc';

  const [cities, randomCity, states] = await Promise.all([
    getCities({ state, sort }),
    getRandomCity(),
    getStates()
  ]);

  return { cities, randomCity, states, selectedState: state, selectedSort: sort };
}

async function getQuiz(cityId) {
  const quiz = await buildQuizForCity(cityId);
  if (!quiz) return null;

  return {
    city: quiz.city,
    quizData: gameUtil.toClientQuiz(quiz)
  };
}

async function submitQuiz(cityId, responses, user) {
  const result = await calculateQuizResult(cityId, responses);
  if (!result) return null;

  if (!user) {
    return {
      ...result,
      saved: false,
      savedMessage: 'Log in to save your score to the dashboard.'
    };
  }

  try {
    await scoreRepository.saveScore(user.id, result.totalPoints);

    return {
      ...result,
      saved: true,
      savedMessage: 'Your score has been saved.'
    };
  } catch (err) {
    console.error(err);

    return {
      ...result,
      saved: false,
      savedMessage: 'Your score was calculated, but it could not be saved.'
    };
  }
}

async function getHomeData() {
  return {
    randomCity: await getRandomCity()
  };
}

async function getStates() {
  const cities = await gameRepository.getCityRows();
  return [...new Set(cities.map((city) => city.state).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

async function getCities({ state = 'all', sort = 'alpha-asc' } = {}) {
  const [cities, facts] = await Promise.all([
    gameRepository.getCityRows(), 
    gameRepository.getAllFacts()
  ]);

  const factsByCityId = gameUtil.groupFactsByCityId(facts);

  // may be unnecessary to normalize state since DB should enforce consistent values, but just in case...
  const normalizedState = state || 'all';
  
  const filteredCities =
    normalizedState === 'all'
      ? cities
      : cities.filter((city) => city.state === normalizedState);

  const citiesWithDescriptions = gameUtil.enrichCities(filteredCities, factsByCityId);

  return gameUtil.sortCities(citiesWithDescriptions, sort);
}

async function getRandomCity() {
  const cities = await gameRepository.getCityRows();

  if (cities.length === 0) {
    return null;
  }

  return cities[Math.floor(Math.random() * cities.length)];
}

function getCityById(cities, cityId) {
  return cities.find(c => c.cityId === Number(cityId));
}

function getQuestionsForCity(cityFacts, allFacts) {
  return cityFacts
    .map(f => gameUtil.buildQuestionForFact(f, allFacts))
    .filter(Boolean);
}

async function buildQuizForCity(cityId) {
  const [cities, facts] = await Promise.all([
    gameRepository.getCityRows(), 
    gameRepository.getAllFacts()
  ]);

  const city = getCityById(cities, cityId);
  //potentiall toss error here if city not found, but for now just return null and handle in service method
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

function calculateScoreSplits(questionCount) {
  const correctnessPoints = Math.round(MAX_BASE_SCORE * CORRECTNESS_SCORE_SHARE);
  const speedPoints = MAX_BASE_SCORE - correctnessPoints;

  return {
    correctnessSplit: gameUtil.splitScorePool(correctnessPoints, questionCount),
    speedSplit: gameUtil.splitScorePool(speedPoints, questionCount)
  };
}

async function calculateQuizResult(cityId, responses = []) {
  const quiz = await buildQuizForCity(cityId);
  if (!quiz) return null;

  const responseMap = new Map(
    responses.map((r) => [Number(r.questionId), r])
  );

  const correctnessPoints = gameUtil.splitScorePool(
    Math.round(MAX_BASE_SCORE * CORRECTNESS_SCORE_SHARE),
    quiz.questions.length
  );

  const speedPoints = gameUtil.splitScorePool(
    MAX_BASE_SCORE - Math.round(MAX_BASE_SCORE * CORRECTNESS_SCORE_SHARE),
    quiz.questions.length
  );

  let currentStreak = 0;
  let maxStreak = 0;

  const evaluated = quiz.questions.map((question, index) => {
    const { result, newStreak } = gameUtil.evaluateQuestion({
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

  const totals = gameUtil.aggregateResults(evaluated);

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

module.exports = {
  getCitiesData,
  getQuiz,
  submitQuiz,
  getHomeData,
  getStates,
  getCities,
  getRandomCity,
  calculateQuizResult,
  buildQuizForCity
};
