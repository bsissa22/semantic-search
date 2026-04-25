'use strict';

const { DEFAULTS } = require('./constants');
const { ARU } = require('./aru');
const { URV } = require('./urv');
const { TEF } = require('./tef');
const { SGI } = require('./sgi');

/**
 * DDAR Engine
 *
 * The main orchestrator for the Dynamics-Driven Atomic Resonance system.
 * Manages users, content items, social graph, and feed serving.
 */
class DDAREngine {
  /**
   * @param {Object} [config] - Override default constants
   * @param {Object} [config.actionDeltas] - Custom action delta map
   * @param {number} [config.decayRate] - URV decay rate
   * @param {number} [config.recencyWindowSeconds] - Recency bonus window
   * @param {number} [config.explicitBoost] - Boost for followed creators
   * @param {number} [config.historySize] - TEF history size
   * @param {number} [config.entropyThreshold] - TEF entropy threshold
   * @param {number} [config.diversityPenalty] - TEF penalty factor
   * @param {number} [config.explorationRate] - Exploration probability
   * @param {number} [config.feedSize] - Number of items to serve
   * @param {number} [config.socialGravityWeight] - SGI weight per friend
   * @param {number} [config.socialGravityWindowSeconds] - SGI time window
   * @param {number} [config.groupGravityWeight] - SGI group weight
   */
  constructor(config = {}) {
    this.config = {
      actionDeltas: config.actionDeltas || { ...DEFAULTS.ACTION_DELTAS },
      decayRate: config.decayRate !== undefined ? config.decayRate : DEFAULTS.DECAY_RATE,
      recencyWindowSeconds: config.recencyWindowSeconds !== undefined ? config.recencyWindowSeconds : DEFAULTS.RECENCY_WINDOW_SECONDS,
      explicitBoost: config.explicitBoost !== undefined ? config.explicitBoost : DEFAULTS.EXPLICIT_BOOST,
      historySize: config.historySize !== undefined ? config.historySize : DEFAULTS.HISTORY_SIZE,
      entropyThreshold: config.entropyThreshold !== undefined ? config.entropyThreshold : DEFAULTS.ENTROPY_THRESHOLD,
      diversityPenalty: config.diversityPenalty !== undefined ? config.diversityPenalty : DEFAULTS.DIVERSITY_PENALTY,
      explorationRate: config.explorationRate !== undefined ? config.explorationRate : DEFAULTS.EXPLORATION_RATE,
      feedSize: config.feedSize !== undefined ? config.feedSize : DEFAULTS.FEED_SIZE,
      socialGravityWeight: config.socialGravityWeight !== undefined ? config.socialGravityWeight : DEFAULTS.SOCIAL_GRAVITY_WEIGHT,
      socialGravityWindowSeconds: config.socialGravityWindowSeconds !== undefined ? config.socialGravityWindowSeconds : DEFAULTS.SOCIAL_GRAVITY_WINDOW_SECONDS,
      groupGravityWeight: config.groupGravityWeight !== undefined ? config.groupGravityWeight : DEFAULTS.GROUP_GRAVITY_WEIGHT,
    };

    // User state: userId -> { urv: URV, tef: TEF, followedCreators: Set, blockedCreators: Set }
    this.users = new Map();

    // Content pool: itemId -> { aru: ARU, createdAt: number, id: string, metadata: Object }
    this.items = new Map();

    // Social graph
    this.sgi = new SGI({
      gravityWeight: this.config.socialGravityWeight,
      gravityWindowSeconds: this.config.socialGravityWindowSeconds,
      groupWeight: this.config.groupGravityWeight,
    });
  }

  // ─── User Management ───────────────────────────────────────────────

