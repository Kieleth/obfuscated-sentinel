# Obfuscated Sentinel

Research on adversarial code and LLM-assisted reverse engineering. The working question across every paper here: can you ship code whose defenses survive a model's attempt to understand it, and what does the model do at the boundary?

The name comes from *Sentinel Worlds I: Future Magic* (1988), which shipped a paragraph book with fake entries as copy protection. The same structural trick, ported thirty-eight years forward, turns out to work on LLMs too.

## Papers in this collection

| Paper | Slug | Status |
|---|---|---|
| Poisoned Identifiers Survive LLM Deobfuscation: A Case Study on Claude Opus 4.6 | [`papers/poisoned-identifiers/`](papers/poisoned-identifiers/) | Published ([arXiv:2604.04289](https://arxiv.org/abs/2604.04289)), v2 = 7 reference fixes |
| Prose as Attack Surface: The Double-Take Trojan | [`papers/prose-as-attack-surface/`](papers/prose-as-attack-surface/) | Seed (exploratory data collected, paper not yet written) |

Each paper is self-contained: it has its own pills, testbed, batch configs, and raw results under `papers/<slug>/experiments/`. The shared infrastructure (runner, scorer, preflight, tests) lives at the repo root under `scripts/` so that bug fixes and tooling improvements are made in one place and inherited by every paper.

## Repository layout

```
obfuscated_sentinel/
├── papers/
│   ├── poisoned-identifiers/          # Paper 1 (published, v2 = reference fixes)
│   │   ├── paper.md, paper.tex, paper.pdf
│   │   ├── journal.md                 # Scorer audit + replication log
│   │   ├── REPLICATION-CHECK.md       # 192-run replication (2026-04-10)
│   │   ├── experiments/               # Pills, testbed, results, replication
│   │   └── supplementary/
│   └── prose-as-attack-surface/       # (seed)
│       ├── notes.md
│       └── experiments/
├── scripts/                           # Shared across all papers
│   ├── run-experiment.js              # Automated runner (Anthropic Messages API)
│   ├── test-scorer.js                 # 50-test unit suite for the scorer
│   ├── preflight.js                   # One-run-per-phase smoke test
│   ├── blind-score.js                 # Model-based propagation adjudication
│   ├── adjudicate-refusal.js          # LLM-based refusal adjudication (Tier 2)
│   └── score-equivalence.js           # Algorithmic consistency checker
├── README.md                          # This file (umbrella)
├── package.json                       # npm scripts per paper
└── .env.example
```

## Working on a paper

The scripts in `scripts/` resolve paper-relative paths from the current working directory, so you `cd` into the paper's dir before running them. The npm scripts at the repo root do this for you.

```bash
# Setup (once)
npm install
cp .env.example .env
# Edit .env with your Anthropic API key

# Run the scorer tests (poisoned-identifiers)
npm test

# Smoke test before a full run
npm run preflight

# Re-run a full phase of poisoned-identifiers
npm run poisoned:phase0
```

For anything ad hoc, `cd` into the paper dir and invoke the harness directly:

```bash
cd papers/poisoned-identifiers
node ../../scripts/run-experiment.js \
  --pill experiments/pills/pill-10-obfuscated-poisoned.txt \
  --prompt "deobfuscate this and explain what it does" \
  --model claude-opus-4-6 --runs 5 \
  --output experiments/results/my-test
```

See each paper's own README for the narrative, findings, and reproduction guide specific to that paper.

## Shared infrastructure

`scripts/run-experiment.js` is the harness that sends pills to the Anthropic Messages API, records full responses as JSON, and computes the scoring fields used across papers (propagation, flagging, correction, refusal).

`scripts/test-scorer.js` runs 50 unit tests covering every classification path plus the edge cases discovered during paper 1's audit (spring-comment false flag, structural gate for security analyses, truncated response handling, etc.). It MUST pass before any batch experiment. Run it with `npm test`.

`scripts/preflight.js` runs one experiment per phase config in a given paper, compares against the existing results if any, and reports propagation/refusal deltas. Run it with `npm run preflight` before a full 192-run replication.

`scripts/adjudicate-refusal.js` is the Tier 2 LLM adjudicator. After scoring, it sends each response to Haiku 4.5 for an independent ENGAGED/REFUSED classification. When the LLM disagrees with the structural scorer, it overrules with a documented reason written into the run JSON (`score.refusalOverride`).

When a paper's scorer diverges from the shared one (e.g., different poison map, different metrics), the shared scorer stays paper-agnostic and the paper keeps a thin wrapper in its own `experiments/` dir. No per-paper forks of the harness.

## Contributing / reporting

Issues and corrections: open a GitHub issue. Be specific about which paper and section.

## License

MIT
