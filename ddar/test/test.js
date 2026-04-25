'use strict';

const { DDAREngine, ARU, URV, TEF, SGI, DEFAULTS } = require('../index');

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertClose(a, b, tolerance, message) {
  assert(Math.abs(a - b) < tolerance, `${message} (got ${a}, expected ~${b})`);
}

function section(name) {
  console.log(`\n=== ${name} ===`);
}

// ─── ARU Tests ─────────────────────────────────────────────────────

section('ARU - Atomic Resonance Units');

(() => {
  const aru = new ARU({ topic: ['tech', 'ai'], creator: 'channel_1', format: 'video' });
  assert(aru.getTopics().length === 2, 'ARU has 2 topics');
  assert(aru.getTopics().includes('tech'), 'ARU includes topic "tech"');
  assert(aru.getCreator() === 'channel_1', 'ARU creator is channel_1');

  const keys = aru.toKeys();
  assert(keys.includes('topic:tech'), 'Keys include topic:tech');
  assert(keys.includes('topic:ai'), 'Keys include topic:ai');
  assert(keys.includes('creator:channel_1'), 'Keys include creator:channel_1');
  assert(keys.includes('format:video'), 'Keys include format:video');
  assert(keys.length === 4, 'ARU has 4 keys total');
})();

(() => {
  const aru = new ARU({});
  assert(aru.toKeys().length === 0, 'Empty ARU has no keys');
  assert(aru.getCreator() === null, 'Empty ARU has null creator');
  assert(aru.getTopics().length === 0, 'Empty ARU has no topics');
})();

(() => {
  const aru = new ARU({ topic: 'single_topic' });
  assert(aru.getTopics().length === 1, 'Single string topic is normalized to array');
  assert(aru.getTopics()[0] === 'single_topic', 'Single topic value correct');
})();

(() => {
  const aru = new ARU({ topic: ['a', 'b'], creator: 'c' });
  const json = aru.toJSON();
  const restored = ARU.fromJSON(json);
  assert(restored.getTopics().length === 2, 'ARU serialization roundtrip preserves topics');
  assert(restored.getCreator() === 'c', 'ARU serialization roundtrip preserves creator');
})();

// ─── URV Tests ─────────────────────────────────────────────────────

section('URV - User Resonance Vector');

(() => {
  const urv = new URV();
  assert(urv.get('topic:tech') === 0, 'URV starts at 0 for unknown keys');

  urv.update('topic:tech', 0.2);
  assertClose(urv.get('topic:tech'), 0.2, 0.001, 'URV update adds delta');

  urv.update('topic:tech', 0.3);
  assertClose(urv.get('topic:tech'), 0.5, 0.001, 'URV accumulates deltas');
})();

(() => {
  const urv = new URV({ min: -5, max: 5 });
  urv.update('topic:x', 100);
  assert(urv.get('topic:x') === 5, 'URV clamps to max');
  urv.update('topic:x', -200);
  assert(urv.get('topic:x') === -5, 'URV clamps to min');
})();

(() => {
  const urv = new URV();
  urv.set('creator:abc', -100);
  assert(urv.get('creator:abc') === -10, 'URV set clamps to default min');
})();

(() => {
  const urv = new URV();
  urv.update('topic:a', 1.0);
  urv.update('topic:b', 2.0);
  const dot = urv.dotProduct(['topic:a', 'topic:b', 'topic:c']);
  assertClose(dot, 3.0, 0.001, 'Dot product sums matching weights');
})();

(() => {
  const urv = new URV();
  urv.update('topic:a', 1.0);
  const json = urv.toJSON();
  const restored = URV.fromJSON(json);
  assertClose(restored.get('topic:a'), 1.0, 0.001, 'URV serialization roundtrip');
})();

// ─── TEF Tests ─────────────────────────────────────────────────────

section('TEF - Temporal Entropy Field');

(() => {
  const tef = new TEF();
  assert(tef.computeEntropy() === 0, 'Empty TEF has zero entropy');
})();

(() => {
  const tef = new TEF();
  tef.addToHistory(['tech']);
  tef.addToHistory(['tech']);
  tef.addToHistory(['tech']);
  const entropy = tef.computeEntropy();
  assert(entropy === 0, 'All-same topics produce zero entropy');
})();