  /**
   * Register or get a user. Creates URV and TEF if new.
   * @param {string} userId
   * @returns {Object} User state
   */
  getOrCreateUser(userId) {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        urv: new URV({ decayRate: this.config.decayRate }),
        tef: new TEF({
          historySize: this.config.historySize,
          entropyThreshold: this.config.entropyThreshold,
          penaltyFactor: this.config.diversityPenalty,
        }),
        followedCreators: new Set(),
        blockedCreators: new Set(),
      });
    }
    return this.users.get(userId);
  }

  /**
   * Check if user exists.
   * @param {string} userId
   * @returns {boolean}
   */
  hasUser(userId) {
    return this.users.has(userId);
  }

  /**
   * Remove a user.
   * @param {string} userId
   */
  removeUser(userId) {
    this.users.delete(userId);
  }

  // ─── Content Management ────────────────────────────────────────────

  /**
   * Add a content item to the pool.
   * @param {Object} item
   * @param {string} item.id - Unique item ID
   * @param {Object} item.dimensions - ARU dimensions (topic, creator, format, etc.)
   * @param {number} [item.createdAt] - Timestamp in ms, defaults to now
   * @param {Object} [item.metadata] - Arbitrary metadata to attach
   * @returns {Object} The stored item
   */
  addItem(item) {
    const aru = new ARU(item.dimensions || {});
    const stored = {
      id: item.id,
      aru,
      createdAt: item.createdAt || Date.now(),
      metadata: item.metadata || {},
    };
    this.items.set(item.id, stored);
    return stored;
  }

  /**
   * Add multiple items.
   * @param {Object[]} items
   * @returns {Object[]}
   */
  addItems(items) {
    return items.map(item => this.addItem(item));
  }

  /**
   * Remove an item from the pool.
   * @param {string} itemId
   */
  removeItem(itemId) {
    this.items.delete(itemId);
  }

  /**
   * Get an item.
   * @param {string} itemId
   * @returns {Object|undefined}
   */
  getItem(itemId) {
    return this.items.get(itemId);
  }

  /**
   * Get all items as an array.
   * @returns {Object[]}
   */
  getAllItems() {
    return Array.from(this.items.values());
  }

  // ─── Social Graph ──────────────────────────────────────────────────

  /**
   * Add a social connection between two users.
   * @param {string} userA
   * @param {string} userB
   */
  addConnection(userA, userB) {
    this.sgi.addConnection(userA, userB);
  }

  /**
   * Remove a social connection.
   * @param {string} userA
   * @param {string} userB
   */
  removeConnection(userA, userB) {
    this.sgi.removeConnection(userA, userB);
  }

  /**
   * Add a user to a group.
   * @param {string} userId
   * @param {string} groupId
   */
  addToGroup(userId, groupId) {
    this.sgi.addToGroup(userId, groupId);
  }

  // ─── Action Handling ───────────────────────────────────────────────

  /**
   * Handle a user action on an item. Updates the URV deterministically.
   * @param {string} userId
   * @param {string} action - One of the action types (view, click, skip, share, like, etc.)
   * @param {string} itemId
   * @param {Object} [options]
   * @param {number} [options.dwellPercent] - Dwell time percentage (0-100)
   */
  handleAction(userId, action, itemId, options = {}) {
    const user = this.getOrCreateUser(userId);
    const item = this.items.get(itemId);
    if (!item) return;

    const urv = user.urv;
    urv.applyDecay();

    const aruKeys = item.aru.toKeys();
    const delta = this.config.actionDeltas[action];

    if (action === 'mute_creator') {
      const creator = item.aru.getCreator();
      if (creator) {
        urv.set(`creator:${creator}`, -100);
        user.blockedCreators.add(creator);
      }
      return;
    }

    if (action === 'follow') {
      const creator = item.aru.getCreator();
      if (creator) {
        urv.update(`creator:${creator}`, delta || 1.0);
        user.followedCreators.add(creator);
      }
      return;
    }

    if (action === 'block') {
      const creator = item.aru.getCreator();
      if (creator) {
        urv.update(`creator:${creator}`, delta || -1.0);
        user.blockedCreators.add(creator);
      }
      return;
    }

    if (delta !== undefined) {
      for (const key of aruKeys) {
        urv.update(key, delta);
      }
    }

    // Dwell time bonus
    if (options.dwellPercent !== undefined && options.dwellPercent > 70) {
      const dwellDelta = this.config.actionDeltas.dwell || 0.1;
      for (const key of aruKeys) {
        urv.update(key, dwellDelta);
      }
    }

    // Record interaction for social gravity
    this.sgi.recordInteraction(userId, itemId);
  }

  // ─── Scoring ───────────────────────────────────────────────────────

  /**
   * Compute recency bonus for an item.
   * @param {number} createdAt - Item creation timestamp in ms
   * @param {number} [now] - Current time in ms
   * @returns {number}
   */
  _recencyBonus(createdAt, now) {
    const currentTime = now || Date.now();
    const ageSeconds = (currentTime - createdAt) / 1000;
    return Math.max(0, 1 - (ageSeconds / this.config.recencyWindowSeconds));
  }

  /**
   * Compute explicit boost for a user and item.
   * @param {Object} user - User state
   * @param {Object} item - Stored item
   * @returns {number}
   */
  _explicitBoost(user, item) {
    const creator = item.aru.getCreator();
    if (creator && user.followedCreators.has(creator)) {
      return this.config.explicitBoost;
    }
    return 0;
  }

  /**
   * Compute raw score for an item and user.
   * @param {string} userId
   * @param {Object} item - Stored item
   * @param {number} [now] - Current time in ms
   * @returns {number}
   */
  _rawScore(userId, item, now) {
    const user = this.getOrCreateUser(userId);
    const urv = user.urv;

    // Check if creator is blocked
    const creator = item.aru.getCreator();
    if (creator && user.blockedCreators.has(creator)) {
      return -Infinity;
    }

    const aruKeys = item.aru.toKeys();
    const dot = urv.dotProduct(aruKeys);
    const recency = this._recencyBonus(item.createdAt, now);
    const social = this.sgi.computeGravity(userId, item.id, now);
    const boost = this._explicitBoost(user, item);

    return dot + recency + social + boost;
  }

  // ─── Feed Serving ──────────────────────────────────────────────────

  /**
   * Serve a personalized feed for a user.
   * This is the main DDAR algorithm: score, diversify, explore, rank.
   *
   * @param {string} userId
   * @param {Object} [options]
   * @param {string[]} [options.candidateIds] - Specific item IDs to consider (defaults to all)
   * @param {number} [options.feedSize] - Override default feed size
   * @param {number} [options.now] - Override current time for testing
   * @returns {Object[]} Ranked array of { item, score, scoreRaw, diversityMultiplier, explored }
   */
  serveFeed(userId, options = {}) {
    const user = this.getOrCreateUser(userId);
    const urv = user.urv;
    const tef = user.tef;
    const feedSize = options.feedSize || this.config.feedSize;
    const now = options.now || Date.now();

    // Apply decay
    urv.applyDecay();

    // Get candidates
    let candidates;
    if (options.candidateIds) {
      candidates = options.candidateIds
        .map(id => this.items.get(id))
        .filter(Boolean);
    } else {
      candidates = this.getAllItems();
    }

    if (candidates.length === 0) return [];

    // Score all candidates
    const scored = [];
    for (const item of candidates) {
      const rawScore = this._rawScore(userId, item, now);
      if (rawScore === -Infinity) continue; // blocked

      // Step 2: Diversity constraint
      const topics = item.aru.getTopics();
      const diversityMultiplier = tef.getDiversityMultiplier(topics);
      let finalScore = rawScore * diversityMultiplier;

      // Step 3: Exploration
      let explored = false;
      if (Math.random() < this.config.explorationRate) {
        finalScore = Math.random() * 100; // Random priority for exploration
        explored = true;
      }

      scored.push({
        item: {
          id: item.id,
          dimensions: item.aru.dimensions,
          createdAt: item.createdAt,
          metadata: item.metadata,
        },
        score: finalScore,
        scoreRaw: rawScore,
        diversityMultiplier,
        explored,
      });
    }

    // Step 4: Sort by final score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Take top M
    const result = scored.slice(0, feedSize);

    // Update TEF history with served items
    for (const entry of result) {
      const topics = entry.item.dimensions.topic || [];
      const topicArray = Array.isArray(topics) ? topics : [topics];
      tef.addToHistory(topicArray);
    }

    return result;
  }

  // ─── Utility ───────────────────────────────────────────────────────

  /**
   * Get the current resonance vector for a user.
   * @param {string} userId
   * @returns {Object} Weights map
   */
  getUserWeights(userId) {
    const user = this.getOrCreateUser(userId);
    user.urv.applyDecay();
    return { ...user.urv.weights };
  }

  /**
   * Get user's TEF history.
   * @param {string} userId
   * @returns {string[][]}
   */
  getUserHistory(userId) {
    const user = this.getOrCreateUser(userId);
    return user.tef.getHistory();
  }

  /**
   * Get current entropy of a user's history.
   * @param {string} userId
   * @returns {number}
   */
  getUserEntropy(userId) {
    const user = this.getOrCreateUser(userId);
    return user.tef.computeEntropy();
  }

  /**
   * Explain why an item was scored a certain way for a user.
   * Full interpretability - every score component is traceable.
   * @param {string} userId
   * @param {string} itemId
   * @param {number} [now]
   * @returns {Object} Breakdown of score components
   */
  explainScore(userId, itemId, now) {
    const user = this.getOrCreateUser(userId);
    const item = this.items.get(itemId);
    if (!item) return null;

    const currentTime = now || Date.now();
    const urv = user.urv;
    urv.applyDecay();

    const aruKeys = item.aru.toKeys();
    const dot = urv.dotProduct(aruKeys);
    const recency = this._recencyBonus(item.createdAt, currentTime);
    const social = this.sgi.computeGravity(userId, item.id, currentTime);
    const boost = this._explicitBoost(user, item);
    const topics = item.aru.getTopics();
    const diversityMultiplier = user.tef.getDiversityMultiplier(topics);

    const rawScore = dot + recency + social + boost;
    const finalScore = rawScore * diversityMultiplier;

    // Per-key weights
    const keyWeights = {};
    for (const key of aruKeys) {
      keyWeights[key] = urv.get(key);
    }

    return {
      itemId,
      userId,
      components: {
        dotProduct: dot,
        recencyBonus: recency,
        socialGravity: social,
        explicitBoost: boost,
      },
      rawScore,
      diversityMultiplier,
      finalScore,
      keyWeights,
      itemDimensions: item.aru.dimensions,
    };
  }

  /**
   * Prune old social interactions to free memory.
   * @param {number} [maxAgeMs]
   */
  pruneInteractions(maxAgeMs) {
    this.sgi.pruneInteractions(maxAgeMs);
  }

  /**
   * Get engine stats.
   * @returns {Object}
   */
  getStats() {
    return {
      totalUsers: this.users.size,
      totalItems: this.items.size,
      config: { ...this.config },
    };
  }
}

module.exports = { DDAREngine };
