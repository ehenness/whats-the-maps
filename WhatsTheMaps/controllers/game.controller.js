const gameService = require('../services/game.service'); //all functions from game.service.js

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
    const quiz = await gameService.getQuiz(req.params.cityId);
    if (!quiz) {
      return res.status(404).send('City quiz not found.');
    }
    return res.render('game', quiz);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading city quiz.');
  }
};

async function submitQuiz(req, res) {
  const responses = Array.isArray(req.body.responses) ? req.body.responses : [];

  try {
    const result = await gameService.submitQuiz(
      req.params.cityId,
      responses,
      req.session.user
    );

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