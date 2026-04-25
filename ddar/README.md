# ddar-engine

**Dynamics-Driven Atomic Resonance (DDAR)** - A deterministic, real-time content recommendation engine for activity feeds, social platforms, and news streams.

**Zero ML. Zero training. Zero embeddings. Pure deterministic rules and bitwise operations.**

## Why DDAR?

| Aspect | ML Recommenders | DDAR |
|--------|----------------|------|
| Cold start | Requires history | Instant - uses explicit tags |
| Latency | Model inference | Sub-millisecond scoring |
| Adaptability | Needs retraining | Real-time event-driven |
| Interpretability | Black box | Every score traceable to a rule |
| Infrastructure | GPU/TPU, model storage | Single CPU core, no models |
| Filter bubble | Hard to control | Explicit entropy constraint |

## Installation

```bash
npm install ddar-engine
```

## Quick Start

```javascript
const { DDAREngine } = require('ddar-engine');

// Create engine
const engine = new DDAREngine({
  feedSize: 20,
  explorationRate: 0.02,
});

// Add content items with atomic dimensions
engine.addItems([
  {
    id: 'post_1',
    dimensions: { topic: ['tech', 'javascript'], creator: 'alice', format: 'article' },
  },
  {
    id: 'post_2',
    dimensions: { topic: ['sports', 'football'], creator: 'bob', format: 'video' },
  },
  {
    id: 'post_3',
    dimensions: { topic: ['tech', 'python'], creator: 'charlie', format: 'article' },
  },
]);

// Set up social connections
engine.addConnection('user_1', 'alice');
engine.addConnection('user_1', 'bob');

// Handle user actions (deterministic updates, no training)
engine.handleAction('user_1', 'like', 'post_1');
engine.handleAction('user_1', 'share', 'post_3');
engine.handleAction('user_1', 'skip', 'post_2');

// Serve personalized feed
const feed = engine.serveFeed('user_1');
console.log(feed);
// Returns sorted array of { item, score, scoreRaw, diversityMultiplier, explored }

// Full interpretability - explain any score
const explanation = engine.explainScore('user_1', 'post_1');
console.log(explanation);
// {
//   components: { dotProduct, recencyBonus, socialGravity, explicitBoost },
//   rawScore, diversityMultiplier, finalScore,
//   keyWeights, itemDimensions
// }
```

## Core Concepts

### Atomic Resonance Units (ARUs)
Every content item is decomposed into atomic categorical dimensions:
- `topic` - Content topics (e.g., 'tech', 'sports')
- `creator` - Channel or author ID
- `format` - Content type (video, article, short)
- `language` - Content language
- `maturity_level` - Content rating
- `explicit_tags` - User-defined labels

### User Resonance Vector (URV)
A weighted vector updated in real-time by user actions:
- **like/view/click** -> +0.2
- **share** -> +0.5
- **skip/dismiss** -> -0.15
- **dwell >70%** -> +0.1 bonus
- **follow** -> +1.0 (creator)
- **block/mute** -> -1.0 / -100 (creator)

All weights decay by `0.999x` per second and are bounded to `[-10, +10]`.

### Temporal Entropy Field (TEF)
Prevents filter bubbles by measuring Shannon entropy of recent feed history. If adding an item would reduce diversity below a threshold, a penalty is applied.

### Social Gravity Index (SGI)
Deterministic social signal: friends' interactions with content boost its score by a fixed weight within a time window.

## API Reference

### `new DDAREngine(config?)`

Create an engine with optional configuration:

```javascript
const engine = new DDAREngine({
  actionDeltas: { like: 0.2, share: 0.5, skip: -0.15 },  // Custom deltas
  decayRate: 0.999,              // URV decay per second
  recencyWindowSeconds: 3600,    // Recency bonus window
  explicitBoost: 10,             // Boost for followed creators
  historySize: 50,               // TEF history size
  entropyThreshold: 0.1,         // Diversity threshold
  diversityPenalty: 0.3,         // Penalty factor
  explorationRate: 0.02,         // Random exploration rate
  feedSize: 20,                  // Items per feed
  socialGravityWeight: 0.1,      // Weight per friend interaction
  socialGravityWindowSeconds: 300, // Social gravity time window
  groupGravityWeight: 0.05,      // Weight for shared group
});
```

### Content Management

```javascript
engine.addItem({ id, dimensions, createdAt?, metadata? })
engine.addItems(items)
engine.removeItem(itemId)
engine.getItem(itemId)
engine.getAllItems()
```

### User Actions

```javascript
// Supported actions: view, click, skip, dismiss, share, like,
// fast_skip, follow, block, mute_creator, save
engine.handleAction(userId, action, itemId, { dwellPercent? })
```

### Social Graph

```javascript
engine.addConnection(userA, userB)
engine.removeConnection(userA, userB)
engine.addToGroup(userId, groupId)
```

### Feed Serving

```javascript
const feed = engine.serveFeed(userId, {
  candidateIds?,  // Filter to specific items
  feedSize?,      // Override default
  now?,           // Override current time (for testing)
});
```

### Interpretability

```javascript
const explanation = engine.explainScore(userId, itemId)
const weights = engine.getUserWeights(userId)
const entropy = engine.getUserEntropy(userId)
const history = engine.getUserHistory(userId)
const stats = engine.getStats()
```

## The DDAR Algorithm

For each candidate item, the scoring pipeline is:

1. **Raw Score** = `dot(URV, ARU) + recency_bonus + social_gravity + explicit_boost`
2. **Diversity Constraint** - If adding item reduces entropy below threshold, apply penalty
3. **Exploration** - 2% of items get random priority for freshness
4. **Rank & Serve** - Sort by final score, return top M items
5. **Feedback** - Each user action atomically updates the URV (no training)

## TypeScript Support

Full TypeScript definitions are included (`index.d.ts`).

## Zero Dependencies

This library has **zero runtime dependencies**. It uses only Node.js built-in modules.

## License

MIT
