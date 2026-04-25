'use strict';

const { DEFAULTS } = require('./constants');

/**
 * Temporal Entropy Field (TEF)
 *
 * Maintains a short-term history of served items and measures diversity
 * using Shannon entropy. Applies a diversity penalty to items that would
 * reduce entropy below a threshold.
 */
class TEF {
  /**
   * @param {Object} [options]
   * @param {number} [options.historySize] - Max items in history
   * @param {number} [options.entropyThreshold] - Min entropy drop before penalty
   * @param {number} [options.penaltyFactor] - Score multiplier penalty (0-1)
   */
  constructor(options = {}) {
    this.historySize = options.historySize !== undefined ? options.historySize : DEFAULTS.HISTORY_SIZE;
    this.entropyThreshold = options.entropyThreshold !== undefined ? options.entropyThreshold : DEFAULTS.ENTROPY_THRESHOLD;
    this.penaltyFactor = options.penaltyFactor !== undefined ? options.penaltyFactor : DEFAULTS.DIVERSITY_PENALTY;
    this.history = []; // Array of topic arrays
  }

  /**
   * Add an item's topics to the history.
   * @param {string[]} topics
   */
  addToHistory(topics) {
    this.history.push(topics);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }
  }

  /**
   * Get the current history.
   * @returns {string[][]}
   */
  getHistory() {
    return this.history;
  }

  /**
   * Clear history.
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Compute Shannon entropy of topic distribution across history.
   * @param {string[][]} [historyOverride] - Optional override for history
   * @returns {number}
   */
  computeEntropy(historyOverride) {
    const hist = historyOverride || this.history;
    if (hist.length === 0) return 0;

    const counts = {};
    let total = 0;
    for (const topics of hist) {
      for (const t of topics) {
        counts[t] = (counts[t] || 0) + 1;
        total++;
      }
    }

    if (total === 0) return 0;

    let entropy = 0;
    for (const key of Object.keys(counts)) {
      const p = counts[key] / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }

  /**
   * Compute entropy if an item's topics were added to history.
   * @param {string[]} itemTopics
   * @returns {number}
   */
  computeEntropyWithItem(itemTopics) {
    const extended = [...this.history, itemTopics];
    // If extended exceeds history size, drop the oldest
    if (extended.length > this.historySize) {
      extended.shift();
    }
    return this.computeEntropy(extended);
  }

  /**
   * Check if adding an item would reduce entropy below threshold,
   * and return the penalty multiplier.
   * @param {string[]} itemTopics
   * @returns {number} - Score multiplier (1.0 = no penalty, < 1.0 = penalized)
   */
  getDiversityMultiplier(itemTopics) {
    if (this.history.length === 0) return 1.0;

    const currentEntropy = this.computeEntropy();
    const newEntropy = this.computeEntropyWithItem(itemTopics);

    if (newEntropy < currentEntropy - this.entropyThreshold) {
      return 1.0 - this.penaltyFactor;
    }
    return 1.0;
  }

  /**
   * Serialize.
   * @returns {Object}
   */
  toJSON() {
    return {
      history: this.history,
      historySize: this.historySize,
      entropyThreshold: this.entropyThreshold,
      penaltyFactor: this.penaltyFactor,
    };
  }

  /**
   * Restore from plain object.
   * @param {Object} obj
   * @returns {TEF}
   */
  static fromJSON(obj) {
    const tef = new TEF({
      historySize: obj.historySize,
      entropyThreshold: obj.entropyThreshold,
      penaltyFactor: obj.penaltyFactor,
    });
    tef.history = obj.history || [];
    return tef;
  }
}

module.exports = { TEF };
