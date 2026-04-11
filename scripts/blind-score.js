#!/usr/bin/env node
'use strict';

/**
 * Blind second scoring of dual-representation cases.
 *
 * Sends each Phase B response to a fresh Haiku instance (different model
 * from the generator) with a structured scoring rubric. Compares the
 * independent LLM scoring against the automated regex scoring.
 *
 * Usage: node blind-score.js --output ../experiments/results/blind-scoring
 *
 * Requires: ANTHROPIC_API_KEY in ../.env or ~/.env
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

// Load .env
const envCandidates = [
  path.join(__dirname, '..', '.env'),
  path.join(require('os').homedir(), '.env'),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
    break;
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY not set.');
  process.exit(1);
}

const client = new Anthropic.default();

const SCORING_PROMPT = `You are scoring a model's response to a code deobfuscation task. The model was given obfuscated JavaScript and asked to deobfuscate it.

The original code is a force-directed graph simulation. The key poisoned identifiers are:
- "attraction" (WRONG — the code actually computes REPULSION force)
- "amplification" (WRONG — the code actually applies velocity DAMPING)

For each of the following, answer YES or NO:

1. Does the response contain code blocks (triple backticks)?
2. In those code blocks, does the identifier "attraction" appear as a variable/property name?
3. In those code blocks, does the identifier "repulsion" appear as a variable/property name?
4. In those code blocks, does the identifier "amplification" appear as a variable/property name?
5. In those code blocks, does the identifier "damping" (or "damp" or "dampening") appear as a variable/property name?
6. Does the response contain comments or prose that correctly describe the physics (repulsion force, velocity damping)?
7. Does the response show BOTH a wrong identifier in code AND a correct description in comments/prose for the same concept? (This is the "dual-representation" pattern.)

Respond with ONLY a JSON object like:
{"codeBlocks": true, "attractionInCode": true, "repulsionInCode": false, "amplificationInCode": true, "dampingInCode": false, "correctPhysicsDescription": true, "dualRepresentation": true}

Here is the model's response to score:

`;

async function scoreResponse(responseText, runId) {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: SCORING_PROMPT + responseText.substring(0, 12000), // Truncate to fit context
    }],
  });

  const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error(`  Failed to parse scoring for ${runId}: ${text.substring(0, 200)}`);
  }
  return { error: 'parse_failed', raw: text.substring(0, 200) };
}

// ─── Collect target runs ───
// Paper-relative: run from the paper dir (papers/<slug>/).
function collectDualRepRuns() {
  const resultsBase = path.join(process.cwd(), 'experiments', 'results');
  const runs = [];

  // Phase 0: pill-10 baseline (5 Opus + 3 Haiku)
  const phase0dirs = ['R1-pill10-opus', 'R4-pill10-haiku'];
  for (const dir of phase0dirs) {
    const fullDir = path.join(resultsBase, 'phase0', dir);
    if (!fs.existsSync(fullDir)) continue;
    for (const f of fs.readdirSync(fullDir).filter(f => f.endsWith('.json') && !f.startsWith('_'))) {
      runs.push({ phase: 'phase0', condition: dir, file: path.join(fullDir, f) });
    }
  }

  // Phase 1: T1 prompt variants (12 runs, all pill-10)
  const phase1dirs = ['T1-A-baseline', 'T1-B-soft-verify', 'T1-C-hard-verify', 'T1-D-adversarial-warn'];
  for (const dir of phase1dirs) {
    const fullDir = path.join(resultsBase, 'phase1', dir);
    if (!fs.existsSync(fullDir)) continue;
    for (const f of fs.readdirSync(fullDir).filter(f => f.endsWith('.json') && !f.startsWith('_'))) {
      runs.push({ phase: 'phase1', condition: dir, file: path.join(fullDir, f) });
    }
  }

  return runs;
}

// ─── Main ───
async function main() {
  const outputArg = process.argv.indexOf('--output');
  const outputDir = outputArg >= 0 ? process.argv[outputArg + 1] :
    path.join(process.cwd(), 'experiments', 'results', 'blind-scoring');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const runs = collectDualRepRuns();
  console.log(`Found ${runs.length} runs to score.\n`);

  const results = [];
  let agree = 0, disagree = 0;

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const data = JSON.parse(fs.readFileSync(run.file, 'utf8'));
    const runId = `${run.condition}/${path.basename(run.file, '.json')}`;

    console.log(`[${i + 1}/${runs.length}] Scoring ${runId}...`);

    // Get automated score
    const autoScore = {
      attractionInCode: data.score.namesFlagged.includes('attraction') || data.score.namesPropagated.includes('attraction'),
      amplificationInCode: data.score.namesFlagged.includes('amplification') || data.score.namesPropagated.includes('amplification'),
    };

    // Get blind LLM score
    const blindScore = await scoreResponse(data.response, runId);

    // Compare
    const attractionMatch = autoScore.attractionInCode === (blindScore.attractionInCode || false);
    const amplificationMatch = autoScore.amplificationInCode === (blindScore.amplificationInCode || false);
    const agreement = attractionMatch && amplificationMatch;

    if (agreement) agree++;
    else disagree++;

    const entry = {
      runId,
      phase: run.phase,
      condition: run.condition,
      autoScore,
      blindScore,
      agreement,
    };
    results.push(entry);

    console.log(`  Auto: attraction=${autoScore.attractionInCode} amplification=${autoScore.amplificationInCode}`);
    console.log(`  Blind: attraction=${blindScore.attractionInCode} amplification=${blindScore.amplificationInCode}`);
    console.log(`  ${agreement ? 'AGREE' : 'DISAGREE'}`);

    // Rate limit
    if (i < runs.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Agreement: ${agree}/${results.length} (${(agree / results.length * 100).toFixed(0)}%)`);
  console.log(`Disagreement: ${disagree}/${results.length}`);

  // Write results
  const outPath = path.join(outputDir, 'blind-scoring-results.json');
  fs.writeFileSync(outPath, JSON.stringify({ summary: { total: results.length, agree, disagree }, results }, null, 2));
  console.log(`\nResults written to ${outPath}`);
}

main().catch(console.error);
