/**
 * DDAR Engine - CodeSandbox Quick Start
 *
 * To test on CodeSandbox:
 * 1. Go to https://codesandbox.io/s/new
 * 2. Select "Node.js" template
 * 3. In the terminal, run: npm install ddar-engine
 * 4. Replace index.js with this file's contents
 * 5. Click "Run" or type: node index.js
 *
 * Or use this direct link (after creating):
 * https://codesandbox.io/p/sandbox/node-js
 */

let DDAREngine;
try {
  ({ DDAREngine } = require('ddar-engine'));
} catch (e) {
  ({ DDAREngine } = require('../index'));
}

// ─── Step 1: Create the engine ─────────────────────────────────

const engine = new DDAREngine({
  feedSize: 5,
  explorationRate: 0,  // 0 for deterministic results in demo
});

console.log('DDAR Engine created!\n');

// ─── Step 2: Add content ───────────────────────────────────────

const posts = [
  { id: 'post-1', dimensions: { topic: ['tech', 'react'],    creator: 'alice', format: 'article' } },
  { id: 'post-2', dimensions: { topic: ['tech', 'node'],     creator: 'bob',   format: 'video'   } },
  { id: 'post-3', dimensions: { topic: ['sports', 'soccer'], creator: 'carol', format: 'video'   } },
  { id: 'post-4', dimensions: { topic: ['music', 'jazz'],    creator: 'dave',  format: 'article' } },
  { id: 'post-5', dimensions: { topic: ['tech', 'python'],   creator: 'eve',   format: 'short'   } },
  { id: 'post-6', dimensions: { topic: ['food', 'recipes'],  creator: 'frank', format: 'video'   } },
  { id: 'post-7', dimensions: { topic: ['tech', 'ai'],       creator: 'grace', format: 'article' } },
];

engine.addItems(posts);
console.log(`Added ${posts.length} posts\n`);

// ─── Step 3: Simulate user actions ─────────────────────────────

// User "john" likes tech content
engine.handleAction('john', 'like', 'post-1');   // liked React article
engine.handleAction('john', 'share', 'post-7');  // shared AI article
engine.handleAction('john', 'skip', 'post-3');   // skipped soccer

console.log('John liked React, shared AI article, skipped soccer\n');

// ─── Step 4: Get personalized feed ─────────────────────────────

const feed = engine.serveFeed('john');

console.log("John's personalized feed:");
console.log('─'.repeat(70));

feed.forEach((entry, i) => {
  const topics = entry.item.dimensions.topic.join(', ');
  console.log(
    `  #${i + 1} | ${entry.item.id.padEnd(10)} | score: ${entry.score.toFixed(2).padStart(6)} | topics: ${topics}`
  );
});

// ─── Step 5: Explain a score ───────────────────────────────────

console.log('\n─'.repeat(70));
console.log('\nWhy is #1 ranked first?');
const why = engine.explainScore('john', feed[0].item.id);
console.log(`  Dot Product:     ${why.components.dotProduct.toFixed(3)} (how well item matches preferences)`);
console.log(`  Recency Bonus:   ${why.components.recencyBonus.toFixed(3)} (newer = higher)`);
console.log(`  Social Gravity:  ${why.components.socialGravity.toFixed(3)} (friends' interactions)`);
console.log(`  Explicit Boost:  ${why.components.explicitBoost.toFixed(3)} (followed creators)`);
console.log(`  Final Score:     ${why.finalScore.toFixed(3)}`);

// ─── Step 6: New user (cold start) ─────────────────────────────

console.log('\n─'.repeat(70));
console.log('\nBrand new user "sarah" (zero history):');
const sarahFeed = engine.serveFeed('sarah');
sarahFeed.forEach((entry, i) => {
  console.log(
    `  #${i + 1} | ${entry.item.id.padEnd(10)} | score: ${entry.score.toFixed(2).padStart(6)}`
  );
});
console.log('(Sorted by recency - no cold start problem!)\n');