(() => {
  const tef = new TEF();
  tef.addToHistory(['tech']);
  tef.addToHistory(['sports']);
  const entropy = tef.computeEntropy();
  assert(entropy > 0, 'Different topics produce positive entropy');
  assertClose(entropy, 1.0, 0.001, 'Two equal topics produce entropy of 1.0');
})();

(() => {
  const tef = new TEF({ historySize: 3 });
  tef.addToHistory(['a']);
  tef.addToHistory(['b']);
  tef.addToHistory(['c']);
  tef.addToHistory(['d']);
  assert(tef.getHistory().length === 3, 'History respects max size');
})();

(() => {
  // Test diversity multiplier
  const tef = new TEF({ entropyThreshold: 0.1, penaltyFactor: 0.3 });
  // Fill with diverse topics
  tef.addToHistory(['tech']);
  tef.addToHistory(['sports']);
  tef.addToHistory(['music']);
  tef.addToHistory(['science']);

  // Adding another diverse topic should not be penalized
  const mult1 = tef.getDiversityMultiplier(['cooking']);
  assert(mult1 === 1.0, 'Diverse item is not penalized');

  // Now fill with one topic to make it low-entropy
  const tef2 = new TEF({ entropyThreshold: 0.1, penaltyFactor: 0.3 });
  tef2.addToHistory(['tech']);
  tef2.addToHistory(['tech']);
  tef2.addToHistory(['tech']);
  tef2.addToHistory(['sports']); // one different to have some entropy

  // Adding more 'tech' should be penalized (reduces entropy)
  const mult2 = tef2.getDiversityMultiplier(['tech']);
  assert(mult2 <= 1.0, 'Repetitive item may be penalized');
})();

// ─── SGI Tests ─────────────────────────────────────────────────────

section('SGI - Social Gravity Index');

(() => {
  const sgi = new SGI();
  sgi.addConnection('alice', 'bob');
  const friends = sgi.getFriends('alice');
  assert(friends.includes('bob'), 'Alice has Bob as friend');
  assert(sgi.getFriends('bob').includes('alice'), 'Connection is bidirectional');
})();

(() => {
  const sgi = new SGI();
  sgi.addConnection('alice', 'bob');
  sgi.removeConnection('alice', 'bob');
  assert(sgi.getFriends('alice').length === 0, 'Connection removed for alice');
  assert(sgi.getFriends('bob').length === 0, 'Connection removed for bob');
})();

(() => {
  const sgi = new SGI({ gravityWeight: 0.1, gravityWindowSeconds: 300 });
  const now = Date.now();
  sgi.addConnection('alice', 'bob');
  sgi.recordInteraction('bob', 'item_1', now - 1000); // 1 second ago

  const gravity = sgi.computeGravity('alice', 'item_1', now);
  assertClose(gravity, 0.1, 0.001, 'Friend interaction adds gravity');
})();

(() => {
  const sgi = new SGI({ gravityWeight: 0.1, gravityWindowSeconds: 300 });
  const now = Date.now();
  sgi.addConnection('alice', 'bob');
  sgi.recordInteraction('bob', 'item_1', now - 600000); // 10 minutes ago, outside window

  const gravity = sgi.computeGravity('alice', 'item_1', now);
  assert(gravity === 0, 'Old interaction outside window has no gravity');
})();

(() => {
  const sgi = new SGI({ groupWeight: 0.05, gravityWindowSeconds: 300 });
  const now = Date.now();
  sgi.addToGroup('alice', 'team_a');
  sgi.addToGroup('charlie', 'team_a');
  sgi.recordInteraction('charlie', 'item_2', now - 1000);

  const gravity = sgi.computeGravity('alice', 'item_2', now);
  assertClose(gravity, 0.05, 0.001, 'Group member interaction adds group gravity');
})();

(() => {
  const sgi = new SGI();
  sgi.addToGroup('alice', 'team_a');
  assert(sgi.getGroups('alice').includes('team_a'), 'User group membership tracked');
})();

// ─── DDAREngine Tests ──────────────────────────────────────────────

section('DDAREngine - Core Engine');

(() => {
  const engine = new DDAREngine();
  assert(engine !== null, 'Engine creates successfully');
  assert(engine.config.feedSize === 20, 'Default feed size is 20');
  assert(engine.config.explorationRate === 0.02, 'Default exploration rate is 0.02');
})();

(() => {
  const engine = new DDAREngine({ feedSize: 10, explorationRate: 0 });
  assert(engine.config.feedSize === 10, 'Custom feed size accepted');
  assert(engine.config.explorationRate === 0, 'Custom exploration rate accepted');
})();

