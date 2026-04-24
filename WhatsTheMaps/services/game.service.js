const {
  buildQuizForCity,
  calculateQuizResult,
  getCities,
  getRandomCity,
  getStates,
  toClientQuiz
} = require('../gameData');

const scoreRepository = require('../repositories/score.repository');

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
    quizData: toClientQuiz(quiz)
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

module.exports = {
  getCitiesData,
  getQuiz,
  submitQuiz,
  getHomeData
};
