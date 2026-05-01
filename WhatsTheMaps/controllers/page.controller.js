const gameService = require('../services/game.service');
const { buildLoginViewModel } = require('../viewModels/authViewModels');

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
  return res.render('login', buildLoginViewModel());
}

module.exports = {
  getHomePage,
  getSignupPage,
  getLoginPage
};
