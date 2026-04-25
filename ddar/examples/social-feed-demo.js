#!/usr/bin/env node
'use strict';

/**
 * DDAR Engine - Full Production-Ready Example
 *
 * This example simulates a real social media / activity feed platform with:
 * - Multiple users with social connections and group memberships
 * - Diverse content (articles, videos, shorts) across multiple topics
 * - User interactions (likes, shares, skips, follows, mutes)
 * - Real-time feed serving with diversity constraints
 * - Score explainability for every recommendation
 *
 * Run: node examples/social-feed-demo.js
 * Or after npm install: node node_modules/ddar-engine/examples/social-feed-demo.js
 */

// If running from within the package, use relative import.
// If running after npm install, use 'ddar-engine'.
let DDAREngine;
try {
  ({ DDAREngine } = require('ddar-engine'));
} catch (e) {
  ({ DDAREngine } = require('../index'));
}

// ─── Helper ────────────────────────────────────────────────────────

function log(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function printFeed(feed, label) {
  console.log(`\n--- ${label} (${feed.length} items) ---`);
  feed.forEach((entry, i) => {
    const topics = (entry.item.dimensions.topic || []).join(', ');
    const creator = (entry.item.dimensions.creator || ['unknown'])[0];
    const format = (entry.item.dimensions.format || ['?'])[0];
    const explored = entry.explored ? ' [EXPLORED]' : '';
    console.log(
      `  #${i + 1} | ${entry.item.id.padEnd(25)} | score: ${entry.score.toFixed(2).padStart(7)} | ` +
      `topics: [${topics.padEnd(20)}] | by: ${creator.padEnd(12)} | ${format}${explored}`
    );
  });
}

// ─── 1. Initialize Engine ──────────────────────────────────────────

log('1. Initialize DDAR Engine');

const engine = new DDAREngine({
  feedSize: 10,           // Return top 10 items per feed
  explorationRate: 0.0,   // Disable random exploration for deterministic demo
  historySize: 50,        // Track last 50 served items for diversity
  entropyThreshold: 0.1,  // Diversity threshold
  diversityPenalty: 0.3,  // 30% penalty for low-diversity items
  recencyWindowSeconds: 3600, // 1-hour recency window
});

console.log('Engine initialized with custom config.');
console.log('Stats:', engine.getStats());

// ─── 2. Add Content Items ─────────────────────────────────────────

log('2. Add Content Items (simulating a content pool)');

const now = Date.now();

const contentItems = [
  // Tech content
  { id: 'article-js-frameworks',    dimensions: { topic: ['tech', 'javascript'],  creator: 'dev_sarah',    format: 'article',  language: 'en' }, createdAt: now - 60000 },
  { id: 'video-react-hooks',        dimensions: { topic: ['tech', 'javascript'],  creator: 'dev_sarah',    format: 'video',    language: 'en' }, createdAt: now - 120000 },
  { id: 'article-rust-intro',       dimensions: { topic: ['tech', 'rust'],        creator: 'dev_mike',     format: 'article',  language: 'en' }, createdAt: now - 180000 },
  { id: 'short-python-tips',        dimensions: { topic: ['tech', 'python'],      creator: 'dev_lisa',     format: 'short',    language: 'en' }, createdAt: now - 30000 },
  { id: 'article-ai-future',        dimensions: { topic: ['tech', 'ai'],          creator: 'ai_weekly',    format: 'article',  language: 'en' }, createdAt: now - 90000 },
  { id: 'video-ml-tutorial',        dimensions: { topic: ['tech', 'ai'],          creator: 'ai_weekly',    format: 'video',    language: 'en' }, createdAt: now - 300000 },

  // Sports content
  { id: 'video-champions-league',   dimensions: { topic: ['sports', 'football'],  creator: 'sports_daily', format: 'video',    language: 'en' }, createdAt: now - 45000 },
  { id: 'article-nba-playoffs',     dimensions: { topic: ['sports', 'basketball'],creator: 'hoops_hub',    format: 'article',  language: 'en' }, createdAt: now - 200000 },
  { id: 'short-tennis-highlights',  dimensions: { topic: ['sports', 'tennis'],    creator: 'sports_daily', format: 'short',    language: 'en' }, createdAt: now - 150000 },

  // Music content
  { id: 'video-jazz-session',       dimensions: { topic: ['music', 'jazz'],       creator: 'music_vibes',  format: 'video',    language: 'en' }, createdAt: now - 100000 },
  { id: 'article-album-review',     dimensions: { topic: ['music', 'indie'],      creator: 'music_vibes',  format: 'article',  language: 'en' }, createdAt: now - 250000 },
  { id: 'short-guitar-riff',        dimensions: { topic: ['music', 'rock'],       creator: 'guitar_hero',  format: 'short',    language: 'en' }, createdAt: now - 50000 },

  // Science content
  { id: 'article-quantum-computing',dimensions: { topic: ['science', 'physics'],  creator: 'sci_today',    format: 'article',  language: 'en' }, createdAt: now - 400000 },
  { id: 'video-space-exploration',  dimensions: { topic: ['science', 'space'],    creator: 'sci_today',    format: 'video',    language: 'en' }, createdAt: now - 350000 },

  // Food & Travel
  { id: 'short-pasta-recipe',       dimensions: { topic: ['food', 'cooking'],     creator: 'chef_anna',    format: 'short',    language: 'en' }, createdAt: now - 70000 },
  { id: 'video-tokyo-travel',       dimensions: { topic: ['travel', 'japan'],     creator: 'wanderlust',   format: 'video',    language: 'en' }, createdAt: now - 500000 },

  // Breaking news (very recent)
  { id: 'breaking-tech-acquisition',dimensions: { topic: ['tech', 'business'],    creator: 'news_wire',    format: 'article',  language: 'en' }, createdAt: now - 5000 },
  { id: 'breaking-sports-transfer', dimensions: { topic: ['sports', 'football'],  creator: 'news_wire',    format: 'article',  language: 'en' }, createdAt: now - 3000 },

  // Spam / low quality (will be muted)
  { id: 'spam-clickbait',           dimensions: { topic: ['tech'],                creator: 'spammer_bot',  format: 'article',  language: 'en' }, createdAt: now - 10000 },
];

engine.addItems(contentItems);
console.log(`Added ${contentItems.length} content items to the pool.`);

// ─── 3. Set Up Social Graph ───────────────────────────────────────

log('3. Set Up Social Graph');

// Users: alice (tech enthusiast), bob (sports fan), charlie (music lover), dave (generalist)
// Connections
engine.addConnection('alice', 'bob');
engine.addConnection('alice', 'charlie');
engine.addConnection('bob', 'dave');
engine.addConnection('charlie', 'dave');

// Groups
engine.addToGroup('alice', 'engineering-team');
engine.addToGroup('bob', 'engineering-team');
engine.addToGroup('charlie', 'music-club');
engine.addToGroup('dave', 'engineering-team');
engine.addToGroup('dave', 'music-club');

console.log('Social connections: alice<->bob, alice<->charlie, bob<->dave, charlie<->dave');
console.log('Groups: alice+bob+dave in engineering-team, charlie+dave in music-club');

// ─── 4. Simulate User Behavior ───────────────────────────────────

log('4. Simulate User Behavior');

// Alice: loves tech, especially JavaScript. Skips sports. Follows dev_sarah. Mutes spammer.
console.log('\nAlice: Tech enthusiast');
engine.handleAction('alice', 'like', 'article-js-frameworks');
engine.handleAction('alice', 'like', 'video-react-hooks');
engine.handleAction('alice', 'share', 'article-ai-future');
engine.handleAction('alice', 'view', 'short-python-tips', { dwellPercent: 85 });
engine.handleAction('alice', 'skip', 'video-champions-league');
engine.handleAction('alice', 'skip', 'article-nba-playoffs');
engine.handleAction('alice', 'follow', 'article-js-frameworks'); // follows dev_sarah
engine.handleAction('alice', 'mute_creator', 'spam-clickbait');  // mutes spammer_bot
console.log('  Actions: liked JS articles, shared AI article, viewed Python tips (85% dwell)');
console.log('  Skipped: sports content. Followed: dev_sarah. Muted: spammer_bot');

// Bob: sports fan with some tech interest
console.log('\nBob: Sports fan');
engine.handleAction('bob', 'like', 'video-champions-league');
engine.handleAction('bob', 'share', 'breaking-sports-transfer');
engine.handleAction('bob', 'like', 'article-nba-playoffs');
engine.handleAction('bob', 'view', 'article-rust-intro', { dwellPercent: 60 });
engine.handleAction('bob', 'skip', 'video-jazz-session');
console.log('  Actions: liked/shared sports content, viewed Rust article (60% dwell)');

// Charlie: music lover
console.log('\nCharlie: Music lover');
engine.handleAction('charlie', 'like', 'video-jazz-session');
engine.handleAction('charlie', 'share', 'short-guitar-riff');
engine.handleAction('charlie', 'like', 'article-album-review');
engine.handleAction('charlie', 'view', 'article-ai-future', { dwellPercent: 90 });
console.log('  Actions: liked/shared music content, viewed AI article (90% dwell)');

// Dave: generalist, interacts with everything
console.log('\nDave: Generalist');
engine.handleAction('dave', 'like', 'article-rust-intro');
engine.handleAction('dave', 'like', 'video-champions-league');
engine.handleAction('dave', 'like', 'video-jazz-session');
engine.handleAction('dave', 'view', 'article-quantum-computing', { dwellPercent: 95 });
engine.handleAction('dave', 'view', 'short-pasta-recipe', { dwellPercent: 80 });
console.log('  Actions: liked content across tech, sports, music. Viewed science & food.');

// ─── 5. Serve Personalized Feeds ─────────────────────────────────

log('5. Serve Personalized Feeds');

const aliceFeed = engine.serveFeed('alice', { now });
printFeed(aliceFeed, "Alice's Feed (tech enthusiast)");

const bobFeed = engine.serveFeed('bob', { now });
printFeed(bobFeed, "Bob's Feed (sports fan)");

const charlieFeed = engine.serveFeed('charlie', { now });
printFeed(charlieFeed, "Charlie's Feed (music lover)");

const daveFeed = engine.serveFeed('dave', { now });
printFeed(daveFeed, "Dave's Feed (generalist)");

// ─── 6. Cold Start - New User ────────────────────────────────────

log('6. Cold Start - Brand New User (no history)');

const newUserFeed = engine.serveFeed('new_user_eve', { now });
printFeed(newUserFeed, "Eve's Feed (brand new user, zero interactions)");
console.log('\nNotice: Even with zero history, DDAR serves a feed based on recency and content tags.');
console.log('No cold-start problem - the algorithm works from the very first request.');

// ─── 7. Score Explainability ─────────────────────────────────────

log('7. Score Explainability (Full Interpretability)');

const topAliceItem = aliceFeed[0];
const explanation = engine.explainScore('alice', topAliceItem.item.id, now);

console.log(`\nExplaining Alice's #1 item: "${explanation.itemId}"`);
console.log(`  Item dimensions: ${JSON.stringify(explanation.itemDimensions)}`);
console.log(`\n  Score breakdown:`);
console.log(`    Dot Product (URV . ARU):  ${explanation.components.dotProduct.toFixed(4)}`);
console.log(`    Recency Bonus:            ${explanation.components.recencyBonus.toFixed(4)}`);
console.log(`    Social Gravity:           ${explanation.components.socialGravity.toFixed(4)}`);
console.log(`    Explicit Boost (follow):  ${explanation.components.explicitBoost.toFixed(4)}`);
console.log(`    ─────────────────────────`);
console.log(`    Raw Score:                ${explanation.rawScore.toFixed(4)}`);
console.log(`    Diversity Multiplier:     ${explanation.diversityMultiplier.toFixed(4)}`);
console.log(`    Final Score:              ${explanation.finalScore.toFixed(4)}`);
console.log(`\n  Per-dimension weights in Alice's URV:`);
for (const [key, weight] of Object.entries(explanation.keyWeights)) {
  if (weight !== 0) {
    console.log(`    ${key.padEnd(25)} = ${weight.toFixed(4)}`);
  }
}

// Also explain a low-scoring item for comparison
const lastAliceItem = aliceFeed[aliceFeed.length - 1];
const lowExplanation = engine.explainScore('alice', lastAliceItem.item.id, now);
console.log(`\nCompare with Alice's lowest item: "${lowExplanation.itemId}"`);
console.log(`    Raw Score: ${lowExplanation.rawScore.toFixed(4)} vs top item: ${explanation.rawScore.toFixed(4)}`);

// ─── 8. Social Gravity Demo ─────────────────────────────────────

log('8. Social Gravity in Action');

console.log('\nBob (Alice\'s friend) shares "breaking-tech-acquisition":');
engine.handleAction('bob', 'share', 'breaking-tech-acquisition');

const aliceFeed2 = engine.serveFeed('alice', { now });
const breakingItem = aliceFeed2.find(e => e.item.id === 'breaking-tech-acquisition');
if (breakingItem) {
  const breakingExpl = engine.explainScore('alice', 'breaking-tech-acquisition', now);
  console.log(`  "breaking-tech-acquisition" now in Alice's feed!`);
  console.log(`  Social Gravity component: ${breakingExpl.components.socialGravity.toFixed(4)}`);
  console.log(`  This boost comes from Bob (friend) interacting with the item.`);
}

// ─── 9. Muted Creator Demo ──────────────────────────────────────

log('9. Creator Muting (Content Filtering)');

const spamInFeed = aliceFeed.find(e => e.item.id === 'spam-clickbait');
console.log(`Spam item "spam-clickbait" in Alice's feed: ${spamInFeed ? 'YES (bug!)' : 'NO (correctly filtered)'}`);
console.log('Alice muted spammer_bot, so all their content is excluded from her feed.');

// ─── 10. User State Inspection ──────────────────────────────────

log('10. User State Inspection');

const aliceWeights = engine.getUserWeights('alice');
const aliceEntropy = engine.getUserEntropy('alice');
const aliceHistory = engine.getUserHistory('alice');

console.log(`\nAlice's resonance vector (non-zero weights):`);
const sortedWeights = Object.entries(aliceWeights)
  .filter(([, v]) => Math.abs(v) > 0.01)
  .sort((a, b) => b[1] - a[1]);

for (const [key, weight] of sortedWeights) {
  const bar = weight > 0 ? '+'.repeat(Math.min(Math.round(weight * 10), 50)) : '-'.repeat(Math.min(Math.round(Math.abs(weight) * 10), 50));
  console.log(`  ${key.padEnd(25)} ${weight > 0 ? '+' : ''}${weight.toFixed(3)} ${bar}`);
}

console.log(`\nAlice's feed diversity (entropy): ${aliceEntropy.toFixed(4)}`);
console.log(`Alice's history length: ${aliceHistory.length} items`);

// ─── 11. Engine Stats ───────────────────────────────────────────

log('11. Engine Stats');

const stats = engine.getStats();
console.log(`Total users:  ${stats.totalUsers}`);
console.log(`Total items:  ${stats.totalItems}`);
console.log(`Feed size:    ${stats.config.feedSize}`);
console.log(`Exploration:  ${(stats.config.explorationRate * 100).toFixed(1)}%`);
console.log(`Decay rate:   ${stats.config.decayRate}/sec`);

// ─── 12. Performance Benchmark ──────────────────────────────────

log('12. Performance Benchmark');

// Add many items for perf test
const topics = ['tech', 'sports', 'music', 'science', 'food', 'travel', 'health', 'finance', 'gaming', 'fashion'];
for (let i = 0; i < 5000; i++) {
  engine.addItem({
    id: `perf_${i}`,
    dimensions: {
      topic: [topics[i % topics.length], topics[(i + 3) % topics.length]],
      creator: `creator_${i % 100}`,
      format: ['video', 'article', 'short'][i % 3],
    },
    createdAt: now - (i * 1000),
  });
}

const iterations = 100;
const start = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
  engine.serveFeed('alice', { now });
}
const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;

console.log(`Served ${iterations} feeds from ${engine.getAllItems().length} items`);
console.log(`Total time:   ${elapsed.toFixed(1)}ms`);
console.log(`Per feed:     ${(elapsed / iterations).toFixed(2)}ms`);
console.log(`Throughput:   ${Math.round(iterations / (elapsed / 1000))} feeds/sec`);

// ─── Done ───────────────────────────────────────────────────────

log('Demo Complete');
console.log('\nThe DDAR engine is production-ready. Key takeaways:');
console.log('  - Zero ML, zero training, zero embeddings');
console.log('  - Sub-millisecond feed serving at scale');
console.log('  - No cold-start problem');
console.log('  - Full score explainability');
console.log('  - Deterministic, auditable, reversible');
console.log('  - Diversity constraints prevent filter bubbles');
console.log('  - Social gravity propagates friend signals in real-time');
console.log('\nInstall: npm install ddar-engine');
console.log('Docs:    https://www.npmjs.com/package/ddar-engine\n');