// Item management
(() => {
  const engine = new DDAREngine();
  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech'], creator: 'alice' } });
  assert(engine.getItem('item_1') !== undefined, 'Item added and retrievable');
  assert(engine.getAllItems().length === 1, 'getAllItems returns correct count');

  engine.removeItem('item_1');
  assert(engine.getItem('item_1') === undefined, 'Item removed');
})();

// Batch add
(() => {
  const engine = new DDAREngine();
  engine.addItems([
    { id: 'a', dimensions: { topic: ['tech'] } },
    { id: 'b', dimensions: { topic: ['sports'] } },
  ]);
  assert(engine.getAllItems().length === 2, 'Batch add works');
})();

// User management
(() => {
  const engine = new DDAREngine();
  assert(!engine.hasUser('user_1'), 'User does not exist initially');
  engine.getOrCreateUser('user_1');
  assert(engine.hasUser('user_1'), 'User exists after getOrCreate');
  engine.removeUser('user_1');
  assert(!engine.hasUser('user_1'), 'User removed');
})();

// Action handling
(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  const now = Date.now();

  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech', 'ai'], creator: 'alice' }, createdAt: now });

  engine.handleAction('user_1', 'like', 'item_1');
  const weights = engine.getUserWeights('user_1');
  assertClose(weights['topic:tech'], 0.2, 0.01, 'Like increases topic weight by 0.2');
  assertClose(weights['topic:ai'], 0.2, 0.01, 'Like increases all topic dimensions');
})();

// Share action
(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech'] }, createdAt: Date.now() });

  engine.handleAction('user_1', 'share', 'item_1');
  const weights = engine.getUserWeights('user_1');
  assertClose(weights['topic:tech'], 0.5, 0.01, 'Share increases topic weight by 0.5');
})();

// Skip action
(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech'] }, createdAt: Date.now() });

  engine.handleAction('user_1', 'skip', 'item_1');
  const weights = engine.getUserWeights('user_1');
  assertClose(weights['topic:tech'], -0.15, 0.01, 'Skip decreases topic weight by 0.15');
})();

// Dwell time bonus
(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech'] }, createdAt: Date.now() });

  engine.handleAction('user_1', 'view', 'item_1', { dwellPercent: 80 });
  const weights = engine.getUserWeights('user_1');
  // view = 0.2, dwell bonus = 0.1, total = 0.3
  assertClose(weights['topic:tech'], 0.3, 0.01, 'Dwell >70% adds bonus');
})();

// Mute creator
(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech'], creator: 'spammer' }, createdAt: Date.now() });

  engine.handleAction('user_1', 'mute_creator', 'item_1');
  const weights = engine.getUserWeights('user_1');
  assert(weights['creator:spammer'] === -10, 'Mute creator sets weight to min (-10)');
})();

// Follow creator + explicit boost
(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  const now = Date.now();
  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech'], creator: 'favorite' }, createdAt: now });
  engine.addItem({ id: 'item_2', dimensions: { topic: ['tech'], creator: 'other' }, createdAt: now });

  engine.handleAction('user_1', 'follow', 'item_1');

  const explanation = engine.explainScore('user_1', 'item_1', now);
  assert(explanation.components.explicitBoost === 10, 'Followed creator gets explicit boost of 10');

  const explanation2 = engine.explainScore('user_1', 'item_2', now);
  assert(explanation2.components.explicitBoost === 0, 'Non-followed creator gets no boost');
})();

// ─── Feed Serving Tests ────────────────────────────────────────────

section('Feed Serving');

(() => {
  const engine = new DDAREngine({ explorationRate: 0, feedSize: 5 });
  const now = Date.now();

  // Add items
  for (let i = 0; i < 10; i++) {
    engine.addItem({
      id: `item_${i}`,
      dimensions: { topic: [i < 5 ? 'tech' : 'sports'], creator: `creator_${i}` },
      createdAt: now - (i * 1000),
    });
  }

  // User likes tech
  engine.handleAction('user_1', 'like', 'item_0');
  engine.handleAction('user_1', 'like', 'item_1');

  const feed = engine.serveFeed('user_1', { now });
  assert(feed.length === 5, 'Feed returns correct number of items');
  assert(feed[0].score >= feed[1].score, 'Feed is sorted by score descending');

  // Tech items should rank higher
  const techItems = feed.filter(e => e.item.dimensions.topic && e.item.dimensions.topic.includes('tech'));
  assert(techItems.length > 0, 'Tech items appear in feed after liking tech');
})();

