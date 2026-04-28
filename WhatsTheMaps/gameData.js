const gameRepository = require('./repositories/game.repository');
const gameUtils = require('./utils/game.util');
const {
  QUESTION_TIME_LIMIT_MS,
  buildCityDescription,
  buildCityInfo,
  buildQuestionForFact,
  calculateQuizResultFromQuiz,
  normalizeFactRows,
  toClientQuiz
} = require('./lib/quizUtils');

const MAX_BASE_SCORE = 1_000;
const CORRECTNESS_SCORE_SHARE = 0.75;
const MAX_STREAK = 5;
const STREAK_BONUS_STEP = 5;
const ANSWERS_PER_QUESTION = 4;

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

module.exports = {
  QUESTION_TIME_LIMIT_MS,
  questionPrompts, 
  MAX_BASE_SCORE,
  CORRECTNESS_SCORE_SHARE,
  MAX_STREAK,
  STREAK_BONUS_STEP,
  ANSWERS_PER_QUESTION
};
