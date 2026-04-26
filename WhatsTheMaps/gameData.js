/** Builds quiz data, formats city facts, calculates quiz results */
const runQuery = require('./lib/runQuery');
const {
  QUESTION_TIME_LIMIT_MS,
  buildCityDescription,
  buildCityInfo,
  buildQuestionForFact,
  calculateQuizResultFromQuiz,
  normalizeFactRows,
  toClientQuiz
} = require('./lib/quizUtils');

// Pull all saved facts once so quiz generation can mix real answers with distractors
async function getAllFacts() {
  const sql = `
    SELECT
      cf.id AS factId,
      c.id AS cityId,
      c.name AS cityName,
      c.state AS state,
      ft.id AS factTypeId,
      ft.name AS factTypeName,
      ft.data_type AS dataType,
      ft.unit AS unit,
      cf.value_number AS valueNumber,
      cf.value_text AS valueText,
      cf.value_boolean AS valueBoolean
    FROM city_facts cf
    JOIN cities c ON c.id = cf.city_id
    JOIN fact_types ft ON ft.id = cf.fact_type_id
    ORDER BY c.name ASC, cf.id ASC
  `;

  const rows = await runQuery(sql);
  return normalizeFactRows(rows);
}

async function getCityRows() {
  const sql = 'SELECT id AS cityId, name AS cityName, state FROM cities';
  const rows = await runQuery(sql);

  return rows.map((row) => ({
    cityId: Number(row.cityId),
    cityName: row.cityName,
    state: row.state || ''
  }));
}

async function getStates() {
  const cities = await getCityRows();
  return [...new Set(cities.map((city) => city.state).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

// City listing pages reuse same fact data for descriptions/hover details
async function getCities({ state = 'all', sort = 'alpha-asc' } = {}) {
  const [cities, facts] = await Promise.all([getCityRows(), getAllFacts()]);
  const factsByCityId = facts.reduce((lookup, fact) => {
    if (!lookup.has(fact.cityId)) {
      lookup.set(fact.cityId, []);
    }

    lookup.get(fact.cityId).push(fact);
    return lookup;
  }, new Map());

  const normalizedState = state || 'all';
  const filteredCities =
    normalizedState === 'all'
      ? cities
      : cities.filter((city) => city.state === normalizedState);

  const citiesWithDescriptions = filteredCities.map((city) => ({
    ...city,
    description: buildCityDescription(city, factsByCityId.get(city.cityId) || []),
    cityInfo: buildCityInfo(factsByCityId.get(city.cityId) || [])
  }));

  citiesWithDescriptions.sort((left, right) => {
    const comparison = left.cityName.localeCompare(right.cityName);
    return sort === 'alpha-desc' ? comparison * -1 : comparison;
  });

  return citiesWithDescriptions;
}

async function getRandomCity() {
  const cities = await getCityRows();

  if (cities.length === 0) {
    return null;
  }

  return cities[Math.floor(Math.random() * cities.length)];
}

async function buildQuizForCity(cityId) {
  const [cities, facts] = await Promise.all([getCityRows(), getAllFacts()]);
  const city = cities.find((entry) => entry.cityId === Number(cityId));

  if (!city) {
    return null;
  }

  const cityFacts = facts.filter((fact) => fact.cityId === Number(cityId));
  const questions = cityFacts
    .map((fact) => buildQuestionForFact(fact, facts))
    .filter(Boolean);

  if (questions.length === 0) {
    return null;
  }

  return {
    city,
    questionTimeLimitMs: QUESTION_TIME_LIMIT_MS,
    questions
  };
}

// Build scoring breakdown
async function calculateQuizResult(cityId, responses = []) {
  const quiz = await buildQuizForCity(cityId);
  return calculateQuizResultFromQuiz(quiz, responses);
}

module.exports = {
  QUESTION_TIME_LIMIT_MS,
  buildQuizForCity,
  calculateQuizResult,
  getCities,
  getRandomCity,
  getStates,
  toClientQuiz
};
