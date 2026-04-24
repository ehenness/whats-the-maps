const gameService = require('../services/game.service');

async function getHomePage(req, res) {
  try {
    const data = await gameService.getHomeData();
    return res.render('home', data);
  } catch (error) {
    console.error(error);
    return res.render('home', { randomCity: null });
  }
}

function getSignupPage(req, res) {
  return res.render('signup');
}

function getLoginPage(req, res) {
  return res.render('login');
}

module.exports = {
  getHomePage,
  getSignupPage,
  getLoginPage
};