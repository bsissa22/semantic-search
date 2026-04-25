'use strict';

const { DEFAULTS } = require('./constants');

/**
 * Social Gravity Index (SGI)
 *
 * Deterministic closeness metric replacing collaborative filtering.
 * Uses explicit social connections (friends, follows, groups) to boost
 * content scores based on friends' interactions.
 */
class SGI {
  /**
   * @param {Object} [options]
   * @param {number} [options.gravityWeight] - Weight per friend interaction
   * @param {number} [options.gravityWindowSeconds] - Time window for friend interactions
   * @param {number} [options.groupWeight] - Weight for shared group membership
   */
  constructor(options = {}) {
    this.gravityWeight = options.gravityWeight !== undefined ? options.gravityWeight : DEFAULTS.SOCIAL_GRAVITY_WEIGHT;
    this.gravityWindowSeconds = options.gravityWindowSeconds !== undefined ? options.gravityWindowSeconds : DEFAULTS.SOCIAL_GRAVITY_WINDOW_SECONDS;
    this.groupWeight = options.groupWeight !== undefined ? options.groupWeight : DEFAULTS.GROUP_GRAVITY_WEIGHT;

    // Social graph: userId -> Set of connected userIds
    this.connections = new Map();

    // Group memberships: userId -> Set of groupIds
    this.groups = new Map();

    // Interaction log: itemId -> [{userId, timestamp}]
    this.interactions = new Map();
  }

  /**
   * Add a social connection (bidirectional).
   * @param {string} userA
   * @param {string} userB
   */
  addConnection(userA, userB) {
    if (!this.connections.has(userA)) this.connections.set(userA, new Set());
    if (!this.connections.has(userB)) this.connections.set(userB, new Set());
    this.connections.get(userA).add(userB);
    this.connections.get(userB).add(userA);
  }

  /**
   * Remove a social connection.
   * @param {string} userA
   * @param {string} userB
   */
  removeConnection(userA, userB) {
    if (this.connections.has(userA)) this.connections.get(userA).delete(userB);
    if (this.connections.has(userB)) this.connections.get(userB).delete(userA);
  }

  /**
   * Add user to a group.
   * @param {string} userId
   * @param {string} groupId
   */
  addToGroup(userId, groupId) {
    if (!this.groups.has(userId)) this.groups.set(userId, new Set());
    this.groups.get(userId).add(groupId);
  }

  /**
   * Record a user interaction with an item.
   * @param {string} userId
   * @param {string} itemId
   * @param {number} [timestamp] - ms since epoch, defaults to now
   */
  recordInteraction(userId, itemId, timestamp) {
    const ts = timestamp || Date.now();
    if (!this.interactions.has(itemId)) this.interactions.set(itemId, []);
    this.interactions.get(itemId).push({ userId, timestamp: ts });
  }

  /**
   * Compute social gravity score for a user and item.
   * @param {string} userId
   * @param {string} itemId
   * @param {number} [now] - Current timestamp in ms
   * @returns {number}
   */
  computeGravity(userId, itemId, now) {
    const currentTime = now || Date.now();
    const windowMs = this.gravityWindowSeconds * 1000;
    const cutoff = currentTime - windowMs;

    let score = 0;

    // Friend interactions
    const friends = this.connections.get(userId);
    const itemInteractions = this.interactions.get(itemId);

    if (friends && itemInteractions) {
      for (const interaction of itemInteractions) {
        if (interaction.timestamp >= cutoff && friends.has(interaction.userId)) {
          score += this.gravityWeight;
        }
      }
    }

    // Group-based boost: check if any interactors share a group with the user
    const userGroups = this.groups.get(userId);
    if (userGroups && userGroups.size > 0 && itemInteractions) {
      for (const interaction of itemInteractions) {
        if (interaction.timestamp >= cutoff && interaction.userId !== userId) {
          const otherGroups = this.groups.get(interaction.userId);
          if (otherGroups) {
            for (const g of userGroups) {
              if (otherGroups.has(g)) {
                score += this.groupWeight;
                break; // Only count once per user per shared group
              }
            }
          }
        }
      }
    }

    return score;
  }

  /**
   * Clean up old interactions outside all windows to save memory.
   * @param {number} [maxAgeMs] - Max age in ms, defaults to 1 hour
   */
  pruneInteractions(maxAgeMs) {
    const maxAge = maxAgeMs || 3600000;
    const cutoff = Date.now() - maxAge;
    for (const [itemId, interactions] of this.interactions) {
      const filtered = interactions.filter(i => i.timestamp >= cutoff);
      if (filtered.length === 0) {
        this.interactions.delete(itemId);
      } else {
        this.interactions.set(itemId, filtered);
      }
    }
  }

  /**
   * Get friends of a user.
   * @param {string} userId
   * @returns {string[]}
   */
  getFriends(userId) {
    const friends = this.connections.get(userId);
    return friends ? Array.from(friends) : [];
  }

  /**
   * Get groups of a user.
   * @param {string} userId
   * @returns {string[]}
   */
  getGroups(userId) {
    const groups = this.groups.get(userId);
    return groups ? Array.from(groups) : [];
  }
}

module.exports = { SGI };
