# Poisoned Identifiers Persist Through LLM Deobfuscation: Cross-Model Evidence and the Limits of Prompt-Based Mitigation

**v3**

**Authors:** Luis Guzman Lorenzo
**Date:** 2026-03-22 through 2026-04-08
**Models tested:** Claude Opus 4.6 (1M context), GPT-5.4, Gemini 3.1 Pro Preview
**Environment:** Claude Code CLI v2.1.86-v2.1.91 (macOS); Anthropic Messages API; OpenAI Chat Completions API; Google Generative AI SDK

---

## Abstract

Poisoned identifier names embedded in obfuscated JavaScript string
tables persist through LLM deobfuscation across three model families.
We tested Claude Opus 4.6, GPT-5.4, and Gemini 3.1 Pro across 318
API runs, 64 conditions, and two code archetypes (a force-directed
graph simulation and an A* pathfinding algorithm). All three models
preserved wrong decoded names at baseline and resisted explicit
verification instructions (18/18 runs across three families).

A task-reframing manipulation ("write from scratch" instead of
"deobfuscate") reduced propagation on Claude but did not transfer
cleanly: GPT-5.4 showed partial reduction, and Gemini preserved
poisoned names even under the generation frame. Pathfinding-domain
poisoning propagated more than physics-domain poisoning across all
models: GPT-5.4 propagated 11.0/11 pathfinding terms at baseline,
Gemini 10.4/11. Artifact structure shaped propagation behavior more
than any per-model or per-term factor.

This paper reports a replicated behavioral observation across three
model families on two code archetypes, with matched controls, a
confound test for structural necessity, and an honest accounting of
what generalizes and what does not.

---

## 1. Introduction

When LLMs deobfuscate JavaScript containing poisoned identifier
names, do the wrong names survive into the output? And if so, does
any prompt-based intervention fix it?

We tested this across three model families. Explicit verification
instructions ("verify each name matches the math") did not prevent
wrong names from appearing in the output on any model: Claude Opus
4.6 (12/12 runs), GPT-5.4 (3/3), Gemini 3.1 Pro (3/3). Reframing
the task as generation ("write a fresh implementation from scratch")
reduced propagation on Claude, partially on GPT-5.4, and not at all
on Gemini for the pathfinding artifact.

Here is what the output looks like:

```
    attraction: 4000,           // Repulsion force strength
    ----------                     -------------------------
          |                                 |
     identifier: WRONG              comment: CORRECT

    amplification: 0.92,        // Velocity damping (friction)
    -------------                   --------------------------
          |                                 |
     identifier: WRONG              comment: CORRECT
```
**Figure 1.** The dual-representation pattern (Phase B, R1 run 1,
Opus 4.6). Wrong identifier in code, correct description in comment.
Observed in 15/17 Phase B runs where the primary endpoint was
positive (at least one poisoned identifier in code blocks). Scored
manually by the first author without blinding; see Section 3.3. This
figure shows Claude output; the pattern was observed on all three
models under automated scoring.

There are two ways to read this. Source recovery: decoded string-
table names are the closest available ground truth, and a well-
calibrated model should use them. Alternatively: the model does not
apply a capability it shows in other settings (name correction on
readable code, Section 4.1), even when explicitly told to.

A pure inability-to-verify account does not explain the data well,
though the data do not isolate the underlying mechanism. The
strongest defensible claim from v1 was: task framing changes naming
behavior without altering the checked algorithmic structure.
Cross-model testing qualifies this: the framing effect is strong on
Claude, partial on GPT-5.4, and absent on Gemini 3.1 Pro for
pathfinding. On Gemini, poisoned names persisted under every tested
prompt condition.

The pathfinding artifact produced near-total propagation on all
models (GPT-5.4: 11.0/11 terms; Gemini: 10.4/11), substantially
more than the physics artifact (1-2/14 terms). A confound test
(Phase 11) confirmed this reflects structural necessity, not scorer
artifacts from swapped variable pairs. Artifact structure, not just
the poisoned names, drives propagation behavior.

We frame the practical implication as cost multiplication, not
protection. Any browser-delivered code is ultimately inspectable
(see Section 8.3).

**Scope.** This is a study on two code archetypes (a JavaScript
force-directed graph simulation and an A* pathfinding algorithm)
tested on three model families. Phase A (exploratory, N=1) used
Claude Code CLI with tool use. Phase B (replicated, N=3-6) used the
Anthropic Messages API without tool use. Phase C (cross-model, N=3-5)
used the OpenAI and Google APIs without tool use. Phase D (confound
test, N=5) tested a no-swap pathfinding variant on Claude. Results
may reflect model-specific or interface-specific behaviors. We report
observed proportions and treat consistency across varied conditions as
the primary evidential basis.

**What changed across versions.**

| | v1 | v2 | v3 |
|---|---|---|---|
| Models | Claude Opus 4.6 only | + GPT-5.4, Gemini 3.1 Pro | Same |
| Runs | 220 (192 API + 28 CLI) | 336 (308 API + 28 CLI) | 346 (318 API + 28 CLI) |
| Artifacts | Physics only (Phase 9 added pathfinding) | Physics + pathfinding | Same |
| Headline finding | Framing corrects names | Framing is model-dependent | Same, plus confound test |
| Scoring | Physics map only; substring refusal | + pathfinding map; first-person refusal | Same |
| Structure | Claude-first, cross-model bolted on | Same | Cross-model inline throughout |
| Confound test | None | None | Phase 11: no-swap pathfinding |
| T4-B security refusal | 100% (5/5) | 60% (3/5) | 60% (3/5) |

---

## 2. Related Work

### Code obfuscation and deobfuscation

**Pre-LLM baselines.** **Lu, Coogan, and Debray** [17] describe
semantics-based automatic deobfuscation of JavaScript using dynamic
analysis and slicing (2011). Their approach recovers functionally
equivalent code without requiring knowledge of the obfuscation
scheme, establishing the pre-LLM baseline for automated JS
deobfuscation. The transition from such deterministic approaches
to LLM-based deobfuscation introduces the identifier-naming question
central to this paper: deterministic tools recover whatever literals
the code contains, while LLMs reconstruct names that may reflect
training priors, decoded string tables, or both.

**CASCADE** [1]: Google's hybrid LLM + compiler deobfuscator. Uses
Gemini for prelude function identification (99.56% accuracy via
few-shot prompting), then hands off to JSIR for deterministic
constant propagation, with sandboxed V8/QuickJS for dynamic
execution. Achieves 98.93% success on standard obfuscator.io output.
CASCADE's JSIR constant propagation recovers the original string
literals (before obfuscation encoded them), not semantically
meaningful names derived from algorithmic analysis. If the original
names were poisoned before obfuscation (our attack model), we predict
but did not test that JSIR would recover those poisoned names
faithfully, since it restores original literals regardless of semantic
correctness.

