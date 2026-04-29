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
  const quiz = await buildQuizForCity(cityId);
  if (!quiz) return null;

  const result = gameUtil.calculateQuizResultFromQuiz(quiz, responses);

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

  return processCities(cities, facts, {state, sort});
}

async function getRandomCity() {
  const cities = await gameRepository.getCityRows();

  if (cities.length === 0) {
    return null;
  }

  return cities[Math.floor(Math.random() * cities.length)];
}

async function buildQuizForCity(cityId) {
  const [cities, facts] = await Promise.all([
    gameRepository.getCityRows(), 
    gameRepository.getAllFacts()
  ]);

  return gameUtil.buildQuizFromData(cities, facts, cityId);
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

  return gameUtil.calculateQuizResultFromQuiz(quiz, responses);
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
  buildQuizForCity,
};
