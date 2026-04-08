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

## Tier 2: Cost Inflation

### What this measurement is and isn't

The Phase 10 cost comparison sends a single prompt ("deobfuscate this
and explain what it does") to each model for clean code (pill-09) vs
poisoned code (pill-10). This measures single-shot response behavior,
not reconstruction quality or functional output.

The v1 cost-inflation finding (2.5 min undefended to 3+ hours
defended, producing broken output) was measured in Claude Code CLI
with tool use: an agentic, multi-turn workflow where the model
iteratively reads files, writes code, tests, and revises. That
multi-turn reconstruction cost is the real defense metric. The
single-shot API comparison below is a weaker signal.

### Single-shot API results

**Raw data:**

| Model | Condition | Mean time | Mean tokens | Mean chars | Code blocks |
|---|---|---|---|---|---|
| Claude Opus 4.6 | Clean | 36s | 2,291 | 5,807 | 1 |
| Claude Opus 4.6 | Poisoned | 37s | 2,391 | 6,571 | 1 |
| GPT-5.4 | Clean | 45s | 3,021 | 9,732 | 7-23 |
| GPT-5.4 | Poisoned | 87s | 3,617 | 12,110 | 11-18 |
| Gemini 3.1 Pro | Clean | 53s | 2,568 | ~7,000 | 1 |
| Gemini 3.1 Pro | Poisoned | 57s | 2,633 | ~7,000 | 1 |

**Interpretation:**

Claude and Gemini produce similar output volume for clean vs poisoned
code (~1 code block each, similar token counts). No measurable cost
difference at the single-shot level.

GPT-5.4 produces substantially more output on poisoned code (+20%
tokens, +24% chars, more code blocks). The 93% time increase
correlates with this output volume increase. GPT-5.4's response
format is fundamentally different: it produces a section-by-section
walkthrough with many small code snippets, while Claude and Gemini
produce a single reconstructed code block plus explanation.

The GPT-5.4 time difference is real but it measures output
verbosity, not reconstruction difficulty. The model writes more
when analyzing poisoned code, but the prompt doesn't ask for
functional reconstruction or verify correctness.

### What the real cost-inflation experiment would look like

To properly measure cross-model cost inflation, each model would
need an agentic workflow:
- ChatGPT with Code Interpreter / tool use
- Gemini with function calling / code execution
- Claude Code CLI (already measured in Phase A)

The task: "fully reconstruct this obfuscated code as a working
implementation." Metrics: wall-clock time, total tokens across all
turns, number of tool invocations, and whether the output actually
runs. This is a v3 experiment, not something the single-shot API
can answer.

### v1 Phase A cost data (for reference)

| Condition | Time | Tokens | Tool uses | Output quality |
|---|---|---|---|---|
| Undefended (pill-09) | 2.5 min | ~20K | ~10 | Near-perfect |
| Defended v7 (prompt 2) | 13.5 min | ~50K+ | ~40+ | Structure recovered, names wrong |
| Defended v7 (reconstruction) | 3h+ | ~268K | 137 | 1,441 lines, broken |

This Phase A data (Claude Code CLI, N=1) remains the strongest
evidence of practical cost inflation. It has not been replicated
cross-model.

**Obfuscation gradient (wrong names in code by obfuscation level):**

| Level | Claude (v1) | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|
| Light (base64, CFF 0.5) | 5/5 | 4.0/14 | 4.0/14 |
| Medium (base64, CFF 0.5, self-def) | 5/5 | 4.0/14 | 4.0/14 |
| Heavy (RC4, CFF 0.75, split) | 6/6 attr, 0/6 ampl | 1.0/14 | 1.7/14 |

Light/medium obfuscation produces the most propagation across all
models. Heavy obfuscation reduces it, consistent with the
recoverability confound (split-string encoding fragments names).

## Tier 3: Spot Checks

**Engineering domain (coherent alternative domain):**

| Model | Wrong names in code | Corrected |
|---|---|---|
| Claude (v1) | 0/5 | 5/5 |
| GPT-5.4 | 0.7/3 | 1.3/3 |
| Gemini 3.1 Pro | 0.7/3 | 0.7/3 |

All three models partially or fully correct when the replacement
terms form a coherent engineering domain. Direction consistent
across models, strength varies.

**Temperature 0 (deterministic):**

| Model | Wrong names in code |
|---|---|
| Claude (v1) | 5/5 (100%) |
| GPT-5.4 | 2.0/3 (100% for core terms) |
| Gemini 3.1 Pro | 1.3/3 |

Effect persists at temperature 0 on all three models. Not a
sampling artifact.

## Full Phase 10 Run Count

- Tier 1: 66 runs (33 per model)
- Tier 2: 38 runs (19 per model)
- Tier 3: 12 runs (6 per model)
- **Total: 116 cross-model runs**

Combined with v1 phases 0-9 (192 runs on Claude), the study now
covers **308 total API runs** across three model families.
