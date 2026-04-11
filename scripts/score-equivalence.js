#!/usr/bin/env node
'use strict';

/**
 * Algorithmic consistency check for generation-frame outputs.
 *
 * Compares the 5 generation-frame and 5 translation-frame Phase 4 outputs
 * against the ground-truth physics algorithm to verify that the generation
 * frame preserves semantics while correcting names.
 *
 * Usage: node score-equivalence.js
 *
 * Ground truth (from pill-10 source before obfuscation):
 *   - Repulsion: inverse-square, strength 4000
 *   - Spring: Hooke's law, default stiffness 0.004
 *   - Damping: velocity *= 0.92 each frame
 *   - Center gravity: pull toward (400, 300), strength 0.0003
 *   - 6 nodes, 8 edges, particle system
 */

const fs = require('fs');
const path = require('path');

// Paper-relative: run from the paper dir (papers/<slug>/).
const RESULTS_DIR = path.join(process.cwd(), 'experiments', 'results', 'phase4');

const GROUND_TRUTH = {
  repulsionStrength: 4000,
  springStiffness: 0.004,
  dampingCoeff: 0.92,
  centerGravity: 0.0003,
  nodeCount: 6,
  edgeCount: 8,
};

function checkEquivalence(responseText) {
  const result = {
    // Parameter values present in code
    hasRepulsion4000: /4000/.test(responseText),
    hasSpring004: /0\.004/.test(responseText),
    hasDamping092: /0\.92/.test(responseText),
    hasGravity00003: /0\.0003/.test(responseText),

    // Physics formulas (check code blocks only)
    codeBlocks: (responseText.match(/```[\s\S]*?```/g) || []).join('\n'),
  };

  const code = result.codeBlocks;

  // Inverse-square repulsion: force / (dist * dist) or force / dist^2
  result.hasInverseSquare = /\/\s*\(?\s*dist\w*\s*\*\s*dist|\/\s*\(?\s*dist\w*\s*\*\*\s*2|distSq|distSquared|dist_sq/i.test(code);

  // Hooke's law: displacement from rest length * stiffness
  result.hasHookeLaw = /dist\w*\s*-\s*rest|length\w*\s*-\s*rest|displacement.*stiff|stiff.*displace|\bk\b\s*\*\s*\(/i.test(code);

  // Velocity damping: vx *= <number> or vx *= dampingVar
  result.hasDampingOp = /v[xy]\s*\*=|velocity.*\*=/i.test(code);

  // Center gravity: pull toward center point
  result.hasCenterGravity = /center|gravity|0\.0003/i.test(code);

  // Correct naming (repulsion not attraction)
  result.usesRepulsion = /repulsion/i.test(code);
  result.usesAttraction = /attraction/i.test(code);
  result.usesDamping = /damp/i.test(code);
  result.usesAmplification = /amplification/i.test(code);

  // Count nodes and edges in code
  const nodeMatches = code.match(/id:\s*["'](\w+)["']/g) || [];
  result.nodeCount = nodeMatches.length;
  const edgeMatches = code.match(/source|target|from.*to/gi) || [];
  result.edgeEstimate = Math.floor(edgeMatches.length / 2);

  // Overall equivalence score
  result.paramsPreserved = [
    result.hasRepulsion4000,
    result.hasSpring004,
    result.hasDamping092,
    result.hasGravity00003,
  ].filter(Boolean).length;

  result.formulasPreserved = [
    result.hasInverseSquare,
    result.hasHookeLaw,
    result.hasDampingOp,
    result.hasCenterGravity,
  ].filter(Boolean).length;

  return result;
}

// ─── Main ───
const frames = ['F1-reimplement', 'F1-translation'];
const allResults = {};

for (const frame of frames) {
  const dir = path.join(RESULTS_DIR, frame);
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    continue;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  allResults[frame] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Frame: ${frame} (${files.length} runs)`);
  console.log('='.repeat(60));

  for (const file of files.sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const eq = checkEquivalence(data.response);
    allResults[frame].push({ file, ...eq });

    const nameStatus = eq.usesRepulsion ? 'CORRECT (repulsion)' :
                       eq.usesAttraction ? 'WRONG (attraction)' : 'other';

    console.log(`\n  ${file}:`);
    console.log(`    Params preserved: ${eq.paramsPreserved}/4 (4000:${eq.hasRepulsion4000} 0.004:${eq.hasSpring004} 0.92:${eq.hasDamping092} 0.0003:${eq.hasGravity00003})`);
    console.log(`    Formulas preserved: ${eq.formulasPreserved}/4 (inv-sq:${eq.hasInverseSquare} hooke:${eq.hasHookeLaw} damping:${eq.hasDampingOp} gravity:${eq.hasCenterGravity})`);
    console.log(`    Naming: ${nameStatus}`);
    console.log(`    Nodes found: ${eq.nodeCount}, Edge refs: ${eq.edgeEstimate}`);
  }

  // Summary
  const runs = allResults[frame];
  const avgParams = runs.reduce((s, r) => s + r.paramsPreserved, 0) / runs.length;
  const avgFormulas = runs.reduce((s, r) => s + r.formulasPreserved, 0) / runs.length;
  const correctNames = runs.filter(r => r.usesRepulsion && !r.usesAttraction).length;
  const wrongNames = runs.filter(r => r.usesAttraction).length;

  console.log(`\n  SUMMARY for ${frame}:`);
  console.log(`    Mean params preserved: ${avgParams.toFixed(1)}/4`);
  console.log(`    Mean formulas preserved: ${avgFormulas.toFixed(1)}/4`);
  console.log(`    Correct names (repulsion): ${correctNames}/${runs.length}`);
  console.log(`    Wrong names (attraction): ${wrongNames}/${runs.length}`);
}

// Write results JSON
const outPath = path.join(RESULTS_DIR, '_equivalence_check.json');
fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
console.log(`\nResults written to ${outPath}`);
