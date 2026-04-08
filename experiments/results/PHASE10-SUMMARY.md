# Phase 10: Cross-Model Replication (Tier 1)

**Date:** 2026-04-07
**Models:** GPT-5.4 (OpenAI), Gemini 3.1 Pro Preview (Google)
**Total runs:** 66 (33 per model)
**Purpose:** Test whether core findings replicate across model families.

## Cross-Model Comparison: Physics Artifact

| Condition | Claude Opus 4.6 (v1) | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|
| **Baseline (deobfuscate)** | FLAG 5/5 | FLAG+PROP 4/5 | FLAG 3/5, partial correction |
| **Adversarial warning** | FLAG 3/3 | FLAG+PROP 3/3 | FLAG 2/3 |
| **Generation frame** | CORR 4-5/5 | Mixed: PROP 1/5, CORR 1/5 | FLAG 4/5 (!) |
| **No-fit control (combustion)** | FLAG 5/5 | FLAG 1/5, CORR rest | FLAG 3/5, CORR rest |

## Cross-Model Comparison: Pathfinding Artifact

| Condition | Claude Opus 4.6 (v1) | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|
| **Baseline (deobfuscate)** | FLAG 5/5 | FLAG 4/4 (1 missing) | FLAG 5/5 |
| **Generation frame** | CORR 5/5 | CORR 3/5, FLAG 2/5 | FLAG 5/5 (penalty persists!) |
| **No-fit control (invoice)** | FLAG 5/5 | FLAG 3/5, CORR 2/5 | FLAG 5/5 |

## Key Findings

### 1. Baseline persistence replicates across all three model families.

Wrong decoded names appear in code on GPT-5.4 and Gemini 3.1 Pro,
the same as on Claude Opus 4.6. The dual-representation pattern
(wrong name in code, correct description in comments) appears on
all three models. This is no longer a Claude-specific observation.

### 2. The framing effect is model-dependent.

On Claude: generation frame corrects names 4-5/5.
On GPT-5.4: generation frame partially corrects (3/5 on pathfinding,
mixed on physics).
On Gemini 3.1 Pro: generation frame does NOT correct on either
artifact. `penalty` persists 5/5 even under "write from scratch."

This is the most important cross-model finding. The framing
manipulation that was the paper's strongest result on Claude does
not generalize cleanly. Gemini 3.1 Pro preserves poisoned names
even under the generation frame.

### 3. Verification resistance replicates.

Adversarial warnings had no effect on GPT-5.4 (3/3 persistence)
or Gemini 3.1 Pro (2/3 persistence). Consistent with Claude (3/3).

### 4. Matched-control pattern is partially model-dependent.

On Claude: no-fit terms persist 5/5 on both artifacts.
On GPT-5.4: no-fit terms persist on pathfinding (3/5) but mostly
corrected on physics (1/5).
On Gemini 3.1 Pro: no-fit terms persist on pathfinding (5/5),
partially on physics (3/5).

### 5. GPT-5.4 triggers false refusal detection.

GPT-5.4 frequently uses words like "malicious" in its analysis
prose, triggering the keyword-based refusal detector. Actual
refusal rate is near zero. The refusal numbers in the automated
summary should be manually verified.

## What This Means for v2

The headline changes:
- **Persistence**: generalizes across three model families. Strengthen claim.
- **Framing effect**: Claude-specific, not general. Must qualify heavily.
  Gemini 3.1 Pro resists the generation frame entirely.
- **Verification resistance**: generalizes. Strengthen claim.
- **Matched controls**: partially model-dependent. Qualify.

The paper's v1 framing ("task framing changed naming accuracy where
explicit instructions did not") is the finding most damaged by
cross-model testing. It remains true for Claude, but Gemini 3.1 Pro
shows that the persistence can survive even the generation frame.
This is arguably a more alarming finding: on some models, there is
no simple prompt-based mitigation.
