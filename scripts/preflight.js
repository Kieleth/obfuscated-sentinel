#!/usr/bin/env node
'use strict';

/**
 * Preflight check: runs 1 experiment from each batch config with N=1,
 * verifies scoring works, API connects, output writes, and compares
 * against existing results if available.
 *
 * Usage: node scripts/preflight.js [--output <dir>]
 *
 * Runs the FIRST experiment from each phase config with runs=1.
 * Reports: API ok, scoring ok, output ok, propagation match vs original.
 */

const fs = require('fs');
const path = require('path');

const TESTBED = path.join(__dirname, '..', 'experiments', 'testbed');
const ORIGINAL_RESULTS = path.join(__dirname, '..', 'experiments', 'results');
const OUTPUT = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : path.join(__dirname, '..', 'experiments', 'results-preflight');

const CONFIGS = [
  'phase0-replication.json',
  'phase1-string-trust.json',
  'phase2-streisand.json',
  'phase3-extended.json',
  'phase4-mechanism.json',
  'phase5-nboost.json',
  'phase6-n2-boost.json',
  'phase7-matched-controls.json',
  'phase8-matched-table.json',
  'phase9-second-artifact.json',
];

async function main() {
  const runExperimentModule = require('./run-experiment.js');

  // We can't import runExperiment directly, so we'll shell out
  const { execSync } = require('child_process');

  console.log('=== PREFLIGHT CHECK ===');
  console.log('Output:', OUTPUT);
  console.log('');

  let pass = 0, fail = 0, skip = 0;

  for (const config of CONFIGS) {
    const configPath = path.join(TESTBED, config);
    if (!fs.existsSync(configPath)) {
      console.log(`SKIP: ${config} (not found)`);
      skip++;
      continue;
    }

    const batch = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const firstExp = batch.experiments[0];
    const model = firstExp.model || batch.defaultModel;
    const pillPath = path.resolve(path.dirname(configPath), firstExp.pill);

    if (!fs.existsSync(pillPath)) {
      console.log(`SKIP: ${config} → ${firstExp.id} (pill not found: ${firstExp.pill})`);
      skip++;
      continue;
    }

    const outDir = path.join(OUTPUT, firstExp.id);
    console.log(`TEST: ${config} → ${firstExp.id} (${model}, 1 run)`);

    try {
      const cmd = `node scripts/run-experiment.js --pill "${pillPath}" --prompt "${firstExp.prompt.substring(0, 80)}" --model ${model} --runs 1 --output "${outDir}"`;
      const output = execSync(cmd, {
        cwd: path.join(__dirname, '..'),
        timeout: 120000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Check output file exists
      const files = fs.readdirSync(outDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
      if (files.length === 0) {
        console.log(`  FAIL: no output JSON produced`);
        fail++;
        continue;
      }

      const result = JSON.parse(fs.readFileSync(path.join(outDir, files[0]), 'utf8'));

      // Check scoring worked
      if (!result.score) {
        console.log(`  FAIL: no score in output`);
        fail++;
        continue;
      }

      const persist = result.score.namesPropagated.length + result.score.namesFlagged.length;
      const corrected = result.score.namesCorrected.length;
      const refusal = result.score.refusal;

      // Compare against original if available
      const origPhase = config.replace(/-.*/, '');
      const origDir = path.join(ORIGINAL_RESULTS, origPhase, firstExp.id || batch.experiments[0].id);
      let comparison = '';
      if (fs.existsSync(origDir)) {
        const origFiles = fs.readdirSync(origDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
        if (origFiles.length > 0) {
          const origResult = JSON.parse(fs.readFileSync(path.join(origDir, origFiles[0]), 'utf8'));
          const origPersist = (origResult.score?.namesPropagated?.length || 0) + (origResult.score?.namesFlagged?.length || 0);
          const origRefusal = origResult.score?.refusal;
          const propMatch = persist === origPersist ? 'MATCH' : `DIFF (was ${origPersist})`;
          const refMatch = refusal === origRefusal ? 'match' : `DIFF (was ${origRefusal})`;
          comparison = ` | vs original: propagation ${propMatch}, refusal ${refMatch}`;
        }
      }

      console.log(`  OK: wrong=${persist} corr=${corrected} refusal=${refusal} time=${result.elapsed.toFixed(1)}s tokens=${result.outputTokens}${comparison}`);
      pass++;

    } catch (err) {
      console.log(`  FAIL: ${err.message.substring(0, 100)}`);
      fail++;
    }
  }

  console.log('');
  console.log(`=== PREFLIGHT COMPLETE: ${pass} pass, ${fail} fail, ${skip} skip ===`);

  if (fail > 0) {
    console.log('FIX FAILURES BEFORE FULL RUN.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