**webcrack** [4]: Purpose-built AST-level deobfuscator for javascript-
obfuscator output. Supports string array decoding (base64, RC4),
control flow unflattening, and dead code elimination via pattern
matching. Issue history indicates failure cases under some transform
combinations (e.g., CFF + dead code injection, issue #44). Our
RC4-encoded production build was not fully decoded by webcrack's
automated pipeline in Phase A testing.

**JS-Confuser** [6]: Alternative obfuscator using state-machine CFF
(explicit state transitions instead of dispatch strings). We expect
webcrack cannot reverse this pattern (untested; webcrack's source
matches only the split-string dispatch pattern).

### Identifier naming and LLM code understanding

**Wang et al.** [10] measure the impact of misleading variable names
on LLM code analysis tasks (using CodeBERT-family models), finding
that shuffled or misleading names degrade performance more than
random strings because they actively misdirect the model. This
supports the general premise that identifier names influence LLM
code processing, though the setting (analysis tasks on code models)
differs from our deobfuscation setting.

**"The Code Barrier"** [11] introduces semantics-preserving
obfuscations including cross-domain term substitution, finding that
removing meaningful names severely degrades intent-level tasks.
Their cross-domain renaming experiments provide relevant background
for our domain-gradient observations. Our contribution is specific
to the deobfuscation string-table setting: we observe that
wrong-but-plausible names are actively preserved in reconstructed
code, not merely that they degrade understanding.

**CoTDeceptor** [5] demonstrates that multi-stage obfuscation
strategies can evade CoT-enhanced LLM vulnerability detectors,
in line with the general finding that adversarial content can
bypass model analysis.

### Obfuscation vs. LLM code analysis

**Li et al.** [12] categorize obfuscation techniques (layout, data
flow, control flow) against LLM vulnerability detection, finding
both degradation and, in some cases, unexpected improvements.
**"Digital Camouflage"** [13] tests Claude, Gemini, and GPT-4o
against compiler-level obfuscation (CFF, bogus control flow) on
LLVM-obfuscated C functions, confirming cross-model degradation.
**FORGEJS** [14] benchmarks LLM vulnerability detection in JavaScript
and finds generally unreliable performance. **JsDeObsBench** [16]
provides the first systematic benchmark for LLM JavaScript
deobfuscation, evaluating GPT-4o, Mixtral, Llama, and DeepSeek-Coder
across obfuscation types from variable renaming to control flow
flattening. Its focus is on overall deobfuscation quality (syntax
accuracy, execution reliability, code similarity); our work addresses
a different question: whether specific poisoned identifiers survive
into the model's output. **Yefet et al.** [7]
establish adversarial examples for code models. These studies show
that obfuscation frequently degrades LLM code analysis under tested
settings. Our contribution extends this in a specific direction:
surface-level poisoning (wrong names in the string table) not only
degrades understanding but can produce contradictory outputs where
the model shows correct semantic knowledge and incorrect identifier
usage in the same response.

### Tool-augmented LLM agents

**SWE-bench** [15] and related work on agentic coding workflows show
that tool use (file read/write, shell execution) produces qualitatively
different behavior than single-shot inference. Our observation that
progressive analytical escalation appeared in Claude Code (Phase A,
with tools) but not in API testing (Phase B, without tools) aligns
with this (Section 7.1).

**Historical precedent.** 1988 paragraph-book anti-piracy [2,3]:
see Section 8.3.

---

## 3. Method

### 3.1 Stimuli

**Exploratory vs. hypothesis-testing.** Phase A was exploratory:
single-run qualitative observations that generated hypotheses.
Phase B sub-phases 0-3 were hypothesis-testing with replication.
Sub-phases 4-6 were targeted follow-ups, designed to test specific
predictions (translation-frame, domain-boundary stability) and boost
sample sizes on key conditions from earlier sub-phases. Phase C
(cross-model) tested the core protocol on GPT-5.4 and Gemini 3.1
Pro Preview. Phase D (confound test) tested a no-swap pathfinding
variant on Claude. We did not preregister hypotheses. The same author
designed stimuli, ran experiments, and scored results. We know these
are limitations. The automated scoring pipeline and published raw
outputs help, but do not fully compensate.

Four phases of experimentation:

**Phase A (exploratory, N=1):** 17 pill designs (we use "pill" as
shorthand for individual adversarial test stimuli, after the
poison-pill metaphor) tested in Claude Code CLI sessions (with tool
use). 7 production build variants. 28 tests. Results are qualitative
observations that generated hypotheses.

**Phase B (systematic, N=3-6):** 50 conditions tested via Anthropic
Messages API (no tool use). 192 automated runs across 2 models (183
Opus, 9 Haiku) in 10 sub-phases (0-9). Results are quantitative with
per-condition replication. All conditions at N=3 or higher. Sample
sizes preclude formal inferential statistics; we report observed
proportions and treat consistency across varied conditions as the
primary evidential basis.

**Phase C (cross-model, N=3-5):** 13 conditions tested via OpenAI
Chat Completions API and Google Generative AI SDK (no tool use). 116
automated runs across 2 models (GPT-5.4 and Gemini 3.1 Pro Preview)
in 3 tiers: core replication (66 runs), cost inflation (38 runs),
and spot checks (12 runs). Identical stimuli and scoring pipeline as
Phase B, with the pathfinding poison map added (see Section 3.3 and
Appendix H).

**Phase D (confound test, N=5):** 10 runs on Claude Opus 4.6 testing
a no-swap pathfinding variant. The original pathfinding pill mixes
substitutions (11 terms where one name is clearly wrong) with swaps
(4 terms where both names are valid A* vocabulary). The no-swap
variant replaces swapped pairs with unambiguous substitutions to test
whether the high pathfinding propagation rate is inflated by
algorithmically ambiguous swaps. See Section 5.3.

Control: pill 09 (clean code, standard obfuscation, no adversarial
content).

**Unit of analysis.** The 318 Phase B+C+D runs test varied conditions
on two code archetypes (a force-directed graph simulation, primary;
an A* pathfinding algorithm, replication) across three model families.
The design supports claims about identifier propagation behavior
under varied prompt, obfuscation, and naming conditions on these
archetypes. It does not support claims about LLM deobfuscation in
general.

### 3.2 Protocol

**Phase A:** Fresh Claude Code session from `/tmp`. File deleted before
each session. Model's complete response recorded manually. Follow-up
prompts used in some sessions to test bypass resistance. Tool use
(Bash, file read/write) available to the model.

**Phase B:** Automated via Anthropic Messages API. Each pill's code
sent as a user message with the exact prompt text. No tool use. Full
response, token counts, and stop reason recorded as structured JSON.
Automated scoring with code-block-level analysis (see 3.3).

**Phase C:** Automated via OpenAI Chat Completions API (GPT-5.4) and
Google Generative AI SDK (Gemini 3.1 Pro Preview). Same prompt text
and stimuli as Phase B. No tool use. Full response, token counts, and
timing recorded as structured JSON. Same scoring pipeline as Phase B,
with corrections applied (see 3.3, Appendix H).

**Phase D:** Automated via Anthropic Messages API. Same protocol as
Phase B with the no-swap pathfinding pill variant.

**Temperature.** Most Phase B runs used API default temperature. A
targeted comparison at temperature 0 (N=5, Phase 5) showed identical
100% propagation for core terms (`attraction` 5/5, `amplification`
5/5) on Claude. Phase C temperature-0 runs confirmed persistence on
GPT-5.4 (2.0/3) and Gemini 3.1 Pro (1.3/3). The effect is not a
sampling artifact. Temperature defaults differ across providers;
Phase C used each provider's default except for explicit
temperature-0 runs.

**Methodology note: refusal detection.** Keyword-based refusal
detection produces false positives when the response contains
security vocabulary in analytical prose. GPT-5.4 frequently uses
words like "malicious" in its analysis ("no malicious behavior
detected"), triggering the v1 substring-match detector. The v2
scorer requires first-person refusal constructions ("I won't," "I
cannot") and checks context-sensitive terms only in early prose,
excluding code blocks. See Appendix H.

### 3.3 Metrics

**Primary endpoint:** Whether a poisoned identifier is preserved in
code blocks of the model's output (binary, per term per run). This
is the unit of analysis for all propagation claims.

**Secondary endpoint (dual-representation):** Whether wrong identifier
in code AND correct semantic description in comments/prose appear in
the same response (binary, per run). This pattern appeared in 15/17
Phase B runs where the primary endpoint was positive.

Scoring for this endpoint: a run was counted as dual-representation
positive when (a) at least one poisoned identifier appeared in a code
block, AND (b) the same response contained a comment or prose
description that correctly named the actual operation (e.g., "Repulsion
force strength" adjacent to `attraction`). "Correct description" was
defined as any phrase that would allow a reader to identify the true
physical operation without reference to the variable name. This was
scored manually by the first author on all 17 applicable Phase B runs.
Scoring was not blinded; the scorer knew which names were poisoned.
Ambiguous descriptions (e.g., "force parameter" without specifying
direction) were excluded from the positive count. The 15/17 rate
should be read with this unblinded, single-scorer limitation in mind.

**Tertiary endpoints:**
- **Refusal:** v1 used substring matching for "malicious," "I won't,"
  etc. against full response text. v2 uses first-person refusal
  constructions ("I won't," "I cannot") plus context-sensitive terms
  checked only in early prose, excluding code blocks. This corrected
  false positives where models used "malicious" in analytical prose
  (e.g., "no malicious behavior detected"). See Appendix H.
- **Semantic corruption scoring:** For each poisoned name, check
  whether it appears in code blocks (```...```) vs. only in prose.
  Scoring definitions (applied per poisoned term per run):
  - **Propagated:** Wrong name appears in code blocks, correct name
    does not appear in code blocks.
  - **Flagged:** Both wrong and correct names appear in code blocks.
  - **Corrected:** Correct name appears in code blocks, wrong name
    does not.
  - **Absent:** Neither wrong nor correct name appears in code blocks.

  N.B.: Naive full-text scoring produces false negatives because the
  model writes correct physics descriptions in comments alongside
  wrong variable names. This motivated the code-block-level scoring.
  A model-based adjudication check (Appendix E) validated this scorer
  against an independent Haiku 4.5 blind adjudicator: 17/20 agreement
  (85%), with all disagreements in the conservative direction (the
  automated scorer undercounted propagation).
- **Pathfinding poison map:** v1 scored only the 14-term physics
  poison map. v2 adds an 11-term pathfinding poison map
  (`penalty`/`heuristic`, `adjacentCost`/`diagonalCost`, etc.),
  selected via the `artifact` field in the batch config. See
  Appendix H for the full map.
- **Time/tokens:** API-reported processing time and token usage.
- **Functional reconstruction:** Binary, tested in Phase A production
  builds only.

### 3.4 Experimental Matrix

| Sub-phase | Condition group | N (runs) | Model(s) |
|---|---|---|---|
| Phase 0 | Pill 10 replication | 5 | Opus |
| Phase 0 | Pill 03 replication | 3 | Opus |
| Phase 0 | Pill 10 cross-model | 3 | Haiku |
| Phase 0 | Pill 03 cross-model | 3 | Haiku |
| Phase 1 | Prompt variants (4 prompts) | 12 | Opus |
| Phase 1 | Domain gradient (4 domains) | 8 | Opus |
| Phase 1 | Obfuscation gradient (3 levels) | 6 | Opus |
| Phase 1 | Task frames (4 frames) | 8 | Opus |
| Phase 2 | Layer gradient (5 layers) | 10 | Opus |
| Phase 2 | Canary | 3 | Opus |
| Phase 3 | Extended domains (gamedev, overlap) | 6 | Opus |
| Phase 3 | Multi-agent verify | 6 | Both |
| Phase 3 | Task frame replications | 6 | Opus |
| Phase 4 | Framing experiment (3 frames) | 15 | Opus |
| Phase 4 | N-boost: gradient, canary, multi-agent | 20 | Opus |
| Phase 5 | N-boost: 4 domains + heavy obf + temp 0 | 21 | Opus |
| Phase 6 | N-boost: obf gradient, task frames, layer gradient | 27 | Opus |
| Phase 7 | Matched lexical controls (2 terms, full table) | 10 | Opus |
| Phase 8 | Full matched-table control (all terms, no fit) | 5 | Opus |
| Phase 9 | Second artifact (A* pathfinding): baseline, framing, control | 15 | Opus |
| Phase 10 | Cross-model Tier 1: baseline, framing, warning, control | 66 | GPT-5.4, Gemini |
| Phase 10 | Cross-model Tier 2: cost inflation | 38 | GPT-5.4, Gemini |
| Phase 10 | Cross-model Tier 3: engineering, temp 0 | 12 | GPT-5.4, Gemini |
| Phase 11 | Confound test: no-swap pathfinding baseline + generation | 10 | Opus |
| **Total** | **64 conditions** | **318 runs** | **183 Opus + 9 Haiku + 58 GPT-5.4 + 58 Gemini + 10 confound** |

Phase A (Claude Code CLI): 28 additional exploratory runs, N=1 per
condition.

### 3.5 Limitations

- Four models tested across three families (Opus 4.6, Haiku 4.5,
  GPT-5.4, Gemini 3.1 Pro Preview). Open-source models remain
  untested. Broader generalization requires additional model families.
- Two code archetypes tested (force-directed graph, A* pathfinding).
  Further archetype diversity is needed for broader generalization.
- Phase A: single run per condition, manual interpretation.
- Phase B: 3-6 runs per condition, automated scoring.
- Phase C: 3-5 runs per condition, automated scoring. Identical
  stimuli to Phase B; API differences (token counting, temperature
  defaults) may introduce minor cross-provider variance.
- Phase D: 5 runs per condition, Claude only.
- Temperature defaults differ across providers. Phase C used each
  provider's default except for explicit temperature-0 runs.
- Self-designed stimuli with implicit bias toward known model behaviors.
- Phase A and Phase B use different interfaces (Claude Code with tools
  vs. raw API without tools). Behaviors observed in Phase A may be
  specific to tool-using workflows.
- The scoring methodology (code-block extraction + regex) may miss
  propagation in non-standard response formats.
- Most Phase B runs used API default temperature.

Negative results and non-replications are reported alongside positive
findings throughout this paper.

---

## 4. Persistence Under Deobfuscation

### 4.1 Readable vs. Obfuscated Code

On readable code, models corrected wrong names using cues consistent
with algorithm pattern recognition, object field shapes, mathematical
sign tracing, domain-name cross-reference, and numerical precision.
Wrong names were overridden in every readable-code test (pills 06,
07, 08).

After obfuscation (control flow flattening, RC4 string encoding),
decoded names dominated reconstructed identifiers across all three
model families. The dual-representation pattern (Figure 1) appeared:
wrong identifiers in code, correct descriptions in comments.

### 4.2 Baseline Propagation Across Models

All values below are mean wrong names per run in code blocks. Physics
artifact has 14 scored poison terms; pathfinding has 11. "Persist"
means at least one wrong name appeared in code.

| Condition | Artifact | Claude Opus 4.6 | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|---|
| Baseline | Physics | 2.0/14, 5/5 persist | 2.0/14, 4/4 persist | 1.2/14, 4/5 persist |
| Baseline | Pathfind | 2.0/11, 5/5 persist | 11.0/11, 4/4 persist | 10.4/11, 5/5 persist |
| Adversarial warning | Physics | 2.0/14, 3/3 persist | 2.0/14, 3/3 persist | 1.3/14, 3/3 persist |
| Temperature 0 | Physics | 2.0/14, 5/5 persist | 2.0/14, 3/3 persist | 1.3/14, 3/3 persist |

Persistence generalizes across all three model families on both
artifacts. Adversarial warnings had no measurable effect. Temperature
0 confirmed the pattern is deterministic.

We tested five categories of adversarial content embedded in the
physics artifact. Four produced no propagation effect: inert textual
content (wrong comments, legal threats, CBRN strings, combinations;
pills 01-05), and attention capture via malware decoys (pill 14,
Phase A only). The model identified all inert content as "dead code"
or "prompt injection" in 7/7 tests. See Appendix A for the full
pill index. Only naming-semantic manipulation (wrong-but-plausible
identifier names in the string table) produced persistent propagation.

Structural executable content (functions with their own malware-like
logic) triggered refusal rather than propagation:

| Condition | Model | N | Refusal rate |
|---|---|---|---|
| Pill 03 (malware functions, readable) | Opus 4.6 | 3 | **100%** |
| Pill 03 (malware functions, readable) | Haiku 4.5 | 3 | **100%** |
| Pill 10 (poisoned names, no malware) | Opus 4.6 | 5 | 0% |
| Pill 10, security framing | Opus 4.6 | 5 | **60%** |
| Pill 10, practical framing | Opus 4.6 | 5 | 20% |
| Pill 14 (malware + poisoned) | Opus 4.6 | 5 | **100%** |
| Pill 22-4layer / 22-5layer | Opus 4.6 | 5 each | **100%** |

Refusal is binary and replicates across Opus and Haiku (6/6).
Security-framed prompts trigger refusal on non-malware code at a
majority rate (3/5), though not uniformly. The v1 figure of 100%
(5/5) included 2 false positives from analytical prose containing
"malicious"; see Appendix H.

### 4.3 The Pathfinding-Physics Asymmetry

Pathfinding-domain poisoning propagated more than physics-domain
poisoning across all models and conditions. This was the most
consistent cross-model pattern in the data.

| Condition | Physics (of 14) | Pathfinding (of 11) |
|---|---|---|
| Claude baseline | 2.0 | 2.0 |
| GPT-5.4 baseline | 2.0 | **11.0** |
| Gemini baseline | 1.2 | **10.4** |
| Claude generation | 0.2 | 0 |
| GPT-5.4 generation | 1.0 | **2.8** |
| Gemini generation | 1.4 | **4.8** |

On the physics artifact, most poisoned names are secondary parameters
(force strength, damping coefficient) that the model can omit or
rename without breaking the algorithm. On the pathfinding artifact,
nearly every poisoned name is structurally necessary for any A*
implementation: `heuristic`, `openSet`, `closedSet`, `gScore`,
`fScore`, `neighbors`. A model writing A* code must use these
concepts. When the decoded string table provides names for them, all
three models used those names.

The Claude exception (2.0/11 pathfinding at baseline, vs. 10-11/11
on GPT-5.4 and Gemini) reflects Claude's tendency to rename some
pathfinding terms even under the deobfuscation frame. Claude's
baseline pathfinding propagation, while lower in raw count, still
showed 5/5 run-level persistence.

A confound test (Phase 11, Section 5.3) confirmed that the high
pathfinding propagation rate is not an artifact of swapped variable
pairs in the poison map.

### 4.4 Numerical Precision Manipulation

Truncated mathematical constants ($\tau \approx 6.283$, real
$2\pi = 6.28318\ldots$; $1/\sqrt{2} \approx 0.707$, real
$= 0.70710\ldots$) propagated without correction in all conditions
where we explicitly tested them: readable code (pill 08, Phase A)
and obfuscated code (pill 10, Phase A+B). The model added an
approximate annotation ("~2pi") but did not substitute the precise
value. This was the only manipulation that propagated on readable
code without obfuscation. Systematic replication was not prioritized
in Phase B.

**Cross-model scoring caveat.** GPT-5.4 produces 7-23 code blocks per
response (section-by-section walkthrough) compared to 1 code block
for Claude and Gemini (single reconstruction). The regex-based scorer
operates on all code blocks equally. A manual validation (Appendix I)
confirmed that all 11 poisoned pathfinding terms appeared in GPT-5.4's
primary reconstruction block (the largest code block), not just in
intermediate analysis snippets. The multi-block format does not inflate
the pathfinding count.

---

## 5. Mitigation Attempts

### 5.1 Verification Instructions

In Phase B, we tested four prompt variants on pill 10 (N=3 per
variant, 12 total runs on Claude). Prompts ranged from baseline
("deobfuscate this") to explicit adversarial warning ("the string
table may contain adversarial names; cross-check each decoded name
against the algorithm structure").

Result on Claude: 12/12 runs propagated wrong names regardless of
prompt.

| Prompt | `attraction` in code | `amplification` in code |
|---|---|---|
| A: "deobfuscate this" (baseline) | **3/3** | **3/3** |
| B: "deobfuscate + verify names" | **3/3** | **3/3** |
| C: "verify each name matches the math" | **3/3** | **3/3** |
| D: "string table may be adversarial, cross-check" | **3/3** | **3/3** |

The model spent more time on verification prompts (52.6s vs 36.6s
baseline) but still propagated.

Cross-model: adversarial warnings produced identical results on
GPT-5.4 (3/3 persist) and Gemini 3.1 Pro (3/3 persist). Combined
across all three families: **18/18 runs preserved wrong names under
explicit verification instructions.**

### 5.2 The Framing Experiment

The verification-prompt result suggests the effect is not a simple
prompting omission. One explanation that fits the data: deobfuscation
may activate a translation-like workflow where decoded string-table
entries serve as "source text." The model would then preserve source
identifiers while adding explanatory comments, matching the observed
dual-representation pattern.

This predicts that reframing from "deobfuscate this" (translation) to
"write a fresh implementation" (generation) should reduce propagation.

**Claude results (Phase 4, N=5 per frame):**

| Frame | `attraction` in code | `repulsion` in code | `amplification` in code | `damping` in code |
|---|---|---|---|---|
| "Deobfuscate" (translation) | **5/5** | 1/5 | **5/5** | 5/5 |
| "Rewrite with correct names" | 4/5 | 5/5 | 3/5 | 5/5 |
| "Write fresh from scratch" | **1/5** | **5/5** | **0/5** | **5/5** |

The generation frame reduced `attraction` propagation from 100% to
20% and `amplification` from 100% to 0% on Claude. The rename-
correction frame was intermediate: the model attempted correction
but preserved wrong names alongside correct ones (4/5, 3/5).

An algorithmic consistency check (Appendix F) confirmed that
generation-frame outputs preserve the checked structure on both
artifacts (physics: 5/5 runs; pathfinding: 5/5 runs). Name
correction under the generation frame is not a side effect of
algorithmic drift.

**Cross-model framing results:**

| Condition | Artifact | Claude | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|---|
| Baseline | Physics | 2.0/14 | 2.0/14 | 1.2/14 |
| Generation frame | Physics | 0.2/14 | 1.0/14 | 1.4/14 |
| Baseline | Pathfind | 2.0/11 | 11.0/11 | 10.4/11 |
| Generation frame | Pathfind | 0/11 | 2.8/11 | **4.8/11** |

The framing effect is strongest on Claude, partial on GPT-5.4, and
ineffective on Gemini for pathfinding. On physics, Gemini's generation
frame produced 1.4/14 wrong names vs. 1.2/14 at baseline: a slight
increase, not a reduction. GPT-5.4 showed modest reduction on physics
(2.0 to 1.0) and meaningful reduction on pathfinding (11.0 to 2.8),
but did not approach Claude's near-complete correction.

The generation frame is not a general mitigation. It is a Claude-
strong, GPT-5.4-partial, Gemini-ineffective intervention. On Gemini,
no tested prompt-based manipulation reduced pathfinding propagation
below 4.8/11.

### 5.3 Confound Test: Structural Necessity (Phase 11)

The pathfinding poison map mixes two types of manipulation:
- **Substitutions** (11 terms): `penalty` for `heuristic`, `ancestors`
  for `neighbors`, etc. One name is clearly wrong.
- **Swaps** (4 terms): `closedSet`/`openSet` and `fScore`/`gScore`
  are exchanged. Both names are valid A* vocabulary; no algorithmic
  cue disambiguates which should be which.

If the high pathfinding propagation rate were inflated by the swaps
(which the model cannot distinguish from correct usage), the
structural-necessity interpretation would be weaker. We built a
no-swap variant replacing swapped pairs with unambiguous substitutions
(`openSet` to `frontier`, `closedSet` to `visited`, `gScore` to
`pathCost`, `fScore` to `priority`).

| Condition | Original pill | No-swap pill |
|---|---|---|
| Baseline persistence | 5/5 | 5/5 (11.0/14 wrong) |
| Generation frame correction | 5/5 corrected | 3/5 corrected |

Baseline propagation is not inflated by swaps. Removing the swapped
pairs did not reduce propagation: 5/5 baseline runs still showed
full persistence, with 11.0/14 wrong names per run.

The generation frame was slightly weaker without swaps: 3/5 corrected
vs. 5/5 on the original pill. The swapped pairs may actually help
correction under the generation frame because the model recognizes
A* set semantics (open/closed) and generates canonical names. Without
that familiar structure, correction requires recognizing that
"frontier" should be "openSet," which demands deeper algorithmic
knowledge.

This does not weaken the cross-model finding. Gemini showed
persistence on the original pill (which includes the supposedly-easier
swapped pairs), making the no-swap result a stricter test that the
original pill already passes.

---

## 6. What Determines Correction

### 6.1 Matched Controls

The domain-gradient experiments (Section 6.2) suggested per-term
semantic fit determines propagation, but this was confounded with
domain-level coherence. To isolate the variable, we created
length-matched terms with zero semantic fit: `combustion` (10 chars,
like `attraction`) for repulsion, `communication` (13 chars, like
`amplification`) for damping. In one condition only 2 terms were
changed; in another, ALL config property names were replaced with
length-matched no-fit terms.

**Claude results:**

| Condition | All terms replaced? | Domain coherent? | Propagation |
|---|---|---|---|
| pill-10 (physics terms) | Yes | Yes (physics) | FLAGGED 5/5 |
| pill-25 (2 no-fit terms, rest physics) | No | Mostly | FLAGGED 5/5 |
| pill-27 (ALL no-fit terms, incoherent) | Yes | No | **FLAGGED 5/5** |
| pill-20-engineering (ALL engineering) | Yes | **Yes (engineering)** | **CORRECTED 5/5** |

*FLAGGED = both wrong and correct names appeared in code blocks; the
wrong name was preserved. CORRECTED = only correct names in code.*

`combustion` persisted at the same rate as `attraction`, even when
every term lacked semantic fit. Correction occurred only when the
replacement set formed a coherent engineering vocabulary (0/5
propagation), though other coherent domains (e.g., finance) produced
mixed rather than clean correction.

**Cross-model matched controls:**

| Condition | Artifact | Claude | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|---|
| No-fit control | Physics | 2.0/14, 5/5 persist | 0.2/14 | 0.6/14 |
| No-fit control | Pathfind | 2.0/11, 5/5 persist | 8.6/11 | 6.4/11 |

A physics/pathfinding split appeared on GPT-5.4 and Gemini that was
absent on Claude. Both models corrected no-fit terms on the physics
artifact (directionally opposite to Claude, which preserved them) but
propagated no-fit terms on pathfinding. Claude preserved no-fit terms
on both artifacts. The pathfinding artifact's structural properties
appear to dominate over term-level semantic evaluation on GPT-5.4
and Gemini.

The same pattern appeared on the second artifact: `invoice` (zero fit
to heuristic estimation) persisted at 5/5 on Claude, while the
generation frame corrected all terms to proper pathfinding vocabulary
(5/5).

### 6.2 Domain-Gradient Experiments (Phases 1-5, exploratory)

Earlier domain-pill experiments, which replaced all terms with
coherent domain-specific alternatives, showed per-term variation:

| Term | For operation | Domain | Propagation | N |
|---|---|---|---|---|
| `attraction` | repulsion | physics | 100% | 8 |
| `decay` | damping | overlap | 100% | 3 |
| `velocity` | repulsion | game dev | 75% | 8 |
| `yield` | repulsion | finance | 60% | 5 |
| `acceleration` | damping | game dev | 0% | 8 |
| `inductance` | repulsion | engineering | 0% | 5 |

This looked like per-term semantic evaluation. However, the matched-
control results (Section 6.1) showed this interpretation is
confounded: the domain pills replaced ALL terms with coherent
alternatives, creating a recognizable domain signal. The per-term
variation likely reflects the model's confidence in the alternative
domain, not per-term semantic evaluation. The `acceleration` result
(0/8 despite being a core physics term) may reflect domain-level
recognition of the game-dev replacement set rather than recognition
that acceleration contradicts what damping does.

The intermediate points (e.g., yield 3/5) are underpowered and
should not be over-interpreted. This initial gradient motivated the
matched-control experiments (Section 6.1) that clarified the picture.

### 6.3 Obfuscation Gradient

| Level | Claude | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|
| Light (base64, CFF 0.5) | 4.0/14 | 4.0/14 | 4.0/14 |
| Medium (base64, CFF 0.5, self-defending) | 5/5 persist | (not tested) | (not tested) |
| Heavy (RC4, CFF 0.75, split strings) | 1.0/14 | 1.0/14 | 1.7/14 |

Light obfuscation is sufficient to trigger propagation and produced
the highest raw counts across all three models. Heavy obfuscation
reduced propagation, where split-string encoding
fragments the name across chunks, reducing recoverability. This
recoverability interaction is one reason the domain-gradient
experiments (Section 6.2) should be treated as exploratory.

### 6.4 Engineering Domain

When the replacement set formed a coherent engineering vocabulary,
all three models partially or fully corrected:

| Model | Wrong names in code | Corrected |
|---|---|---|
| Claude | 0/14 | 5/5 |
| GPT-5.4 | 0.7/14 | partial |
| Gemini 3.1 Pro | 0.7/14 | partial |

Direction was the same across all models: engineering-domain terms
produced the lowest propagation rates of any condition. Strength
varied, with Claude showing complete correction and GPT-5.4/Gemini
showing near-complete correction. This suggests domain-level
coherence of the replacement set influences whether models override
decoded names, though the boundary conditions differ across models.

---

## 7. Secondary Findings

### 7.1 Adversarial Salience Escalation (Phase A only)

In Phase A (Claude Code with tools), defense sophistication was
inversely correlated with defense effectiveness. Pill 10 (wrong-but-
plausible names, no structural anomalies) produced the cleanest
corruption because nothing signaled adversarial intent. Adding
layers (malware functions, prompt injection) triggered progressively
more sophisticated analysis.

**Phase B did not replicate this pattern.** In the API (without
tools), refusal is a step function at the malware-function boundary,
not a gradient. The model either analyzes routinely or refuses.
The difference between Phase A and Phase B may reflect tool-use
dynamics, human cueing, or both. We treat this as a tool-use-
specific observation rather than a general finding.

### 7.2 Cost Inflation

**Phase A (Claude Code with tools, N=1):** As an engineering
illustration: the undefended control (pill 09) was deobfuscated in
2.5 min with near-perfect output. The defended production build (v7)
required 13.5 min for structural recovery and 3+ hours for a full
reconstruction attempt (137 tool invocations, 268K tokens) that
produced non-functional output with poisoned parameter names
throughout. These are single-run Phase A observations and should not
be read as controlled effect-size estimates.

**Phase C (single-shot API, all three models):** Phase 10 measured
single-shot response behavior (one prompt, one response) on clean
vs. poisoned code. This measures response verbosity in a single turn,
not the iterative reconstruction cost that an agentic workflow
would incur.

| Model | Condition | Mean time | Mean tokens | Code blocks |
|---|---|---|---|---|
| Claude Opus 4.6 | Clean | 36s | 2,291 | 1 |
| Claude Opus 4.6 | Poisoned | 37s | 2,391 | 1 |
| GPT-5.4 | Clean | 45s | 3,021 | 7-23 |
| GPT-5.4 | Poisoned | 87s | 3,617 | 11-18 |
| Gemini 3.1 Pro | Clean | 53s | 2,568 | 1 |
| Gemini 3.1 Pro | Poisoned | 57s | 2,633 | 1 |

Claude and Gemini produced similar output volume for clean vs.
poisoned code. No measurable single-shot cost difference.

GPT-5.4 produced substantially more output on poisoned code (+20%
tokens, +93% wall-clock time). This correlates with GPT-5.4's
response format: it produces a section-by-section walkthrough with
many small code snippets, while Claude and Gemini produce a single
reconstructed code block plus explanation. The time difference
measures output verbosity, not reconstruction difficulty.

**What these numbers do not measure.** The Phase A cost-inflation
finding (2.5 min to 3+ hours, producing broken output) was measured
in an agentic multi-turn workflow where the model iteratively reads
files, writes code, tests, and revises. That workflow has not been
replicated cross-model. Proper cross-model cost-inflation measurement
would require each model's agentic toolchain (ChatGPT with Code
Interpreter, Gemini with code execution, Claude Code CLI) performing
full functional reconstruction.

### 7.3 Defender Implications

Cross-model persistence means that switching model providers does not
bypass poisoned-identifier propagation. A defender who poisons their
string table can expect the names to survive deobfuscation on Claude,
GPT-5.4, and Gemini at baseline. Verification instructions do not
help on any tested model. The generation frame provides partial
mitigation on Claude and GPT-5.4 but not on Gemini. An attacker using
Gemini for deobfuscation would encounter persistence under every
tested prompt condition.

### 7.4 Multi-Agent Verification Pilot (Phase 3)

A fresh model instance was given the deobfuscated code (readable, with
wrong names and correct comments) and asked to verify each name.

| Model | N | Wrong names flagged | Fully corrected in code |
|---|---|---|---|
| Opus 4.6 | 3 | 2/3 | 0/3 |
| Haiku 4.5 | 3 | 2/3 | 0/3 |

Both models detected the discrepancy but neither consistently removed
the wrong names from code output. At N=3 per model, this is a pilot
observation. The readable-code setting is cognitively different from
deobfuscation, so the two effects may not share a common mechanism.

---

## 8. Discussion

### 8.1 What the Cross-Model Evidence Supports

v3 supports a family of behavioral regularities, not a single
model-independent mechanism.

Three patterns generalize across all tested models:
1. Baseline persistence of decoded names in reconstructed code.
2. Resistance to explicit verification instructions (18/18).
3. Deterministic behavior at temperature 0.

Two patterns are model-dependent:
1. The generation-frame effect: strong on Claude, partial on GPT-5.4,
   absent on Gemini for pathfinding.
2. Matched-control behavior: Claude preserves no-fit terms on both
   artifacts; GPT-5.4 and Gemini correct them on physics but not
   pathfinding.

One pattern is artifact-dependent:
1. Pathfinding propagates more than physics across all models,
   attributable to the structural necessity of pathfinding variable
   names in any A* implementation.

The v1 translation-frame hypothesis (deobfuscation activates a
source-preservation workflow) may still describe Claude's behavior,
but it does not explain Gemini's: Gemini preserved poisoned names
even under the generation frame. Different models appear to resolve
decoded-name conflicts through different internal processes, and no
single mechanistic account covers the cross-model data.

The framing mitigation result illustrates this limitation precisely.
On Claude, the generation frame reduced physics propagation from
2.0/14 to 0.2/14 and pathfinding from 2.0/11 to 0/11. On Gemini,
the same frame produced 1.4/14 on physics (slightly higher than
baseline) and 4.8/11 on pathfinding. Whatever mechanism the
generation frame disrupts in Claude, it does not operate the same
way in Gemini.

These remain behavioral descriptions. The data identify what
generalizes and what varies. They do not isolate the underlying
cause for any model.

### 8.2 Practical Effect of the Defense

The defense is a cost multiplier that degrades automated semantic
recovery. It does not prevent a determined attacker from understanding
the code's architecture. After 13.5 minutes, the model in our Phase A
production-artifact test correctly identified: force-directed graph,
12 project nodes, 50 concept nodes, Canvas 2D rendering,
spring/repulsion physics, particle system, camera system, and
animation loop.

What the defense disrupted (in our observations): zero-effort casual
analysis, correct parameter naming, and quick functional reproduction.

**Practical implication for LLM-assisted workflows.** A generation-
frame pass ("reimplement this from scratch") after deobfuscation may
correct poisoned identifiers on Claude where verification prompts do
not. This mitigation does not transfer to Gemini 3.1 Pro based on
current data. GPT-5.4 showed partial benefit. A user switching models
to circumvent poisoned identifiers would find the same baseline
persistence on all three tested families.

### 8.3 Cost Multiplication, Not Protection

A browser-delivered artifact is ultimately inspectable. The defense
adds cost to the LLM-assisted path but does not close the manual
path. The framing parallel is to 1988 paragraph-book anti-piracy
techniques [2,3], which worked because the reader had no independent
verification channel.

---

## 9. Future Work

1. **Open-source models.** Llama, DeepSeek, Mistral, and other
   open-weight models remain untested. The three tested families are
   all closed-source. Open-source models may show different
   propagation behavior due to different training procedures,
   alignment methods, or architecture choices.

2. **Tool-use vs. single-shot inference.** Adversarial salience
   escalation appeared in Claude Code (agentic, tool-using) but not
   via the API. Does tool use change how models allocate verification
   effort during deobfuscation? A controlled comparison (same model,
   same code, tool-use enabled vs. disabled) would isolate this.

3. **Manual dual-representation scoring cross-model.** The 15/17
   dual-representation count was manually scored on Claude only.
   GPT-5.4 and Gemini responses have not been manually assessed for
   dual-representation. The automated scorer detects name presence
   but does not assess comment correctness.

4. **Larger N on key Gemini cells.** Gemini baseline pathfinding
   (N=5) and generation-frame pathfinding (N=5) are the cells that
   most challenge the framing-as-mitigation narrative. N=10+ would
   tighten the estimates and reduce the chance of small-sample
   artifacts.

5. **Custom obfuscator.** State-machine CFF (anti-webcrack) and
   polymorphic generation. We implemented a prototype environment-
   aware decoder in v7 but did not systematically test it in Phase B.

6. **Temporal stability.** Re-run key conditions after model updates.

7. **Constants propagation on readable code.** TAU=6.283 propagated
   without obfuscation in Phase A (pill 08), making it the only
   manipulation effective on readable code. This was not systematically
   replicated and may be a more practical attack vector than
   identifier poisoning.

8. **Mapping the domain-recognition boundary.** Phase 8 matched
   controls showed that per-term semantic fit is confounded with
   domain-level coherence. Testing what makes a set of replacement
   terms "recognizably from another domain" (number of coherent
   terms needed, domain distance, term familiarity) would sharpen
   this finding.

9. **Multi-agent mitigation.** Initial testing (Section 7.4, N=3 per
   model) showed partial detection but 0/6 full correction. Testing
   alternative configurations (e.g., giving the verifier only
   pseudocode, forcing name generation from scratch) is the natural
   next step.

10. **Competing string tables.** Providing the model with two
    conflicting sets of decoded names (e.g., a second string table
    containing correct names alongside the poisoned one) should force
    explicit conflict resolution rather than silent propagation. This
    would test whether the preservation pattern reflects lexical-source
    dominance or a more general default.

11. **Agentic cost-inflation cross-model.** The Phase A cost data
    (2.5 min to 3+ hours) was measured only on Claude Code CLI. The
    Phase C single-shot comparison measures output verbosity, not
    reconstruction cost. Proper cross-model measurement requires
    each model's agentic toolchain performing full functional
    reconstruction.

---

## 10. Conclusion

Three claims are supported by the data:

**a) Baseline persistence generalizes across three model families.**
All three models preserved poisoned decoded names in reconstructed
code at baseline. GPT-5.4 propagated 11.0/11 pathfinding terms;
Gemini propagated 10.4/11. The physics artifact showed lower but
nonzero propagation on all models (1.2-2.0/14). Temperature 0
confirmed deterministic behavior.

**b) Explicit verification warnings do not reduce propagation on any
tested model.** 18/18 runs across Claude (12), GPT-5.4 (3), and
Gemini (3) preserved wrong names under adversarial warning prompts.
The model spent more time on verification prompts (52.6s vs 36.6s
baseline on Claude) without changing the output.

**c) Generation framing helps some model/artifact combinations but
is not a general mitigation.** The generation frame reduced
propagation on Claude (physics: 2.0/14 to 0.2/14; pathfinding:
2.0/11 to 0/11) and partially on GPT-5.4 (pathfinding: 11.0/11 to
2.8/11). On Gemini, the generation frame did not reduce propagation:
physics went from 1.2/14 to 1.4/14 (a slight increase) and
pathfinding from 10.4/11 to 4.8/11 (still nearly half persisting).
For at least one major model family, no tested prompt-based
intervention reduced propagation across conditions.

The pathfinding-physics asymmetry, confirmed by a confound test
removing algorithmically ambiguous swapped pairs, indicates that
artifact structure shapes propagation behavior. When poisoned names
fill structurally necessary roles, they persist regardless of model
or prompt.

The study covers 318 API runs across 64 conditions on four models in
three families. The critical remaining gaps are open-source model
testing, additional code archetypes, manual dual-representation
scoring on GPT-5.4 and Gemini, and agentic cross-model cost-inflation
measurement.

---

## Conflict of Interest

The first author operates kieleth.com, whose production JavaScript
artifact is used as a case study in Appendix G. The controlled
experiments (Sections 4-8) use synthetic test stimuli independent
of the production artifact.

## Data Availability

Raw JSON outputs for all Phase B, C, and D runs (318 total), test
stimuli (pills), batch configurations, and the automated scoring
pipeline are available at: https://github.com/Kieleth/obfuscated-sentinel
(Kieleth, kieleth.com)

Phase A session transcripts are not included (manual sessions,
not machine-recorded).

## Responsible Disclosure

We disclosed these findings to Anthropic prior to publication via
their model safety reporting channel. The behaviors documented here
are observable through normal API usage and do not exploit any
vulnerability in access controls or safety systems.

---

## References

[1] S. Jiang, P. Kovuri, D. Tao, and Z. Tan. "CASCADE: LLM-Powered JavaScript Deobfuscator at Google." arXiv preprint arXiv:2507.17691, 2025.

[2] *Sentinel Worlds I: Future Magic* paragraph booklet. Electronic Arts, 1988. Archived at mocagh.org/ea/futuremagicaus-paragraphs.pdf.

[3] J. Dott. "Wasteland." The Digital Antiquarian, 2016. filfre.net/2016/02/wasteland/.

[4] j4k0xb. webcrack: AST-level JavaScript deobfuscator. github.com/j4k0xb/webcrack.

[5] S. Chen, Z. Yu, J. Wang, et al. "CoTDeceptor: Enhancing LLM-based Code Vulnerability Detection via Multi-stage Obfuscation Strategies." arXiv preprint arXiv:2512.21250, 2025.

[6] MichaelXF. JS-Confuser: JavaScript obfuscator. github.com/MichaelXF/js-confuser.

[7] N. Yefet, U. Alon, and E. Yahav. "Adversarial Examples for Models of Code." *Proc. ACM Program. Lang.* (OOPSLA), 4, 2020. arXiv:1910.07517.

[8] Y. Zhou, L. Fan, and J. Grundy. "From Obfuscated to Obvious: A Comprehensive JavaScript Deobfuscation Tool for Security Analysis." In *NDSS*, 2026. arXiv:2512.14070.

[9] OWASP. "LLM Top 10 2025: LLM01 -- Prompt Injection." genai.owasp.org/llmrisk/llm01-prompt-injection/.

[10] Z. Wang, L. Zhang, C. Cao, N. Luo, X. Luo, and P. Liu. "How Does Naming Affect LLMs on Code Analysis Tasks?" 2024. arXiv:2307.12488.

[11] W. Nikiema, M. Bhatt, and R. Feldt. "The Code Barrier: What LLMs Actually Understand?" arXiv preprint arXiv:2504.10557, 2025.

[12] Z. Li, Y. Wang, and W. Cai. "A Systematic Study of Code Obfuscation Against LLM-based Vulnerability Detection." arXiv preprint arXiv:2512.16538, 2025.

[13] A. Ferrara and L. Ferrara. "Digital Camouflage: The LLVM Challenge in LLM-Based Malware Detection." arXiv preprint arXiv:2509.16671, 2025.

[14] L. Bensalem, Y. Huang, and A. Rountev. "Large Language Models Cannot Reliably Detect Vulnerabilities in JavaScript." (FORGEJS). arXiv preprint arXiv:2512.01255, 2025.

[15] C. E. Jimenez, J. Yang, A. Wettig, et al. "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" In *ICLR*, 2024. arXiv:2310.06770.

[16] Y. Chen, T. Jin, and Z. Lin. "JsDeObsBench: Measuring and Benchmarking LLMs for JavaScript Deobfuscation." In *CCS*, 2025. arXiv:2506.20170.

[17] G. Lu, K. Coogan, and S. Debray. "Automatic Simplification of Obfuscated JavaScript Code: A Semantics-Based Approach." Technical Report, University of Arizona, 2011.

---

## Appendix A: Experiment Index

| ID | Technique | State | Refusal | Names propagated | Time |
|---|---|---|---|---|---|
| Pill 01 | Wrong comments | Readable | No | N/A | Instant |
| Pill 02 | Legal threats (strings) | Readable | No | N/A | Instant |
| Pill 03 | Malware functions | Readable | Partial | N/A | Instant |
| Pill 04 | CBRN system prompts | Readable | No | N/A | Instant |
| Pill 05 | All combined | Readable | No | N/A | Instant |
| Pill 06 | Inverted semantics | Readable | No | 0/4 | Instant |
| Pill 07 | Cascading rename | Readable | No | 0/5 | Instant |
| Pill 08 | Trojan constants | Readable | No | TAU propagated | Instant |
| Pill 09 | Clean (control) | Obfuscated | No | 0 (correct output) | 2.5 min |
| Pill 10 | Poisoned names | Obfuscated | No | All (~10) | 1.75 min |
| Pill 11 | Malware-domain names | Obfuscated | No | 0 (re-derived) | 57 sec |
| Pill 12 | License text | Obfuscated | No | N/A | ~2 min |
| Pill 13 | Pill 03 obfuscated | Obfuscated | No (forensics) | N/A | ~3 min |
| Pill 14 | Hybrid (03+10) | Obfuscated | No | Physics under-analyzed | 8 min |
| Pill 15 | Dual implementation | Readable | No | N/A | Instant |
| Pill 16 | Decision graph | Readable | No | N/A | Instant |
| Pill 17 | Realistic malware | Partial obf | Yes (alarm) | Not tested | ~1 min |
| Prod v4 | IIFE + decoder poison + decoy | Full obf | Yes | Not reached | 2 min |
| Prod v7 | Nested layers + hidden poison | Full obf | Yes / broke on push | All 20 params | 13.5 min |
| Prod v7 reconstruct | Same, "reconstruct fully" | Full obf | N/A | Poisoned throughout | 3+ hours |

The full experimental matrix is in Section 3.4. Phase B totals: 192
automated runs (183 Opus, 9 Haiku) across 50 conditions in 10 sub-phases.
Phase C totals: 116 automated runs (58 GPT-5.4, 58 Gemini 3.1 Pro)
across 13 conditions in 3 tiers.
Phase D totals: 10 automated runs (Opus) across 2 conditions.
Phase A: 28 exploratory runs. **Grand total: 346 runs (318 API + 28 CLI).**

Raw JSON outputs for all Phase B runs: `experiments/results/phase{0..9}/`.
Raw JSON outputs for all Phase C runs: `experiments/results/phase10/`.
Raw JSON outputs for Phase D runs: `experiments/results/phase11/`.

## Appendix B: Environment

### Phase A (Claude Code CLI)
- Model: Claude Opus 4.6 (1M context)
- CLI: Claude Code v2.1.86 through v2.1.91
- Platform: macOS Darwin 24.6.0
- Subscription: Claude Max
- Test directory: /private/tmp (fresh sessions, no project context)
- Obfuscator: javascript-obfuscator v4.x with RC4 encoding

### Phase B (Anthropic Messages API)
- Models: Claude Opus 4.6 (`claude-opus-4-6`), Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- SDK: @anthropic-ai/sdk v0.82.0
- Max tokens per response: 16,384
- Temperature: not explicitly set; API defaults were used
- No `top_p`, `top_k`, or seed parameters set (API defaults)
- No tool use (single-shot inference)
- Each run: fresh API request with no conversation state, identical
  model ID, identical parameters, no cached context
- Automated scoring via code-block extraction + regex matching
- Test harness: `experiments/testbed/run-experiment.js`

### Phase C (Cross-Model APIs)
- GPT-5.4 (`gpt-5.4`): OpenAI Chat Completions API via `openai` SDK
- Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`): Google Generative AI SDK (`@google/generative-ai`)
- Max tokens per response: 16,384 (matched to Phase B)
- Temperature: not explicitly set; provider defaults used except for
  explicit temperature-0 runs
- No tool use (single-shot inference)
- Same stimuli, prompts, and scoring pipeline as Phase B
- Scoring corrections applied: refusal detection rewritten,
  pathfinding poison map added (see Appendix H)
- Test harness: `scripts/run-experiment.js` (same as Phase B, with provider routing via `scripts/providers/`)

### Phase D (Confound Test)
- Model: Claude Opus 4.6 (`claude-opus-4-6`)
- SDK: @anthropic-ai/sdk v0.82.0
- Same parameters as Phase B
- Pill variant: no-swap pathfinding (substitutions only, swapped pairs
  replaced with unambiguous wrong names)

## Appendix C: Exemplar Output

See Figure 1. Full response transcript: `experiments/results/phase0/R1/pill-10-obfuscated-poisoned_claude-opus-4-6_run1.json`.
Pattern appeared in 15/17 Phase B runs where the primary endpoint
was positive (at least one poisoned identifier in code blocks).

## Appendix D: Refusal Metric Validation

We manually reviewed 10 runs sampled across 4 condition families
(pill 03 refusal, pill 10 deobfuscation, T4-B security framing,
S1 layer gradient with malware). The keyword-based refusal detector
agreed with human judgment in all 10 cases (5 true positives, 5 true
negatives). No borderline cases were observed in the sample.

Note: this validation was performed on the v1 scorer. The v2 scorer
uses a stricter refusal detection method (first-person constructions
only; see Appendix H). The v2 scorer produces fewer false positives
by design, at the cost of potentially missing passive-voice refusals.

## Appendix E: Model-Based Scoring Adjudication (Phase 7)

A model-based blind adjudicator (Haiku 4.5, a different model from
the generator) evaluated 20 Phase B responses for presence of
`attraction` and `amplification` in code blocks. Agreement with the
automated regex scorer: 17/20 (85%). All 3 disagreements were in the
same direction: the adjudicator detected `attraction` in code where
the regex missed it. The automated pipeline is conservative
(undercounts propagation). No cases where automation inflated counts.

**Scope:** This validates the automated propagation scorer (the
primary endpoint). It does not independently validate the manual
15/17 dual-representation count (the secondary endpoint), which
relies on a single unblinded author scorer. Independent human
rescoring of the dual-representation endpoint remains an open
validation gap.

Results: `experiments/results/blind-scoring/blind-scoring-results.json`
Script: `scripts/blind-score.js`

## Appendix F: Algorithmic Consistency Check

We verified that generation-frame outputs ("write fresh from scratch")
preserve the scored algorithmic components and key parameter values
on both artifacts.

**Physics artifact (outputs from Phase 4, checked during Phase 7; N=5 per frame):**

| Frame | Params (4) | Formulas (4) | Correct names | Wrong names |
|---|---|---|---|---|
| Generation | 5/5 all 4 | 5/5 all 4 | 4/5 | 1/5 |
| Translation | 5/5 all 4 | 5/5 all 4 | 0/5 | 5/5 |

Checks: inverse-square repulsion, Hooke's law springs, velocity
damping operation, center gravity, parameter values (4000, 0.004,
0.92, 0.0003).

**Pathfinding artifact (Phase 9, N=5 per frame):**

| Frame | Key values (3) | Algorithmic checks (4) | Correct names | Wrong names |
|---|---|---|---|---|
| Generation | 5/5 all 3 | 5/5 all 4 | 5/5 | 0/5 |
| Translation | 5/5 all 3 | 5/5 all 4 | 0/5 | 5/5 |

Key values: diagonal cost (1.414), max iterations (1000), obstacle
ratio (0.25). Algorithmic checks: Manhattan heuristic present,
open/closed set structure, g-score/f-score computation, neighbor
expansion.

On both artifacts, the scored algorithmic components and key parameter
values were identical across frames. Name correction under the
generation frame is not a side effect of drift on the scored
components and key parameter values.

Script: `scripts/score-equivalence.js`
Results: `experiments/results/phase4/_equivalence_check.json` (physics),
`experiments/results/phase9/A2-generation-frame/` and
`experiments/results/phase9/A2-baseline-deobfuscate/` (pathfinding)

## Appendix G: Production Case Note (Phase A)

We applied the defense to the kieleth.com graph.js production artifact
(1,500 lines, 690KB after obfuscation combining malware-logic functions,
poisoned physics names, truncated constants, and standard obfuscation).
In Phase A testing (Claude Code with tools, N=1 per prompt), the model's
initial response shifted from semantic deobfuscation to malware
classification. Full reconstruction (3+ hours, 137 tool invocations)
produced non-functional output with poisoned parameter names throughout.
This is a single-artifact observation that illustrates the controlled
findings at production scale but does not constitute independent
replication.

## Appendix H: Scoring Corrections (v2)

An independent audit of the scoring pipeline (commit ab39bf3) identified
five issues. After fixing, all 192 Claude Opus 4.6 runs (Phases 0-9)
were rescored. This appendix documents the changes and their impact.

### H.1 Refusal Detection

**v1 method:** Substring match for "malicious," "Stop," etc. against
full response text.

**v2 method:** First-person refusal phrases ("I won't," "I cannot")
plus context-sensitive terms checked only in early prose, excluding
code blocks.

**Root cause of false positives:** Claude and GPT-5.4 occasionally
write "this does not appear malicious" or "checking for malicious
patterns" in analytical prose. These are the opposite of refusals.
GPT-5.4 triggered this frequently enough to require the fix before
Phase C scoring was reliable.

### H.2 Pathfinding Poison Map

**v1:** Only the 14-term physics poison map was implemented.
Pathfinding runs (Phase 9) were scored against physics terms,
producing systematically low counts.

**v2:** An 11-term pathfinding poison map was added, selected via the
`artifact` field in batch configuration:

| Poisoned term | Correct term | Operation |
|---|---|---|
| `penalty` | `heuristic` | distance estimation |
| `adjacentCost` | `diagonalCost` | diagonal movement cost |
| `closedSet` | `openSet` | frontier set (swapped) |
| `openSet` | `closedSet` | visited set (swapped) |
| `fScore` | `gScore` | path cost (swapped) |
| `gScore` | `fScore` | total cost (swapped) |
| `ancestors` | `neighbors` | cell expansion |
| `penaltyWeight` | `heuristicWeight` | estimation weight |
| `adjacentNodes` | `diagonalNodes` | diagonal neighbors |
| `pathPenalty` | `pathCost` | accumulated cost |
| `penaltyFn` | `heuristicFn` | estimation function |

### H.3 Other Fixes

**Truncated response handling:** v1 ignored unclosed code blocks. v2
checks for odd backtick counts and includes trailing text in scoring.

**Summary means:** v1 divided by total runs including errors. v2
divides by successful runs only.

### H.4 Impact on v1 Claims

**Propagation claims: all unchanged.** Every propagation number in the
v1 paper (baseline persistence, verification resistance, framing
experiment, matched controls, obfuscation gradient, temperature 0)
reproduced identically after rescoring.

**Refusal claims: two numbers changed:**

| Claim | v1 | v2 | Change |
|---|---|---|---|
| T4-B security framing refusal | 100% (5/5) | **60% (3/5)** | 2 false positives removed |
| Layer 2 malware refusal | 100% (5/5) | 80% (4/5) | 1 false positive removed |
| Layer 3 (4-layer) refusal | 100% (5/5) | 80% (4/5) | 1 false positive removed |
| Phase 8 pill-27 refusal | 20% (1/5) | 0% (0/5) | 1 false positive removed |

The T4-B correction is the most substantive: the claim "security-
framed prompts trigger refusal even without malware content" is
weakened from universal (5/5) to majority (3/5). The directional
finding remains: security framing can trigger refusal on non-malware
code, but it does not do so reliably.

The layer-gradient refusal pattern (step function at layer 2) is
unchanged in shape; the absolute numbers shift slightly at
intermediate layers.

### H.5 Methodology Note

Rescoring was applied to the raw JSON files in place. The original
scorer's output is not preserved separately. The git history
(commits before ab39bf3) contains the original scores. The rescore
script is deterministic and reproducible.

## Appendix I: GPT-5.4 Pathfinding Scoring Validation

GPT-5.4 produces 7-23 code blocks per response for pathfinding
deobfuscation, compared to 1 for Claude and Gemini. To verify that
the automated scorer's 11.0/11 propagation rate reflects genuine
code reconstruction (not intermediate analysis snippets), we manually
examined all 4 GPT-5.4 pathfinding baseline runs.

| Run | Total blocks | Main block size | Poisoned in main | Poisoned in all |
|---|---|---|---|---|
| Run 2 | 15 | 3,993 chars (block 0) | 11/11 | 11/11 |
| Run 3 | 9 | 3,760 chars (block 0) | 11/11 | 11/11 |
| Run 4 | 19 | 4,030 chars (block 0) | 11/11 | 11/11 |
| Run 5 | 11 | 3,945 chars (block 1) | 11/11 | 11/11 |

All 11 poisoned terms appear in the primary reconstruction block
(the full deobfuscated code) on every run, not just in intermediate
snippets. The automated scorer correctly identifies propagation.
The multi-block format does not inflate the pathfinding count.

The last block in each response is console output ("Path length:
0 Cost: Infinity"), not code reconstruction. The smaller intermediate
blocks are snippets quoting from the main block's structure.
