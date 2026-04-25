'use strict';

const { DEFAULTS } = require('./constants');

/**
 * Atomic Resonance Unit (ARU)
 *
 * Every content item is decomposed into atomic categorical dimensions.
 * These are NOT learned embeddings - they are static, explicit categories
 * tagged by the creator or system rules.
 */
class ARU {
  /**
   * Create an ARU vector for a content item.
   * @param {Object} dimensions - Key-value map of dimension -> value(s)
   *   e.g. { topic: ['tech', 'ai'], creator: 'channel_42', format: 'video', language: 'en' }
   */
  constructor(dimensions = {}) {
    this.dimensions = {};
    for (const dim of DEFAULTS.ARU_DIMENSIONS) {
      const val = dimensions[dim];
      if (val !== undefined) {
        // Normalize to arrays for uniform handling
        this.dimensions[dim] = Array.isArray(val) ? val : [val];
      }
    }
  }

  /**
   * Return a flat set of "dimension:value" keys for dot-product computation.
   * @returns {string[]}
   */
  toKeys() {
    const keys = [];
    for (const [dim, values] of Object.entries(this.dimensions)) {
      for (const v of values) {
        keys.push(`${dim}:${v}`);
      }
    }
    return keys;
  }

  /**
   * Get the topic values (used for entropy calculations).
   * @returns {string[]}
   */
  getTopics() {
    return this.dimensions.topic || [];
  }

  /**
   * Get the creator value.
   * @returns {string|null}
   */
  getCreator() {
    const creators = this.dimensions.creator;
    return creators && creators.length > 0 ? creators[0] : null;
  }

  /**
   * Serialize to plain object.
   * @returns {Object}
   */
  toJSON() {
    return { dimensions: this.dimensions };
  }

  /**
   * Create ARU from plain object.
   * @param {Object} obj
   * @returns {ARU}
   */
  static fromJSON(obj) {
    const aru = new ARU();
    aru.dimensions = obj.dimensions || {};
    return aru;
  }
}

module.exports = { ARU };