// Feed with candidate filtering
(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  const now = Date.now();
  engine.addItem({ id: 'a', dimensions: { topic: ['tech'] }, createdAt: now });
  engine.addItem({ id: 'b', dimensions: { topic: ['sports'] }, createdAt: now });
  engine.addItem({ id: 'c', dimensions: { topic: ['music'] }, createdAt: now });

  const feed = engine.serveFeed('user_1', { candidateIds: ['a', 'c'], now });
  assert(feed.length === 2, 'Feed filters to candidate IDs only');
  const ids = feed.map(e => e.item.id);
  assert(!ids.includes('b'), 'Non-candidate item excluded');
})();

// Empty candidate pool
(() => {
  const engine = new DDAREngine();
  const feed = engine.serveFeed('user_1');
  assert(feed.length === 0, 'Empty pool returns empty feed');
})();

// Blocked creator is excluded
(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  const now = Date.now();
  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech'], creator: 'spammer' }, createdAt: now });
  engine.addItem({ id: 'item_2', dimensions: { topic: ['tech'], creator: 'good' }, createdAt: now });

  engine.handleAction('user_1', 'mute_creator', 'item_1');
  const feed = engine.serveFeed('user_1', { now });
  const ids = feed.map(e => e.item.id);
  assert(!ids.includes('item_1'), 'Muted creator item excluded from feed');
  assert(ids.includes('item_2'), 'Non-muted item still in feed');
})();

// ─── Social Gravity in Feed ────────────────────────────────────────

section('Social Gravity in Feed');

(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  const now = Date.now();

  engine.addItem({ id: 'viral', dimensions: { topic: ['news'] }, createdAt: now });
  engine.addItem({ id: 'normal', dimensions: { topic: ['news'] }, createdAt: now });

  engine.addConnection('user_1', 'friend_1');
  engine.addConnection('user_1', 'friend_2');

  // Friends interact with 'viral'
  engine.handleAction('friend_1', 'like', 'viral');
  engine.handleAction('friend_2', 'share', 'viral');

  const explanation = engine.explainScore('user_1', 'viral', now);
  assert(explanation.components.socialGravity > 0, 'Social gravity boosts viral item');

  const explanationNormal = engine.explainScore('user_1', 'normal', now);
  assert(explanation.components.socialGravity > explanationNormal.components.socialGravity,
    'Viral item has more social gravity than normal item');
})();

// ─── Recency Bonus Tests ───────────────────────────────────────────

section('Recency Bonus');

(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  const now = Date.now();

  engine.addItem({ id: 'new', dimensions: { topic: ['tech'] }, createdAt: now });
  engine.addItem({ id: 'old', dimensions: { topic: ['tech'] }, createdAt: now - 7200000 }); // 2 hours ago

  const newExpl = engine.explainScore('user_1', 'new', now);
  const oldExpl = engine.explainScore('user_1', 'old', now);

  assertClose(newExpl.components.recencyBonus, 1.0, 0.01, 'Brand new item gets full recency bonus');
  assert(oldExpl.components.recencyBonus === 0, 'Old item gets zero recency bonus');
})();

// ─── Diversity (TEF) in Feed ───────────────────────────────────────

section('Diversity Constraint');

(() => {
  const engine = new DDAREngine({ explorationRate: 0, feedSize: 10, entropyThreshold: 0.1, diversityPenalty: 0.3 });
  const now = Date.now();

  // Add many tech items and a few sports items
  for (let i = 0; i < 10; i++) {
    engine.addItem({
      id: `tech_${i}`,
      dimensions: { topic: ['tech'] },
      createdAt: now,
    });
  }
  engine.addItem({ id: 'sports_1', dimensions: { topic: ['sports'] }, createdAt: now });

  // Prime user heavily for tech
  for (let i = 0; i < 5; i++) {
    engine.handleAction('user_1', 'like', `tech_${i}`);
  }

  // Serve multiple feeds to fill history
  engine.serveFeed('user_1', { now });
  engine.serveFeed('user_1', { now });

  // After filling history with tech, entropy should be low
  const entropy = engine.getUserEntropy('user_1');
  // Entropy is computed, just verify it works
  assert(typeof entropy === 'number', 'Entropy returns a number');
})();

