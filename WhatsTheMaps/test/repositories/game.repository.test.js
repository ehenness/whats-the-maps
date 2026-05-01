const test = require('node:test');
const assert = require('node:assert/strict');

const repositoryPath = require.resolve('../../repositories/game.repository');
const runQueryPath = require.resolve('../../lib/runQuery');

function loadGameRepositoryWithRunQuery(runQueryImpl) {
  const previousRepository = require.cache[repositoryPath];
  const previousRunQuery = require.cache[runQueryPath];

  delete require.cache[repositoryPath];
  require.cache[runQueryPath] = {
    id: runQueryPath,
    filename: runQueryPath,
    loaded: true,
    exports: runQueryImpl
  };

  const gameRepository = require('../../repositories/game.repository');

  return {
    gameRepository,
    restore() {
      delete require.cache[repositoryPath];

      if (previousRepository) {
        require.cache[repositoryPath] = previousRepository;
      }

      if (previousRunQuery) {
        require.cache[runQueryPath] = previousRunQuery;
      } else {
        delete require.cache[runQueryPath];
      }
    }
  };
}

test('getCityRows converts ids to numbers and fills blank states', async () => {
  const calls = [];
  const { gameRepository, restore } = loadGameRepositoryWithRunQuery(async (sql) => {
    calls.push(sql);
    return [
      { cityId: '1', cityName: 'Austin', state: 'Texas' },
      { cityId: '2', cityName: 'Mystery City', state: null }
    ];
  });

  try {
    const cities = await gameRepository.getCityRows();

    assert.equal(calls.length, 1);
    assert.match(calls[0], /SELECT id AS cityId, name AS cityName, state FROM cities/);
    assert.deepEqual(cities, [
      { cityId: 1, cityName: 'Austin', state: 'Texas' },
      { cityId: 2, cityName: 'Mystery City', state: '' }
    ]);
  } finally {
    restore();
  }
});

test('getAllFacts normalizes fact rows and filters invalid values', async () => {
  const calls = [];
  const { gameRepository, restore } = loadGameRepositoryWithRunQuery(async (sql) => {
    calls.push(sql);
    return [
      {
        factId: '11',
        cityId: '1',
        cityName: 'Austin',
        state: 'Texas',
        factTypeId: '1',
        factTypeName: 'population',
        dataType: 'number',
        unit: 'people',
        valueNumber: 974447,
        valueText: null,
        valueBoolean: null
      },
      {
        factId: '12',
        cityId: '1',
        cityName: 'Austin',
        state: 'Texas',
        factTypeId: '7',
        factTypeName: 'nickname',
        dataType: 'text',
        unit: null,
        valueNumber: null,
        valueText: '   ',
        valueBoolean: null
      }
    ];
  });

  try {
    const facts = await gameRepository.getAllFacts();

    assert.equal(calls.length, 1);
    assert.match(calls[0], /FROM city_facts cf/);
    assert.deepEqual(facts, [
      {
        factId: 11,
        cityId: 1,
        cityName: 'Austin',
        state: 'Texas',
        factTypeId: 1,
        factTypeName: 'population',
        dataType: 'number',
        unit: 'people',
        valueNumber: 974447,
        valueText: null,
        valueBoolean: null,
        answerText: '974,447'
      }
    ]);
  } finally {
    restore();
  }
});
