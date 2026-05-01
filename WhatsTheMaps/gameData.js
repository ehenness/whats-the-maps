const QUESTION_TIME_LIMIT_MS = 15_000;
const POINTS_PER_CORRECT_ANSWER = 100;
const MAX_SPEED_BONUS = 25;
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
  POINTS_PER_CORRECT_ANSWER,
  MAX_SPEED_BONUS,
  MAX_STREAK,
  STREAK_BONUS_STEP,
  ANSWERS_PER_QUESTION
};
