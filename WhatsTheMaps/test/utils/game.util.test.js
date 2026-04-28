const { expect } = require('chai');
const sinon = require('sinon');
const {
  splitScorePool,
  calculateQuestionScore,
  aggregateResults
} = require('../../utils/game.util');

describe('game.util', () => {

  describe('splitScorePool', () => {
    it('splits points evenly with remainder', () => {
      const result = splitScorePool(10, 3);
      expect(result).to.deep.equal([4, 3, 3]);
    });

    it('returns empty array for invalid count', () => {
      const result = splitScorePool(10, 0);
      expect(result).to.deep.equal([]);
    });
  });

  describe('calculateQuestionScore', () => {
    const constants = {
      MAX_STREAK: 5,
      STREAK_BONUS_STEP: 5,
      TIME_LIMIT: 15000
    };

    it('returns zero values for incorrect answer', () => {
      const result = calculateQuestionScore({
        isCorrect: false,
        responseTimeMs: 5000,
        basePoints: 100,
        speedPoints: 50,
        currentStreak: 2,
        constants
      });

      expect(result.basePoints).to.equal(0);
      expect(result.speedBonus).to.equal(0);
      expect(result.streakBonus).to.equal(0);
      expect(result.newStreak).to.equal(0);
    });

    it('calculates correct scoring for correct answer', () => {
      const result = calculateQuestionScore({
        isCorrect: true,
        responseTimeMs: 5000,
        basePoints: 100,
        speedPoints: 50,
        currentStreak: 1,
        constants
      });

      expect(result.basePoints).to.equal(100);
      expect(result.newStreak).to.equal(2);
      expect(result.speedBonus).to.be.at.least(0);
    });
  });

  describe('aggregateResults', () => {
    it('aggregates totals correctly', () => {
      const results = [
        { totalPoints: 100, basePoints: 80, speedBonus: 10, streakBonus: 10, isCorrect: true },
        { totalPoints: 50, basePoints: 50, speedBonus: 0, streakBonus: 0, isCorrect: false }
      ];

      const totals = aggregateResults(results);

      expect(totals.totalPoints).to.equal(150);
      expect(totals.baseScore).to.equal(140);
      expect(totals.streakBonusTotal).to.equal(10);
      expect(totals.correctAnswers).to.equal(1);
    });
  });

  it('clamps response time correctly', () => {
    const result = clampResponseTime(-100);
    expect(result).to.equal(0);

    const result2 = clampResponseTime(999999);
    expect(result2).to.be.at.most(15000);
  });

  it('handles unanswered question', () => {
    const question = {
      questionId: 1,
      correctAnswerId: 10,
      correctAnswerText: 'Correct',
      possibleAnswers: []
    };

    const { result } = evaluateQuestion({
      question,
      response: null,
      index: 0,
      correctnessPoints: [100],
      speedPoints: [50],
      currentStreak: 0,
      constants: {
        MAX_STREAK: 5,
        STREAK_BONUS_STEP: 5,
        TIME_LIMIT: 15000
      }
    });

    expect(result.isCorrect).to.equal(false);
  });

  it('groups facts by cityId', () => {
    const facts = [
      { cityId: 1 },
      { cityId: 1 },
      { cityId: 2 }
    ];

    const map = groupFactsByCityId(facts);

    expect(map.get(1)).to.have.length(2);
    expect(map.get(2)).to.have.length(1);
  });

});