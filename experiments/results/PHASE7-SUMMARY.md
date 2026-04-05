# Phase 7: Matched Lexical Controls + Semantic Equivalence + Blind Scoring

**Date:** 2026-04-04
**Total new runs:** 10 (matched controls) + 20 (blind scoring via Haiku)
**Purpose:** Address three reviewer concerns: (1) verify generation-frame
outputs preserve algorithm semantics, (2) independent scoring validation,
(3) isolate semantic fit from string length/tokenization.

## Experiment 1: Semantic Equivalence Check

**Question:** Does the generation frame ("write fresh from scratch")
preserve the original algorithm, or does it drift semantically while
happening to produce correct names?

**Method:** Automated comparison of 5 generation-frame and 5 translation-
frame Phase 4 outputs against ground-truth physics operations.

**Checks:** inverse-square repulsion formula, Hooke's law spring formula,
velocity damping operation, center gravity, 4 key parameter values
(4000, 0.004, 0.92, 0.0003), node count, edge count.

**Results:**

| Frame | Params preserved | Formulas preserved | Correct names | Wrong names |
|---|---|---|---|---|
| Generation ("write fresh") | 5/5 all 4 | 5/5 all 4 | 4/5 | 1/5 |
| Translation ("deobfuscate") | 5/5 all 4 | 5/5 (3-4 per run) | 0/5 | 5/5 |

**Finding:** The generation frame preserves exact parameter values and
all four physics formulas while producing correct names. The algorithm
is semantically identical across frames. Name correction is NOT a side
effect of looser fidelity — the model implements the same physics either
way.

Script: `scripts/score-equivalence.js`
Results: `experiments/results/phase4/_equivalence_check.json`

## Experiment 2: Blind Second Scoring

**Question:** Does the automated regex-based scoring agree with an
independent LLM scorer on the presence of `attraction` and
`amplification` in code blocks?

**Method:** 20 Phase B responses (5 Phase 0 Opus, 3 Phase 0 Haiku,
12 Phase 1 prompt variants) scored by Haiku 4.5 with a structured
rubric. Compared against the automated regex scoring.

**Results:**

| | Agreement | Disagreement |
|---|---|---|
| Count | 17 | 3 |
| Rate | 85% | 15% |

All 3 disagreements are in the same direction: the blind scorer
detected `attraction` in code blocks where the regex scorer did not
(auto score: attractionInCode=false, blind: attractionInCode=true).

**Finding:** The automated scoring is conservative — it undercounts
propagation rather than inflating it. No cases where the automation
found propagation that the independent scorer rejected.

Script: `scripts/blind-score.js`
Results: `experiments/results/blind-scoring/blind-scoring-results.json`

## Experiment 3: Matched Lexical Controls

**Question:** Does propagation depend on semantic fit to the code
operation, or on string properties (length, tokenization)?

**Method:** Two new obfuscated pills with length-matched terms:

| Pill | Term for repulsion (10 chars) | Term for damping (13 chars) | Semantic fit |
|---|---|---|---|
| pill-10 (original) | `attraction` | `amplification` | HIGH |
| pill-25 (no-fit) | `combustion` | `communication` | NONE |
| pill-26 (med-fit) | `deflection` | `approximation` | MEDIUM |

All pills use identical obfuscation settings (base64 + CFF 0.5).
N=5 per condition.

**Results:**

| Condition | Term 1 status | Term 2 status |
|---|---|---|
| attraction / amplification | FLAGGED 5/5 | FLAGGED 5/5 |
| combustion / communication | FLAGGED 5/5 | FLAGGED 5/5 |
| deflection / approximation | FLAGGED 4/5, PROP 1/5 | FLAGGED 4/5, PROP 1/5 |

FLAGGED = both wrong and correct names in code (dual-representation).
PROPAGATED = wrong name only, correct name absent.

**Unexpected finding:** `combustion` (NO semantic fit to repulsion)
persists just as readily as `attraction` (HIGH fit). Both appear in
code alongside the correct names in 5/5 runs.

**Critical confound:** The matched control pills change only the 2
key terms while leaving the other 12 poisoned names unchanged
(frictionCoeff, dispersal, etc. — all physics-adjacent). The domain
pills (pill-20-*) that showed 0% propagation for `inductance` and
`perfusion` replaced ALL 14 terms with domain-specific alternatives.

This suggests the gradient observed in Section 6 may be partly driven
by the coherence of the overall domain signal (all terms from one
domain vs mixed), not purely per-term semantic fit. When 2 names are
wrong in an otherwise physics-consistent string table, even
semantically unfitting names persist. When all names are from a
different domain, the model detects the wholesale mismatch.

**Implication:** The semantic-fit gradient finding needs a significant
caveat. The per-term isolation is confounded with per-table domain
consistency. A clean test would require pills where ALL terms are
length-matched but vary individually in semantic fit.

Source files:
- `experiments/testbed/graph-matched-nofit.js`
- `experiments/testbed/graph-matched-medfit.js`
- `experiments/pills/pill-25-matched-nofit.txt`
- `experiments/pills/pill-26-matched-medfit.txt`
- `experiments/testbed/phase7-matched-controls.json`
