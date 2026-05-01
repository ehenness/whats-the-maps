const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const gameController = require('../../controllers/game.controller');
const gameService = require('../../services/game.service');

afterEach(() => sinon.restore());

test('stores guest score in session', async () => {
  const req = {
    params: { cityId: 1 },
    body: { responses: [] },
    session: {}
  };

  const res = {
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'submitQuiz').resolves({
    totalPoints: 150,
    saved: false
  });

  await gameController.submitQuiz(req, res);

  assert.equal(req.session.pendingGuestScore.totalPoints, 150);
});

test('getGamePage stores the rendered quiz in session before rendering', async () => {
  const rawQuiz = {
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    questionTimeLimitMs: 15000,
    questions: [
      {
        questionId: 11,
        cityId: 1,
        questionText: 'What is the population of Austin?',
        correctAnswerId: 11,
        correctAnswerText: '974,447',
        possibleAnswers: [
          { answerId: 11, answerText: '974,447' },
          { answerId: 12, answerText: '1,304,379' }
        ]
      }
    ]
  };
  const req = {
    params: { cityId: 1 },
    session: {}
  };
  const res = {
    render: sinon.spy(),
    send: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'buildQuizForCity').resolves(rawQuiz);

  await gameController.getGamePage(req, res);

  assert.deepEqual(req.session.activeQuiz, rawQuiz);
  assert.equal(res.render.calledOnce, true);
  assert.equal(res.render.firstCall.args[0], 'game');
  assert.deepEqual(res.render.firstCall.args[1], {
    city: rawQuiz.city,
    quizData: {
      city: rawQuiz.city,
      questionTimeLimitMs: 15000,
      questions: [
        {
          questionId: 11,
          cityId: 1,
          questionText: 'What is the population of Austin?',
          possibleAnswers: [
            { answerId: 11, answerText: '974,447' },
            { answerId: 12, answerText: '1,304,379' }
          ]
        }
      ]
    }
  });
});

test('submitQuiz uses the quiz stored in session and clears it afterward', async () => {
  const activeQuiz = {
    city: { cityId: 1, cityName: 'Austin', state: 'Texas' },
    questionTimeLimitMs: 15000,
    questions: []
  };
  const req = {
    params: { cityId: 1 },
    body: { responses: [{ questionId: 11, answerId: 12, responseTimeMs: 3000 }] },
    session: {
      activeQuiz
    }
  };

  const res = {
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'submitQuizFromQuiz').resolves({
    totalPoints: 150,
    saved: false
  });
  const submitQuizStub = sinon.stub(gameService, 'submitQuiz');

  await gameController.submitQuiz(req, res);

  assert.equal(gameService.submitQuizFromQuiz.calledOnceWithExactly(
    activeQuiz,
    [{ questionId: 11, answerId: 12, responseTimeMs: 3000 }],
    undefined
  ), true);
  assert.equal(submitQuizStub.called, false);
  assert.equal(req.session.activeQuiz, undefined);
});

test('does not store session score for logged-in user', async () => {
  const req = {
    params: { cityId: 1 },
    body: { responses: [] },
    session: { user: { id: 10 } }
  };

  const res = {
    json: sinon.spy(),
    status: sinon.stub().returnsThis()
  };

  sinon.stub(gameService, 'submitQuiz').resolves({
    totalPoints: 150,
    saved: true
  });

  await gameController.submitQuiz(req, res);

  assert.equal(req.session.pendingGuestScore, undefined);
});