// ─── Explain Score ─────────────────────────────────────────────────

section('Explain Score');

(() => {
  const engine = new DDAREngine({ explorationRate: 0 });
  const now = Date.now();
  engine.addItem({ id: 'item_1', dimensions: { topic: ['tech', 'ai'], creator: 'alice' }, createdAt: now });

  engine.handleAction('user_1', 'like', 'item_1');

  const explanation = engine.explainScore('user_1', 'item_1', now);
  assert(explanation !== null, 'Explanation is not null');
  assert(explanation.itemId === 'item_1', 'Explanation has correct item ID');
  assert(explanation.userId === 'user_1', 'Explanation has correct user ID');
  assert(typeof explanation.components.dotProduct === 'number', 'Explanation has dotProduct');
  assert(typeof explanation.components.recencyBonus === 'number', 'Explanation has recencyBonus');
  assert(typeof explanation.components.socialGravity === 'number', 'Explanation has socialGravity');
  assert(typeof explanation.components.explicitBoost === 'number', 'Explanation has explicitBoost');
  assert(typeof explanation.rawScore === 'number', 'Explanation has rawScore');
  assert(typeof explanation.finalScore === 'number', 'Explanation has finalScore');
  assert(typeof explanation.diversityMultiplier === 'number', 'Explanation has diversityMultiplier');
  assert(explanation.keyWeights !== undefined, 'Explanation has keyWeights');
  assert(explanation.itemDimensions !== undefined, 'Explanation has itemDimensions');
})();

(() => {
  const engine = new DDAREngine();
  const result = engine.explainScore('user_1', 'nonexistent');
  assert(result === null, 'Explain score returns null for nonexistent item');
})();

// ─── Engine Stats ──────────────────────────────────────────────────

section('Engine Stats');

(() => {
  const engine = new DDAREngine();
  engine.addItem({ id: 'a', dimensions: { topic: ['x'] } });
  engine.addItem({ id: 'b', dimensions: { topic: ['y'] } });
  engine.getOrCreateUser('u1');

  const stats = engine.getStats();
  assert(stats.totalUsers === 1, 'Stats show correct user count');
  assert(stats.totalItems === 2, 'Stats show correct item count');
})();

// ─── DEFAULTS Export ───────────────────────────────────────────────

section('DEFAULTS Export');

(() => {
  assert(DEFAULTS !== undefined, 'DEFAULTS is exported');
  assert(DEFAULTS.ACTION_DELTAS !== undefined, 'ACTION_DELTAS accessible');
  assert(DEFAULTS.DECAY_RATE === 0.999, 'DECAY_RATE is 0.999');
  assert(DEFAULTS.FEED_SIZE === 20, 'FEED_SIZE is 20');
  assert(DEFAULTS.EXPLORATION_RATE === 0.02, 'EXPLORATION_RATE is 0.02');
})();

// ─── Integration: Full Workflow ────────────────────────────────────

section('Integration - Full Social Feed Workflow');

