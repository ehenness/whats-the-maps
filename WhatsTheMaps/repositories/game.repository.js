const db = require('./db');
const runQuery = require('../lib/runQuery');
const { normalizeFactRows } = require('../utils/game.util');

async function getCityRows() {
  const sql = 'SELECT id AS cityId, name AS cityName, state FROM cities';
  const rows = await runQuery(sql);

  return rows.map((row) => ({
    cityId: Number(row.cityId),
    cityName: row.cityName,
    state: row.state || ''
  }));
}
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

module.exports = { getCityRows, getAllFacts };