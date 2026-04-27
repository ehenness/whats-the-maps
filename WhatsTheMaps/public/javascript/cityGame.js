/** Used generative AI (ChatGPT) for help/ideas on how to take data and turn it into questions */
/** Client-side quiz flow (timers, answer collection, results) */

const quizDataElement = document.getElementById('quiz-data');
const gameMetaElement = document.getElementById('game-meta');

if (quizDataElement && gameMetaElement) {
  // Read the quiz payload server rendered
  const quizData = JSON.parse(quizDataElement.textContent);
  const gameMeta = JSON.parse(gameMetaElement.textContent);

  const questionText = document.getElementById('game-question-text');
  const answerGrid = document.getElementById('game-answer-grid');
  const progressLabel = document.getElementById('game-progress');
  const timerLabel = document.getElementById('game-timer-label');
  const timerFill = document.getElementById('game-timer-fill');
  const gameApp = document.getElementById('game-app');

  let currentQuestionIndex = 0;
  let questionStartedAt = performance.now();
  let intervalId = null;
  let timeoutId = null;
  const responses = [];
  const replayUrl = gameMeta.submitUrl.replace('/submit', '');

  // Stop interval and timeout both before moving on to next Q
  function stopTimers() {
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
    intervalId = null;
    timeoutId = null;
  }

  function updateTimer() {
    const elapsedMs = Math.min(
      quizData.questionTimeLimitMs,
      Math.max(0, performance.now() - questionStartedAt)
    );
    const remainingMs = Math.max(0, quizData.questionTimeLimitMs - elapsedMs);
    const percentRemaining = (remainingMs / quizData.questionTimeLimitMs) * 100;

    timerLabel.textContent = `${(remainingMs / 1000).toFixed(1)}s`;
    timerFill.style.width = `${percentRemaining}%`;
  }

  // Re-render the current question state when quiz advances
  function renderQuestion() {
    const currentQuestion = quizData.questions[currentQuestionIndex];

    if (!currentQuestion) {
      finishQuiz();
      return;
    }

    progressLabel.textContent = `Question ${currentQuestionIndex + 1} of ${quizData.questions.length}`;
    questionText.textContent = currentQuestion.questionText;
    answerGrid.innerHTML = '';

    currentQuestion.possibleAnswers.forEach((answer) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-option';
      button.textContent = answer.answerText;
      button.addEventListener('click', () => {
        recordResponse(answer.answerId);
      });
      answerGrid.appendChild(button);
    });

    questionStartedAt = performance.now();
    updateTimer();

    intervalId = window.setInterval(updateTimer, 100);
    timeoutId = window.setTimeout(() => {
      recordResponse(null);
    }, quizData.questionTimeLimitMs);
  }

  // Save answer and response time before showing the next question
  function recordResponse(answerId) {
    const currentQuestion = quizData.questions[currentQuestionIndex];

    if (!currentQuestion) {
      return;
    }

    stopTimers();

    const elapsedMs = Math.min(
      quizData.questionTimeLimitMs,
      Math.round(performance.now() - questionStartedAt)
    );

    responses.push({
      questionId: currentQuestion.questionId,
      answerId,
      responseTimeMs: elapsedMs
    });

    currentQuestionIndex += 1;
    renderQuestion();
  }

  function renderActionButtons() {
    return `
      <div class="settings-actions">
        <a class="button-link" href="${replayUrl}">
          <span class="button button-primary">Play Again</span>
        </a>
        <a class="button-link" href="${gameMeta.citiesUrl}">
          <span class="button">Back to Cities</span>
        </a>
        ${
          gameMeta.userLoggedIn
            ? `<a class="button-link" href="${gameMeta.dashboardUrl}"><span class="button">View Dashboard</span></a>`
            : ''
        }
      </div>
    `;
  }

  // Swap quiz UI for score summary when server returns results
  function renderResults(result) {
    const saveMessage = result.saved
      ? 'Your score was saved and will appear on your dashboard and leaderboard.'
      : result.savedMessage || 'Score saving is unavailable right now.';

    const questionSummaries = result.questionResults
      .map((question) => {
        const status = question.isCorrect ? 'Correct' : 'Incorrect';
        return `
          <li class="result-item">
            <strong>${status}:</strong> ${question.questionText}
            <br>
            <span>Your answer:</span> ${question.selectedAnswerText}
            <br>
            <span>Correct answer:</span> ${question.correctAnswerText}
            <br>
            <span>Points:</span> ${question.totalPoints} (${question.basePoints} base + ${question.speedBonus} speed + ${question.streakBonus} streak)
          </li>
        `;
      })
      .join('');

    gameApp.innerHTML = `
      <section class="result-panel">
        <div class="result-summary-grid">
          <div class="result-summary-card">
            <h3>Total Score</h3>
            <p>${result.totalPoints}</p>
          </div>
          <div class="result-summary-card">
            <h3>Correct Answers</h3>
            <p>${result.correctAnswers} / ${result.totalQuestions}</p>
          </div>
          <div class="result-summary-card">
            <h3>Best Streak</h3>
            <p>${result.maxStreak}</p>
          </div>
        </div>

        <p class="settings-note">${saveMessage}</p>

        <ul class="result-list">
          ${questionSummaries}
        </ul>
        ${renderActionButtons()}
      </section>
    `;
  }

  // Submit responses together so server can score and save the run
  async function finishQuiz() {
    stopTimers();
    progressLabel.textContent = 'Quiz Complete';
    timerLabel.textContent = '0.0s';
    timerFill.style.width = '0%';
    gameApp.innerHTML = '<p class="page-subtitle">Scoring your quiz...</p>';

    try {
      const response = await window.fetch(gameMeta.submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responses })
      });

      if (!response.ok) {
        throw new Error('Unable to submit quiz results.');
      }

      const result = await response.json();
      renderResults(result);
    } catch (error) {
      gameApp.innerHTML = `
        <p class="message message-error">We couldn't score that quiz right now. Please try again.</p>
        <div class="settings-actions">
          <a class="button-link" href="${replayUrl}">
            <span class="button button-primary">Retry Quiz</span>
          </a>
          <a class="button-link" href="${gameMeta.citiesUrl}">
            <span class="button">Back to Cities</span>
          </a>
        </div>
      `;
    }
  }

  renderQuestion();
}