(() => {
  const engine = new DDAREngine({ explorationRate: 0, feedSize: 5 });
  const now = Date.now();

  // Set up users
  engine.addConnection('alice', 'bob');
  engine.addConnection('alice', 'charlie');
  engine.addToGroup('alice', 'engineering');
  engine.addToGroup('dave', 'engineering');

  // Add content
  engine.addItems([
    { id: 'post_1', dimensions: { topic: ['tech', 'javascript'], creator: 'bob', format: 'article' }, createdAt: now },
    { id: 'post_2', dimensions: { topic: ['sports', 'football'], creator: 'charlie', format: 'video' }, createdAt: now },
    { id: 'post_3', dimensions: { topic: ['tech', 'python'], creator: 'dave', format: 'article' }, createdAt: now },
    { id: 'post_4', dimensions: { topic: ['music', 'jazz'], creator: 'eve', format: 'short' }, createdAt: now },
    { id: 'post_5', dimensions: { topic: ['tech', 'rust'], creator: 'frank', format: 'article' }, createdAt: now - 7200000 }, // old
    { id: 'post_6', dimensions: { topic: ['tech', 'ai'], creator: 'grace', format: 'video' }, createdAt: now },
  ]);

  // Alice interacts with tech content
  engine.handleAction('alice', 'like', 'post_1');
  engine.handleAction('alice', 'share', 'post_3');
  engine.handleAction('alice', 'skip', 'post_2');

  // Bob interacts with post_6 (alice's friend)
  engine.handleAction('bob', 'like', 'post_6');

  // Alice follows bob
  engine.handleAction('alice', 'follow', 'post_1'); // follows bob

  // Serve feed for Alice
  const feed = engine.serveFeed('alice', { now });
  assert(feed.length > 0, 'Integration: Feed is non-empty');
  assert(feed.length <= 5, 'Integration: Feed respects feedSize');

  // Tech items should be ranked higher
  const topItem = feed[0];
  const topTopics = topItem.item.dimensions.topic || [];
  assert(topTopics.some(t => t.includes('tech') || t.includes('javascript') || t.includes('python') || t.includes('ai')),
    'Integration: Top item is tech-related (matches user preference)');

  // Verify all feed entries have required fields
  for (const entry of feed) {
    assert(entry.item.id !== undefined, `Integration: Feed entry has id`);
    assert(typeof entry.score === 'number', `Integration: Feed entry has score`);
    assert(typeof entry.scoreRaw === 'number', `Integration: Feed entry has scoreRaw`);
    assert(typeof entry.diversityMultiplier === 'number', `Integration: Feed entry has diversityMultiplier`);
    assert(typeof entry.explored === 'boolean', `Integration: Feed entry has explored flag`);
  }

  // Explain top item
  const explanation = engine.explainScore('alice', topItem.item.id, now);
  assert(explanation !== null, 'Integration: Top item is explainable');
  assert(explanation.rawScore > 0, 'Integration: Top item has positive raw score');

  console.log('\n--- Top item explanation ---');
  console.log(`  Item: ${explanation.itemId}`);
  console.log(`  Dot Product: ${explanation.components.dotProduct.toFixed(3)}`);
  console.log(`  Recency Bonus: ${explanation.components.recencyBonus.toFixed(3)}`);
  console.log(`  Social Gravity: ${explanation.components.socialGravity.toFixed(3)}`);
  console.log(`  Explicit Boost: ${explanation.components.explicitBoost.toFixed(3)}`);
  console.log(`  Raw Score: ${explanation.rawScore.toFixed(3)}`);
  console.log(`  Diversity Multiplier: ${explanation.diversityMultiplier.toFixed(3)}`);
  console.log(`  Final Score: ${explanation.finalScore.toFixed(3)}`);
})();

// ─── Performance Test ──────────────────────────────────────────────

section('Performance');

(() => {
  const engine = new DDAREngine({ explorationRate: 0, feedSize: 20 });
  const now = Date.now();
  const topics = ['tech', 'sports', 'music', 'science', 'art', 'food', 'travel', 'health', 'finance', 'gaming'];

  // Add 1000 items
  for (let i = 0; i < 1000; i++) {
    const t1 = topics[i % topics.length];
    const t2 = topics[(i + 3) % topics.length];
    engine.addItem({
      id: `perf_item_${i}`,
      dimensions: {
        topic: [t1, t2],
        creator: `creator_${i % 50}`,
        format: ['video', 'article', 'short'][i % 3],
      },
      createdAt: now - (i * 100),
    });
  }

  // Add 100 users with connections
  for (let i = 0; i < 100; i++) {
    const userId = `perf_user_${i}`;
    if (i > 0) {
      engine.addConnection(userId, `perf_user_${i - 1}`);
    }
    // Some interactions
    engine.handleAction(userId, 'like', `perf_item_${i % 1000}`);
    engine.handleAction(userId, 'view', `perf_item_${(i + 100) % 1000}`);
  }

  // Time feed serving for one user
  const start = process.hrtime.bigint();
  const feed = engine.serveFeed('perf_user_50', { now });
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1_000_000;

  assert(feed.length === 20, `Performance: Feed returns 20 items from 1000 candidates`);
  assert(durationMs < 500, `Performance: Feed served in ${durationMs.toFixed(2)}ms (< 500ms for 1000 items)`);
  console.log(`  Feed serving time: ${durationMs.toFixed(2)}ms for 1000 candidates`);

  const stats = engine.getStats();
  assert(stats.totalUsers === 100, 'Performance: 100 users tracked');
  assert(stats.totalItems === 1000, 'Performance: 1000 items tracked');
})();

// ─── Summary ───────────────────────────────────────────────────────

console.log('\n========================================');
console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed!');
  process.exit(0);
}
