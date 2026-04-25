'use strict';

const { DEFAULTS } = require('./constants');

/**
 * User Resonance Vector (URV)
 *
 * A weighted vector over atomic dimensions, updated in real-time by user actions.
 * This is NOT a trained model - it's a live tally of explicit signals.
 */
class URV {
  /**
   * @param {Object} [options]
   * @param {number} [options.min] - Minimum weight bound
   * @param {number} [options.max] - Maximum weight bound
   * @param {number} [options.decayRate] - Decay multiplier per second
   */
  constructor(options = {}) {
    this.weights = {};
    this.min = options.min !== undefined ? options.min : DEFAULTS.URV_MIN;
    this.max = options.max !== undefined ? options.max : DEFAULTS.URV_MAX;
    this.decayRate = options.decayRate !== undefined ? options.decayRate : DEFAULTS.DECAY_RATE;
    this.lastDecayTime = Date.now();
  }

  /**
   * Apply temporal decay to all weights based on elapsed time.
   * Weights are multiplied by decayRate^(elapsed_seconds).
   */
  applyDecay() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastDecayTime) / 1000;
    if (elapsedSeconds <= 0) return;

    const factor = Math.pow(this.decayRate, elapsedSeconds);
    for (const key of Object.keys(this.weights)) {
      this.weights[key] *= factor;
      // Clean up near-zero weights to save memory
      if (Math.abs(this.weights[key]) < 1e-6) {
        delete this.weights[key];
      }
    }
    this.lastDecayTime = now;
  }

  /**
   * Update a specific dimension:value key by a delta.
   * @param {string} key - e.g. "topic:tech"
   * @param {number} delta - Amount to add
   */
  update(key, delta) {
    const current = this.weights[key] || 0;
    this.weights[key] = this._clamp(current + delta);
  }

  /**
   * Set a specific key to an exact value (e.g., mute_creator = -100).
   * @param {string} key
   * @param {number} value
   */
  set(key, value) {
    this.weights[key] = this._clamp(value);
  }

  /**
   * Get the weight for a key.
   * @param {string} key
   * @returns {number}
   */
  get(key) {
    return this.weights[key] || 0;
  }

  /**
   * Compute dot product with an ARU's keys.
   * @param {string[]} aruKeys - Array of "dimension:value" keys
   * @returns {number}
   */
  dotProduct(aruKeys) {
    let score = 0;
    for (const key of aruKeys) {
      score += this.weights[key] || 0;
    }
    return score;
  }

  /**
   * Clamp value to [min, max].
   * @param {number} value
   * @returns {number}
   */
  _clamp(value) {
    if (value > this.max) return this.max;
    if (value < this.min) return this.min;
    return value;
  }

  /**
   * Serialize to plain object.
   * @returns {Object}
   */
  toJSON() {
    return {
      weights: { ...this.weights },
      lastDecayTime: this.lastDecayTime,
      min: this.min,
      max: this.max,
      decayRate: this.decayRate,
    };
  }

  /**
   * Restore from plain object.
   * @param {Object} obj
   * @returns {URV}
   */
  static fromJSON(obj) {
    const urv = new URV({
      min: obj.min,
      max: obj.max,
      decayRate: obj.decayRate,
    });
    urv.weights = { ...obj.weights };
    urv.lastDecayTime = obj.lastDecayTime || Date.now();
    return urv;
  }
}

module.exports = { URV };
