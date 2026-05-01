const gameService = require('../services/game.service'); //all functions from game.service.js
const gameUtil = require('../utils/game.util');

async function getCitiesPage(req, res) {
  try {
    const data = await gameService.getCitiesData(req.query);

    return res.render('cities', data);
    
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading cities.');
  }
};

async function getGamePage(req, res) {
  try {
    const quiz = await gameService.buildQuizForCity(req.params.cityId);

    if (!quiz) {
      return res.status(404).send('City quiz not found.');
    }

    req.session.activeQuiz = quiz;

    return res.render('game', {
      city: quiz.city,
      quizData: gameUtil.toClientQuiz(quiz)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading city quiz.');
  }
};

async function submitQuiz(req, res) {
  const responses = Array.isArray(req.body.responses) ? req.body.responses : [];
  const activeQuiz =
    req.session.activeQuiz &&
    Number(req.session.activeQuiz?.city?.cityId) === Number(req.params.cityId)
      ? req.session.activeQuiz
      : null;

  try {
    const result = activeQuiz
      ? await gameService.submitQuizFromQuiz(activeQuiz, responses, req.session.user)
      : await gameService.submitQuiz(
          req.params.cityId,
          responses,
          req.session.user
        );

    if (activeQuiz) {
      delete req.session.activeQuiz;
    }

    if (!result) {
      return res.status(404).json({ error: 'City quiz not found.' });
    }

    if (!req.session.user && result) {
      req.session.pendingGuestScore = result;
    }

    return res.json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'We could not score that quiz right now.' });
  }
}

module.exports = { getCitiesPage, getGamePage, submitQuiz };
