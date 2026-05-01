const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const gameController = require('../../controllers/game.controller');
const gameService = require('../../services/game.service');

afterEach(() => sinon.restore());

test('getCitiesPage renders the cities view with service data', async () => {
  const req = {
    query: { state: 'Texas', sort: 'score-desc' }
  };
  const res = {
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };
  const data = {
    cities: [{ cityId: 1, cityName: 'Houston' }],
    randomCity: { cityId: 2, cityName: 'Austin' },
    states: ['Texas'],
    selectedState: 'Texas',
    selectedSort: 'score-desc'
  };

  sinon.stub(gameService, 'getCitiesData').resolves(data);

  await gameController.getCitiesPage(req, res);

  assert.equal(gameService.getCitiesData.calledOnceWithExactly(req.query), true);
  assert.equal(res.render.calledOnceWithExactly('cities', data), true);
});

test('getCitiesPage returns a 500 error when loading cities fails', async () => {
  const req = { query: {} };
  const res = {
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(console, 'error');
  sinon.stub(gameService, 'getCitiesData').rejects(new Error('boom'));

  await gameController.getCitiesPage(req, res);

  assert.equal(res.status.calledOnceWithExactly(500), true);
  assert.equal(res.send.calledOnceWithExactly('Error loading cities.'), true);
});

test('getGamePage renders the game view when a quiz exists', async () => {
  const req = {
    params: { cityId: '7' },
    session: {}
  };
  const res = {
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };
  const quiz = {
    city: { cityId: 7, cityName: 'Houston', state: 'Texas' },
    questionTimeLimitMs: 15000,
    questions: []
  };

  sinon.stub(gameService, 'buildQuizForCity').resolves(quiz);

  await gameController.getGamePage(req, res);

  assert.equal(res.render.calledOnce, true);
  assert.equal(res.render.firstCall.args[0], 'game');
  assert.deepEqual(res.render.firstCall.args[1], {
    city: quiz.city,
    quizData: {
      city: quiz.city,
      questionTimeLimitMs: 15000,
      questions: []
    }
  });
});

test('getGamePage returns 404 when a city quiz is missing', async () => {
  const req = {
    params: { cityId: '7' },
    session: {}
  };
  const res = {
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'buildQuizForCity').resolves(null);

  await gameController.getGamePage(req, res);

  assert.equal(res.status.calledOnceWithExactly(404), true);
  assert.equal(res.send.calledOnceWithExactly('City quiz not found.'), true);
});

test('getGamePage returns a 500 error when quiz loading fails', async () => {
  const req = {
    params: { cityId: '7' },
    session: {}
  };
  const res = {
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(console, 'error');
  sinon.stub(gameService, 'buildQuizForCity').rejects(new Error('boom'));

  await gameController.getGamePage(req, res);

  assert.equal(res.status.calledOnceWithExactly(500), true);
  assert.equal(res.send.calledOnceWithExactly('Error loading city quiz.'), true);
});

test('submitQuiz returns 404 when the quiz result cannot be built', async () => {
  const req = {
    body: { responses: [] },
    params: { cityId: '9' },
    session: {}
  };
  const res = {
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'submitQuiz').resolves(null);

  await gameController.submitQuiz(req, res);

  assert.equal(res.status.calledOnceWithExactly(404), true);
  assert.deepEqual(res.json.firstCall.args[0], { error: 'City quiz not found.' });
});

test('submitQuiz passes an empty response array when the request body is malformed', async () => {
  const req = {
    body: { responses: 'not-an-array' },
    params: { cityId: '9' },
    session: { user: { id: 1 } }
  };
  const res = {
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'submitQuiz').resolves({
    totalPoints: 500,
    saved: true
  });

  await gameController.submitQuiz(req, res);

  assert.equal(gameService.submitQuiz.calledOnceWithExactly('9', [], req.session.user), true);
});

test('submitQuiz returns a 500 error when scoring fails', async () => {
  const req = {
    body: { responses: [] },
    params: { cityId: '9' },
    session: {}
  };
  const res = {
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(console, 'error');
  sinon.stub(gameService, 'submitQuiz').rejects(new Error('boom'));

  await gameController.submitQuiz(req, res);

  assert.equal(res.status.calledOnceWithExactly(500), true);
  assert.deepEqual(res.json.firstCall.args[0], {
    error: 'We could not score that quiz right now.'
  });
});
