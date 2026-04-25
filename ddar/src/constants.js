'use strict';

/**
 * Default constants for the DDAR engine.
 * All values are deterministic and explicitly defined - no learned weights.
 */

const DEFAULTS = {
  // URV update deltas per action type
  ACTION_DELTAS: {
    view: 0.2,
    click: 0.2,
    skip: -0.15,
    dismiss: -0.15,
    share: 0.5,
    dwell: 0.1,       // applied when dwell time > 70%
    follow: 1.0,
    block: -1.0,
    like: 0.2,
    fast_skip: -0.1,
    mute_creator: -100,
    save: 0.3,
  },

  // URV bounds
  URV_MIN: -10,
  URV_MAX: 10,

  // Decay rate: weights multiplied by this every second
  DECAY_RATE: 0.999,

  // Recency bonus: max(0, 1 - age_seconds / RECENCY_WINDOW)
  RECENCY_WINDOW_SECONDS: 3600,

  // Social gravity
  SOCIAL_GRAVITY_WEIGHT: 0.1,
  SOCIAL_GRAVITY_WINDOW_SECONDS: 300, // 5 minutes
  GROUP_GRAVITY_WEIGHT: 0.05,

  // Explicit boost when user follows/saved the creator
  EXPLICIT_BOOST: 10,

  // Diversity (TEF)
  HISTORY_SIZE: 50,
  ENTROPY_THRESHOLD: 0.1,
  DIVERSITY_PENALTY: 0.3,

  // Exploration
  EXPLORATION_RATE: 0.02, // 2%

  // Feed size
  FEED_SIZE: 20,

  // ARU dimensions
  ARU_DIMENSIONS: ['topic', 'creator', 'format', 'language', 'maturity_level', 'explicit_tags'],
};

module.exports = { DEFAULTS };
