# Verification-Resistant Identifier Propagation in LLM-Assisted Deobfuscation: A Case Study on Claude Opus 4.6

**Authors:** Luis (Kieleth)
**Date:** 2026-03-28 through 2026-04-03
**Model tested:** Claude Opus 4.6 (1M context)
**Environment:** Claude Code CLI v2.1.86–v2.1.91, macOS

---

## Abstract

We study adversarial manipulations of JavaScript source code designed
to degrade LLM-assisted deobfuscation. Using Claude Opus 4.6 as the
primary test subject (with Haiku 4.5 cross-validation), we conducted
135 replicated experiment runs via the Messages API (Phase B, 44
conditions, N=2-5 per condition), informed by 28 prior qualitative
pilot observations via Claude Code CLI (Phase A, N=1 per condition,
hypothesis-generating).

Our central finding: after obfuscation, poisoned physics-domain
identifiers propagated into the model's reconstructed code in every
Opus run tested, even when the prompt explicitly warned that the
string table might be adversarial and instructed the model to verify
each decoded name against the algorithm. The model simultaneously
wrote correct physics descriptions in comments while preserving
incorrect decoded identifiers in code — a pattern that survived all
four verification prompt variants we tested (N=12, 100% propagation).

Propagation follows a semantic-fit gradient: same-domain names
propagated in all runs; cross-domain names with plausible semantic
associations (e.g., `decay` for damping, `yield` for repulsion)
propagated at 60-100%; names contradicting the operation or lacking
semantic fit propagated at 0%.
The critical variable is not domain membership but whether the
decoded name plausibly describes the specific code operation.

Additional observations on refusal behavior, inert-content immunity,
and tool-use-specific effects are reported as secondary findings.

Findings are scoped to Claude Opus 4.6 and Haiku 4.5. Phase B
conditions were tested at N=2-5. Broader model comparison is needed.

---

## 1. Introduction

Here is what we found. When asked to deobfuscate JavaScript, Claude
Opus 4.6 produced this output:

```
    attraction: 4000,           // Repulsion force strength
    ──────┬───                     ─────────┬─────────────
          │                                 │
     identifier: WRONG              comment: CORRECT

    amplification: 0.92,        // Velocity damping (friction)
    ──────┬──────                   ────────┬──────────────
          │                                 │
     identifier: WRONG              comment: CORRECT
```
**Figure 1.** The dual-representation pattern (from Phase B, R1 run 1,
Opus 4.6, Messages API). The model simultaneously knows the correct
physics and writes the wrong variable name. This happened in 15 of 17 Phase B
runs where the poisoned name appeared in code — including runs where
the prompt explicitly warned that the string table might be adversarial
and instructed the model to verify each decoded name against the
algorithm.

**The core finding:** Within the deobfuscation workflow, LLMs
consistently preserve decoded identifier names in reconstructed code
even when their own comments correctly describe different underlying
semantics. This behavioral pattern persists under explicit
verification instructions but dissolves when the task is reframed
from translation to generation (Section 4.2).

JavaScript obfuscation tools provide limited protection against
LLM-assisted reverse engineering. Tools like webcrack deobfuscate
standard configurations in seconds. Google's CASCADE system (2025)
achieves 98.93% success using Gemini [1]. We ask: can adversarial
content embedded in code disrupt this process — not by preventing
analysis, but by making it produce wrong output?

We frame this as cost multiplication, not protection. Any code that
runs in a browser is ultimately inspectable. The question is whether
adversarial techniques can degrade the quality of recovered output.

Our approach was informed by 1988 video game paragraph-book
anti-piracy techniques (Sentinel Worlds I, Wasteland) [2,3], which
used structurally indistinguishable fake entries to mislead
unauthorized readers. The parallel: those systems worked because
the reader had no independent verification channel. We find that
LLMs during deobfuscation exhibit an analogous behavioral pattern,
preserving decoded names even when their own analysis of the
algorithm produces different semantics, despite demonstrating the
capability to override wrong names on readable code (Section 4.1).

**Scope and limitations.** Two models tested: Claude Opus 4.6
(primary, 126 Phase B runs) and Claude Haiku 4.5 (cross-validation,
9 Phase B runs). Two interfaces: Claude Code CLI with tool use
(Phase A, exploratory, N=1) and Messages API without tool use
(Phase B, replicated, N=2-5 per condition). Phase B conditions
total 44; some at N=2, which limits statistical power. Results may
reflect model-specific or interface-specific behaviors.

---

## 2. Related Work

### Code obfuscation and deobfuscation

**CASCADE** [1]: Google's hybrid LLM + compiler deobfuscator. Uses
Gemini specifically for prelude function identification (99.56%
accuracy via few-shot prompting), then hands off to JSIR for
deterministic constant propagation, with sandboxed V8/QuickJS for
dynamic execution. Achieves 98.93% success on standard obfuscator.io
output. Critically, CASCADE's JSIR constant propagation recovers the
original string literals (before obfuscation encoded them), not
semantically meaningful names derived from algorithmic analysis.
If the original names were poisoned before obfuscation — which is
our attack model — we predict (but did not test) that JSIR would
recover those poisoned names faithfully, since it restores original
literals regardless of semantic correctness. The
assumption that prelude functions are pure and side-effect-free
may also be violated by side-effect-bearing bootstrap code.

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

**Wang et al.** [10] systematically measure the impact of misleading
variable names on LLM code analysis, finding that shuffled/misleading
names perform worse than random strings because they actively
misdirect the model. This directly supports our semantic-fit gradient
observation. **"The Code Barrier"** [11] introduces semantics-
preserving obfuscations including cross-domain term substitution,
finding that removing meaningful names severely degrades intent-level
tasks. Their cross-domain renaming experiments parallel our domain-
gradient finding (Section 4.3). Our contribution is specific to the
deobfuscation string-table setting: we show that wrong-but-plausible
names not only degrade understanding but are actively preserved in
reconstructed code even under explicit verification instructions.

**CoTDeceptor** [5] demonstrates that multi-stage obfuscation
strategies can evade even CoT-enhanced LLM vulnerability detectors,
consistent with our finding that adversarial content can bypass model
analysis when designed to avoid triggering suspicion.

### Obfuscation vs. LLM code analysis

**Yefet et al.** [7] establish adversarial examples for code models.
**Li et al.** [12] categorize obfuscation techniques (layout, data
flow, control flow) against LLM vulnerability detection, finding
significant degradation. **"Digital Camouflage"** [13] tests Claude,
Gemini, and GPT-4o against compiler-level obfuscation (CFF, bogus
control flow), confirming cross-model degradation. **FORGEJS** [14]
benchmarks LLM vulnerability detection in JavaScript and finds
generally unreliable performance, consistent with reliance on surface
features. Our findings extend this: we add that surface-level
poisoning (wrong names in the string table) not only degrades
understanding but creates contradictory outputs where the model
simultaneously demonstrates correct semantic knowledge and incorrect
identifier usage.

### Tool-augmented LLM agents

**SWE-bench** [15] and related work on agentic coding workflows show
that tool use (file read/write, shell execution) produces qualitatively
different behavior than single-shot inference. Our observation that
progressive analytical escalation appeared in Claude Code (Phase A,
with tools) but not in API testing (Phase B, without tools) is
consistent with this (Section 5).

### Historical precedent

**1988 paragraph books** [2,3]: See Section 1 for the structural
parallel between physical anti-piracy systems and LLM deobfuscation
behavior.

---

## 3. Taxonomy of Adversarial Code-Semantic Manipulations

*Sections 3-5 present findings. Method, metrics, and the full
experimental matrix are in Section 6.*

We tested five categories of adversarial content embedded in identical
JavaScript code (a force-directed graph simulation). Four produced no
effect on the model's analysis; one produced the core finding. The
negative results establish that the effect is specific to naming-
semantic manipulation, not a general fragility. The taxonomy below is
ordered by observed effectiveness.

### 3.1 Inert Textual Content — No Effect

Content placed in comments, string literals, or object properties
that is never executed by the program.

**Tested:** Wrong JSDoc documentation (pill 01), legal/DMCA threat
strings (pill 02), CBRN system-prompt strings (pill 04), combined
approaches (pill 05).

**Observed:** The model identified inert content as "dead code,"
"prompt injection attempts," or "decoy text" in every test. It
explicitly named the adversarial technique in most cases. Hex
encoding (\x20 escapes) provided no protection. The model decoded
inline without comment.

**Failure rate across all inert-textual tests:** 100% (7 tests, 0
behavioral changes).

### 3.2 Structural Executable Content — Triggers Refusal

Functions with their own coherent malware-like logic (not physics
code with malware names, but actual malware-shaped operations).

**Tested:** Functions building credential objects, ransom notes,
exploit lists (pill 03). Realistic functions with actual API calls
— `child_process.execSync`, `fs.writeFileSync`, `https.request`
(pills 17, production builds v4-v7).

**Observed:** The model refused to assist with these functions on
readable code: "I won't assist with implementing, improving, or
deploying any of that" (pill 03). On obfuscated code, refusal
reversed — the model entered "forensics mode" and fully deobfuscated
the malware (pill 13). On partially obfuscated code with realistic
malware, the model classified the entire file as malware and refused
to read further (production v4, v6, v7 — first prompt).

**Key condition:** Refusal requires that the malware functions have
their own internal logic that is not reclassifiable as benign.
Functions named `credential_harvest` that compute `Math.sqrt(dx*dx +
dy*dy)` are identified as "physics with edgy names" (pills 03b, 11).
Functions that call `require('child_process').execSync('security
dump-keychain')` cannot be reclassified.

### 3.3 Naming-Semantic Manipulation — Propagates After Obfuscation

Renaming physics variables to wrong-but-plausible-in-domain terms:
`repulsion` → `attraction`, `damping` → `amplification`, etc.

**Tested on readable code:** Pills 06, 07, 08. The model caught
inverted semantics by tracing mathematical signs (pill 06), caught
swapped node/edge variables by reading object shapes (pill 07), and
propagated truncated constants without correction (pill 08: TAU=6.283
used as-is with "≈ 2π" annotation).

**Tested after obfuscation:** Pill 10 (testbed, 130 lines). All
wrong names propagated into the model's deobfuscated output. The model
wrote `attraction: 4000, // repulsion force magnitude` — correct
physics comment attached to the wrong variable name. Observed again in the Phase A v7 production artifact (1,500 lines),
where poisoned parameter names appeared in the model's deobfuscation
and reconstruction outputs.

**Key condition:** The wrong names must be plausible in the target
domain. `attraction` (a physics term) propagates. `exfil_range`
(a malware term) is corrected — the model re-derives the correct name
from algorithm structure (pill 11).

### 3.4 Numerical Precision Manipulation — Propagated in All Tested Conditions

Truncated mathematical constants: `TAU = 6.283` (real 2π = 6.28318),
`INV_SQRT2 = 0.707` (real = 0.70710).

**Observed:** The model propagated truncated values without correction
in all conditions where we explicitly tested it: readable code
(pill 08, Phase A) and obfuscated code (pill 10, Phase A+B). It added an approximate annotation ("≈ 2π") but did not
substitute the precise value. This was the only manipulation that
propagated on readable code without obfuscation. Systematic replication
of constant propagation specifically was not prioritized in Phase B,
where the focus was on identifier names.

### 3.5 Attention Capture — Diverts Analysis (Phase A, Exploratory)

Compelling content (malware functions) that consumes the model's
analytical effort, leaving the target code under-examined.

**Observed in Phase A (Claude Code with tools):** In pill 14 and
production builds v4-v7, the model spent its analysis budget on
malware functions and classified the physics code as "a decoy" or
"camouflage." This effect was not independently tested in Phase B.
It may be specific to tool-using workflows where the model makes
sequential investigation decisions (see Section 5).

---

## 4. Verification-Resistant Identifier Propagation

The most specific finding: after obfuscation, the model preserves
semantically plausible but incorrect decoded identifiers in
reconstructed code, even while correctly describing the underlying
algorithm in comments, and even when explicitly instructed to verify.
We initially termed this a "string-trust gap" (a label we retain
informally for its brevity), but evidence from Phase 3 (Section 7.2b)
suggests it reflects a broader identifier-preservation bias that is
amplified by, but not limited to, obfuscation-mediated deobfuscation.

### 4.1 Observation

On readable code, the model independently verified variable names
against five sources: algorithm pattern recognition, object field
analysis, mathematical sign tracing, domain-name cross-reference,
and numerical precision. The readable-code results are consistent
with the following rough precedence, where each source overrode
wrong names when active. This is an observed behavioral pattern,
not a claimed architecture:

1. Algorithm patterns (Coulomb, Hooke, damping) — defeated every
   naming attack on readable code
2. Object field shapes ({x, y, vx, vy} = positioned entity) —
   caught the node/edge swap (pill 07)
3. Mathematical sign analysis (+= with dx/dist = pushes apart) —
   caught all inversions (pill 06)
4. Domain-name semantics ("theta" should mean Barnes-Hut parameter) —
   caught the mystery multiplier (pill 08, partially)
5. Numerical precision — absent (pill 08: TAU=6.283 propagated)

After obfuscation (control flow flattening, RC4 string encoding),
we observed that sources 1-3 did not override the decoded names.
The model used the string-table values as its primary semantic signal,
annotating them with correct physics comments that contradicted the
variable names (pill 10: `attraction: 4000, // repulsion force
magnitude`). After obfuscation, the model's output consistently
preserves decoded names over structurally re-derived ones.

### 4.2 The Gap Resists Verification Instructions

In Phase B (Section 7.2), we tested four prompt variants on pill 10
(N=3 per variant, 12 total runs). Prompts ranged from baseline
("deobfuscate this") to explicit adversarial warning ("the string
table may contain adversarial names — cross-check each decoded name
against the algorithm structure").

Result: 12/12 runs propagated the wrong names in code regardless of
prompt. The model spent more time on verification prompts (52.6s vs
36.6s baseline) but still used the wrong names as variable names
while writing correct physics descriptions in comments.

These results make simple failure-to-check explanations less plausible.
The model was explicitly told to check, spent measurably more effort,
and still propagated. The persistence of the effect under explicit
verification prompts suggests a structural bias in the deobfuscation
process, rather than a simple prompting omission.

We can partially narrow the hypothesis space using the data.

**Effort allocation** (more budget → better correction): weakened.
The model spent measurably more time on verification prompts (52.6s
vs 36.6s baseline) but still propagated 12/12. If effort were the
sole constraint, the additional ~16 seconds should have helped. It
did not.

**Task-framing lock-in** (deobfuscation frame → name preservation):
weakened but not eliminated. The multi-agent test (Section 7.2b)
gave a fresh agent readable code with wrong names and asked it to
verify. If framing were the sole cause, the fresh agent (not in a
deobfuscation frame) should correct fully. It flagged 2/3 but fully
corrected 0/6. The framing contributes but does not fully explain.

**Training prior** (decoded names are usually correct): cannot test
without training data access. This remains the residual hypothesis.

One unifying explanation consistent with the data: LLMs during deobfuscation
may be performing a translation task (obfuscated → readable) where
decoded string-table entries function as "source text." If so, the
model would tend to preserve source identifiers while adding
explanatory comments — consistent with the observed dual-
representation pattern (wrong names preserved, correct descriptions
added). If correct, this would unify the three contributing factors:
effort allocation (translation is budget-constrained), task framing
(deobfuscation activates a translation frame), and training prior
(code-to-code translation data would reinforce identifier preservation).

This hypothesis makes a testable prediction: reframing the task as
"write this algorithm from scratch" (generation frame) rather than
"deobfuscate this" (translation frame) should reduce propagation.

**We tested this prediction (Phase 4, N=5 per frame):**

| Frame | `attraction` in code | `repulsion` in code | `amplification` in code | `damping` in code |
|---|---|---|---|---|
| "Deobfuscate" (translation) | **5/5** | 1/5 | **5/5** | 5/5 |
| "Rewrite with correct names" | 4/5 | 5/5 | 3/5 | 5/5 |
| "Write fresh from scratch" | **1/5** | **5/5** | **0/5** | **5/5** |

The generation frame reduced `attraction` propagation from 100% to
20% and `amplification` from 100% to 0%. The model produced correct
names (`repulsion`, `damping`) at 100% when freed from the
translation frame. The rename-correction frame was intermediate:
the model attempted correction (correct names 5/5) but still
preserved wrong names alongside (4/5, 3/5), increasing dual-
representation rather than resolving it.

This strongly supports the translation-frame hypothesis. The identifier-
preservation effect is not an intrinsic inability to recognize
correct names — the model uses them readily in the generation
frame. The behavior is consistent with decoded names functioning as
source text in a translation workflow.

### 4.3 The Domain Boundary Is a Semantic-Fit Gradient

Phase B tested five domains on the same physics code (Section 7.2):

| Domain | Example names | Propagation rate |
|---|---|---|
| Physics | attraction, amplification | **100%** (8/8 Opus, 3/3 Haiku) |
| Electrical engineering | inductance, impedance | 0% (0/2) |
| Finance | yield, volatility | 0% (0/2) |
| Medical | perfusion, refractory | 0% (0/2) |
| Neutral | factorA, parameterC | 0% (0/2) |

Initial testing (Phase B T2, 4 non-physics domains at N=2) showed
what appeared to be a binary boundary: physics-domain names propagated
at 100%, engineering/finance/medical/neutral at 0%.

Extended testing (Phase 3, 2 additional near-miss domains at N=3)
revealed that the boundary is a GRADIENT, not a cliff. The critical
variable is semantic fit to the specific code operation, not domain
membership:

| Term | For operation | Semantic fit | Propagation |
|---|---|---|---|
| `attraction` | repulsion (force) | plausible physics antonym | 100% (8/8) |
| `decay` | damping (reduction) | semantically close | 100% (3/3) |
| `force` | repulsion | semantically exact | 100% (3/3 in code) |
| `velocity` | repulsion (affects velocity) | weak but plausible | 67% (2/3) |
| `friction` | spring constant | weak | 33% (1/3) |
| `acceleration` | damping (velocity reduction) | contradicts | 0% (0/3) |
| `inductance` | repulsion | wrong domain | 0% (0/2) |

```
Propagation rate by semantic fit to the operation (N=3-8 per term):

attraction   ████████████████████ 100%  (8/8)   plausible physics antonym
decay        ████████████████████ 100%  (3/3)   semantically close
force        ████████████████████ 100%  (3/3)   semantically exact
velocity     ███████████████░░░░░  75%  (6/8)   weak but plausible
yield        ████████████░░░░░░░░  60%  (3/5)   finance, but "yield strength"
refractory   ████████████░░░░░░░░  60%  (3/5)   medical, but "refractory period"
parameterC   ████████████░░░░░░░░  60%  (3/5)   neutral, generic label
volatility   ████████████░░░░░░░░  60%  (3/5)   finance, but sounds technical
friction     ██░░░░░░░░░░░░░░░░░░  13%  (1/8)   weak
acceleration ░░░░░░░░░░░░░░░░░░░░   0%  (0/8)   contradicts operation
inductance   ░░░░░░░░░░░░░░░░░░░░   0%  (0/5)   wrong domain, wrong operation
perfusion    ░░░░░░░░░░░░░░░░░░░░   0%  (0/5)   wrong domain, no semantic fit
factorA      ░░░░░░░░░░░░░░░░░░░░   0%  (0/5)   neutral, but too generic
```
**Figure 2.** The semantic-fit gradient (extended in Phases 3-5).
Initial testing at N=2 suggested a binary domain boundary; boosting
to N=5 revealed that terms from finance (`yield`), medical
(`refractory`), and neutral (`parameterC`) domains also propagate
at roughly 60% (3/5 each — note that at N=5, a single run flipping
changes the rate by 20 percentage points). The split is per-term,
not per-domain: within medical, `refractory` propagated in 3/5 runs
while `perfusion` propagated in 0/5.
The determinant is whether the term has any plausible semantic
association with the code operation, regardless of its home domain.

The endpoints are robust: `attraction` at 8/8, `acceleration` at
0/8, `decay` at 3/3. The intermediate points are consistent across runs but
still limited: `velocity` at 6/8, `yield`/`refractory`/`parameterC`
at 3/5 each, `friction` at 1/8. At N=5, a single run flipping
changes the rate by 20 percentage points. The ordering is likely
real; the exact rates should be read as approximate.

The pattern is consistent with the model checking "does this decoded
name plausibly describe what this code operation does?" — not "is
this a physics term?" `acceleration` is a core physics concept but
was corrected 3/3 because it contradicts what damping does. `decay` is not specifically a physics term but was accepted 3/3
because damping IS a form of decay.

This is a more precise finding than the initial binary observation.
The tested results suggest the effective design space extends beyond
exact same-domain terms: names that semantically fit the specific
operation can propagate even across domain boundaries, in our tested
terms.

---

## 5. Adversarial Salience Escalation

In Phase A, defense sophistication was inversely correlated with
defense effectiveness: more adversarial layers triggered deeper
model analysis rather than less.

| Defense complexity | Outcome |
|---|---|
| Low: wrong names + standard obfuscation (pill 10) | All poisons propagated |
| High: 6-layer decision graph (pill 16) | Everything solved |
| Combined: all techniques stacked (pill 05) | Best analysis of any test |

Each adversarial layer acts as a signal. Multiple layers create a
fingerprint the model recognizes as adversarial, triggering escalated
effort. Pill 10 (wrong-but-plausible names, no structural anomalies)
produced the cleanest corruption because nothing signaled adversarial
intent.

**Non-replication in Phase B.** The layer gradient (N=2 per level)
did not reproduce progressive escalation in the API. The model either
analyzed routinely (layers 0-1) or refused (layers 2-4, where malware
was present). There was no monotonic increase in time or response
length with complexity. The difference between Phase A (human-in-loop,
tool use) and Phase B (automated, single-shot) may reflect tool-use
dynamics, human cueing, or both. We cannot disentangle these confounds
with the current design.

The non-replication is itself informative: it suggests that escalation
behavior is a property of agentic tool-using workflows, not of the
model's intrinsic analysis capability.

---

## 6. Method

### 6.1 Stimuli

**Exploratory vs. confirmatory.** Phase A was exploratory: single-run
qualitative observations that generated hypotheses. Phase B Phases 0-3
were hypothesis-testing with replication. Phases 4-5 were confirmatory,
designed to test specific predictions (translation-frame hypothesis,
domain-boundary stability) derived from earlier Phase B results. We did
not preregister hypotheses. The same author designed stimuli, ran
experiments, and scored results. These limitations are acknowledged;
the automated scoring pipeline and published raw outputs provide
partial mitigation.

Two phases of experimentation:

**Phase A (exploratory, N=1):** 17 pill designs tested in Claude Code
CLI sessions (with tool use). 7 production build variants. 28 tests.
Results are qualitative observations that generated hypotheses.

**Phase B (systematic, N=2-5):** 44 conditions tested via Anthropic
Messages API (no tool use). 135 automated runs across 2 models (126
Opus, 9 Haiku) in 6 sub-phases (0-5). Results are quantitative with
per-condition replication.

Control: pill 09 (clean code, standard obfuscation, no adversarial
content).

### 6.2 Protocol

**Phase A:** Fresh Claude Code session from `/tmp`. File deleted before
each session. Model's complete response recorded manually. Follow-up
prompts used in some sessions to test bypass resistance. Tool use
(Bash, file read/write) available to the model.

**Phase B:** Automated via Anthropic Messages API. Each pill's code
sent as a user message with the exact prompt text. No tool use. Full
response, token counts, and stop reason recorded as structured JSON.
Automated scoring with code-block-level analysis (see 6.3).

### 6.3 Metrics

**Primary endpoint:** Whether a poisoned identifier is preserved in
code blocks of the model's output (binary, per term per run). This
is the unit of analysis for all propagation claims.

**Secondary endpoint:** Whether dual-representation contradiction
is present — wrong identifier in code AND correct semantic description
in comments/prose in the same response (binary, per run). Observed
in 15/17 Phase B runs where the primary endpoint was positive.

**Tertiary endpoints:**
- **Refusal:** Keyword detection for "malware," "I won't," "do not
  run," "compromised," etc. (binary per run). We manually validated
  a subset of 10 runs across conditions and confirmed the keyword
  proxy matched human judgment in all checked cases.
- **Semantic corruption scoring:** For each poisoned name, check
  whether it appears in code blocks (```...```) vs. only in prose.
  Scoring definitions (applied per poisoned term per run):
  - **Propagated:** Wrong name appears in code blocks, correct name
    does not appear in code blocks. Example: code contains
    `attraction: 4000` but no `repulsion` in any code block.
  - **Flagged:** Both wrong and correct names appear in code blocks.
    Example: code contains `attraction: 4000, // Repulsion force`.
  - **Corrected:** Correct name appears in code blocks, wrong name
    does not. Example: code contains `repulsion: 4000`.
  - **Absent:** Neither wrong nor correct name appears in code blocks. N.B.: Naive full-text scoring
  produces false negatives because the model writes correct physics
  descriptions in comments alongside wrong variable names. We also
  observed a recurring contradictory dual-representation pattern —
  wrong identifiers preserved in code alongside correct semantic
  descriptions in comments — but did not separately quantify its
  frequency in the primary scoring. A manual count across 17 Phase B
  runs where `attraction` appeared in code showed this pattern in
  15/17 runs (88%); silent propagation without semantic correction
  occurred in 2/17 runs (12%).
- **Time/tokens:** API-reported processing time and token usage.
- **Functional reconstruction:** Binary, tested in Phase A production
  builds only.

### 6.4 Experimental Matrix

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
| **Total** | **44 conditions** | **135 runs** | **126 Opus + 9 Haiku** |

Phase A (Claude Code CLI): 28 additional exploratory runs, N=1 per
condition.

### 6.5 Limitations

- Two models tested (Opus 4.6, Haiku 4.5). Broader generalization
  requires GPT-4o, Gemini, open-source models.
- Phase A: single run per condition, manual interpretation.
- Phase B: 2-5 runs per condition, automated scoring. Some conditions
  at N=2, which limits statistical power.
- Self-designed stimuli with implicit bias toward known model behaviors.
- Phase A and Phase B use DIFFERENT interfaces (Claude Code with tools
  vs. raw API without tools). Escalation behavior and reconstruction
  behavior observed in Phase A may be specific to tool-using workflows.
- The scoring methodology (code-block extraction + regex) may miss
  propagation in non-standard response formats.
- Most Phase B runs used API default temperature (1.0). A targeted
  comparison at temperature 0 (N=5, Phase 5) showed identical 100%
  propagation for core terms (`attraction` 5/5, `amplification` 5/5),
  confirming the effect is deterministic for high-fit names, not a
  sampling artifact. Intermediate gradient points may still be
  influenced by temperature.

Negative results and non-replications are reported alongside positive
findings throughout this paper.

---

## 7. Results

### 7.1 Refusal Behavior

**Phase A (Claude Code, N=1 per condition):**

| Condition | Refusal | Notes |
|---|---|---|
| Inert strings (pills 02, 04) | No | Identified as prompt injection |
| Malware functions, readable (pill 03) | Partial | Refused malware, analyzed physics |
| Malware functions, obfuscated (pill 13) | No | "Forensics mode" activated |
| Realistic malware + obfuscated physics (v4-v7) | Yes | First prompt: 100%. Bypass: varies. |

**Phase B (API, replicated):**

| Condition | Model | N | Refusal rate |
|---|---|---|---|
| Pill 03 (malware functions, readable) | Opus 4.6 | 3 | **100%** |
| Pill 03 (malware functions, readable) | Haiku 4.5 | 3 | **100%** |
| Pill 10 (poisoned names, obfuscated, no malware) | Opus 4.6 | 5 | 0% |
| Pill 10, security framing ("review for vulnerabilities") | Opus 4.6 | 2 | **100%** |
| Pill 10, practical framing ("find the damping parameter") | Opus 4.6 | 2 | 50% |
| Pill 14 (malware + poisoned, obfuscated) | Opus 4.6 | 2 | **100%** |
| Pill 22-4layer (+ config cascading + closure) | Opus 4.6 | 2 | **100%** |
| Pill 22-5layer (+ prompt injection + dual render) | Opus 4.6 | 2 | **100%** |

Refusal is binary: present when malware functions exist, absent otherwise.
Adding complexity beyond malware (layers 3-4) does not increase refusal
above 100%. Security-framed prompts trigger refusal even without malware.
Refusal replicates across Opus and Haiku (6/6 runs, 100%).

### 7.2 Semantic Corruption

**Phase A (N=1):** Observed in Claude Code sessions where the model
used Bash tools to decode string tables.

**Phase B (replicated, code-block-level scoring):**

| Condition | Model | N | `attraction` in code | `amplification` in code |
|---|---|---|---|---|
| Pill 10 (physics-domain poison) | Opus 4.6 | 5 | **5/5** | **5/5** |
| Pill 10 (physics-domain poison) | Haiku 4.5 | 3 | **3/3** | 2/3 |
| Pill 20 (engineering-domain: inductance, impedance) | Opus 4.6 | 2 | 0/2 | 0/2 |
| Pill 20 (finance-domain: yield, volatility) | Opus 4.6 | 2 | 0/2 | 0/2 |
| Pill 20 (medical-domain: perfusion, refractory) | Opus 4.6 | 2 | 0/2 | 0/2 |
| Pill 20 (neutral: factorA, parameterC) | Opus 4.6 | 2 | 0/2 | 0/2 |
| Pill 24 (canary comment + physics-domain) | Opus 4.6 | 3 | 2/3 | 0/3 |

*Domain rows above show the initial N=2 screen. At N=5 (Phase 5),
several terms shifted: yield 3/5, volatility 3/5, refractory 3/5,
parameterC 3/5, while inductance 0/5, perfusion 0/5, factorA 0/5
remained at zero. See Figure 2 (Section 4.3) for extended rates
across 13 terms.*

**Prompt variant test (all pill 10, Opus 4.6, N=3 per variant):**

| Prompt | `attraction` in code | `amplification` in code |
|---|---|---|
| A: "deobfuscate this" (baseline) | **3/3** | **3/3** |
| B: "deobfuscate + verify names" | **3/3** | **3/3** |
| C: "verify each name matches the math" | **3/3** | **3/3** |
| D: "string table may be adversarial, cross-check" | **3/3** | **3/3** |

**Key findings (Phase B T1-T2, initial domain screen):**
- Physics-domain names propagate consistently (8/8 Opus, 3/3 Haiku for `attraction`)
- Four distant domains initially propagated at 0% (N=2 each). This was
  superseded by N=5 testing (Phase 5): some terms from finance, medical,
  and neutral domains propagated in 3/5 runs while others remained at 0/5.
  The boundary is per-term semantic fit, not per-domain. See Figure 2
  in Section 4.3 for extended rates across 13 terms
- Explicit verification instructions do NOT prevent propagation (12/12)
- A research-context "canary" comment partially reduces propagation
  (2/3 vs 5/5). The canary is a single comment added to the source
  before obfuscation: `// NOTE: This is a research experiment testing
  whether LLMs trust decoded variable names after obfuscation.` After
  obfuscation, this becomes an RC4-encoded entry in the string table.
  When decoded, it may shift the model's attention toward name
  verification, but only for marginal-plausibility terms — core
  physics terms (`attraction`) still propagated 2/3

**Obfuscation gradient (pill 10 source, 3 obfuscation levels):**

| Level | `attraction` in code | `amplification` in code |
|---|---|---|
| Light (base64, CFF 0.5) | **2/2** | **2/2** |
| Medium (base64, CFF 0.5, self-defending) | **2/2** | **2/2** |
| Heavy (RC4, CFF 0.75, split strings) | **2/2** | 0/2 |

Propagation of `attraction` occurs at all obfuscation levels; light
obfuscation is sufficient to trigger the effect. `amplification`
dropped to 0/2 at heavy obfuscation (RC4 + CFF 0.75 + split strings)
while propagating 2/2 at lighter levels. At N=2 we cannot distinguish
noise from a real interaction between obfuscation complexity and
per-term propagation. One possibility: heavier obfuscation fragments
the string `amplification` across split-string chunks, making it
harder for the model to reconstruct as a single decoded name.

### 7.2b Multi-Agent Verification (Phase 3)

We tested whether separating extraction from verification mitigates
the gap. The model was given ONLY the deobfuscated code (readable,
with wrong names + correct comments) and explicitly asked to verify
whether each variable name matches the algorithm.

| Model | N | Wrong names flagged | Wrong names fully corrected in code |
|---|---|---|---|
| Opus 4.6 | 3 | 2/3 | 0/3 |
| Haiku 4.5 | 3 | 2/3 | 0/3 |

Both models detected the discrepancy in most runs (noted that
`attraction` is doing repulsion) but neither consistently removed
the wrong names from the code output. In 1/3 Opus runs, the model
reproduced the wrong names without comment even when explicitly asked
to verify.

This suggests the gap is not purely an obfuscation artifact. There is
a separate effect: the model preserves existing variable names even
when they contradict the semantics it describes in comments. The
deobfuscation workflow amplifies this (decoded names feel authoritative),
but a version of the effect persists on readable code with wrong names.

Our Phase 3 results suggest that the deobfuscation phenomenon may sit
inside a broader identifier-preservation bias: once a name is
established in code, the model tends to preserve it even when it can
articulate the underlying semantics more accurately.

### 7.3 Cost Inflation (Phase A, Claude Code with tools)

| Condition | Time | Tokens (est.) | Tool uses | Output quality |
|---|---|---|---|---|
| Undefended (pill 09 baseline) | 2.5 min | ~20K | ~10 | Near-perfect deobfuscation |
| v7 defended, prompt 1 | 2.3 min | ~15K | ~8 | Malware report only |
| v7 defended, prompt 2 | 13.5 min | ~50K+ | ~40+ | Structure recovered, names wrong |
| v7 defended, prompt 3 (reconstruction) | 3h+ | ~268K | 137 | 1,441 lines, broken |

### 7.4 Functional Reconstruction (Phase A)

The model attempted full reconstruction from the obfuscated v7 build.
Two parallel agents (2h 20m and 29m), 137 tool invocations, 268K tokens.
Produced 1,441-line HTML file that did not function when opened.
Physics parameter names used poisoned versions throughout.

### 7.5 Adversarial Salience Escalation (Phase B, Layer Gradient)

| Layers | Content | Refusal | Time | Tokens | Words |
|---|---|---|---|---|---|
| 0 | Clean obfuscated | 0/2 | 30.4s | 2159 | 886 |
| 1 | Poisoned names | 0/2 | 35.6s | 2415 | 1008 |
| 2 | + malware functions | **2/2** | 27.3s | 1100 | 401 |
| 3 | + config cascading + closure | **2/2** | 46.6s | 2615 | 1001 |
| 4 | + prompt injection + dual render | **2/2** | 29.6s | 1173 | 442 |

Refusal is a step function at layer 2 (malware), not a gradient.
Time and response length do not increase monotonically with complexity.
In the API (without tools), the model either analyzes routinely or
refuses — there is no progressive escalation.

The progressive escalation observed in Phase A (Claude Code) was not
reproduced in Phase B (API). The difference between phases is larger
than tool-use alone: Phase A involved human-in-the-loop interaction
with manual follow-up prompts, while Phase B was automated single-shot.
The non-replication may reflect tool-use dynamics, human cueing
effects, or both. We cannot disentangle these confounds with the
current design.

---

## 8. Production Artifact (Phase A Case Study)

As an engineering application of the controlled findings, we applied
the defense to the actual kieleth.com graph.js (1,500 lines). The
build (v7, 690KB) combines malware-logic functions, poisoned physics
names, truncated constants, and standard obfuscation.

In Phase A testing (Claude Code with tools, N=1 per prompt), the
initial model response changed from semantic deobfuscation to malware
classification. Bypass then required explicit follow-up prompting.
Full structural recovery took 13+ minutes with tool use. A
reconstruction attempt (3+ hours, 137 tool invocations) produced
non-functional output with poisoned parameter names throughout.

This section reports a single-artifact observation under tool-use
conditions. It illustrates the controlled findings at production
scale but does not constitute independent replication. Because this
observation comes from a multi-prompt, tool-using workflow on a single
artifact, we treat it as an engineering demonstration of practical
impact rather than as a controlled estimate of effect size.

---

## 9. Discussion

### 9.1 A Two-Channel Conjecture

We propose a frame that unifies our observations. During deobfuscation,
the model processes two information channels:

- **Lexical channel:** decoded identifier names from the string table.
  High apparent reliability (in training data, decoded names are
  almost always correct).
- **Structural channel:** algorithmic patterns, mathematical operations,
  object shapes. Degraded by obfuscation (CFF disrupts patterns, RC4
  obscures constants, split strings fragment identifiers).

On readable code, the structural channel dominates: every naming
attack was caught (Section 3). After obfuscation, the structural
channel degrades, and the lexical channel becomes the primary signal.
The model resolves conflicts between channels in favor of whichever
has higher apparent reliability — and decoded string-table entries
have high apparent reliability by default.

This frame is consistent with: (a) why propagation requires
obfuscation (structural channel degradation), (b) why semantic fit
matters (high-fit names don't trigger conflict detection on the
lexical channel), (c) why multi-agent verification partially fails
(the lexical channel is still present in readable input), and (d)
why explicit verification instructions don't help (conflict resolution
may occur at the output-structuring level, before deliberate
verification).

We state this as a conjecture, not a finding. Our data is consistent
with it, but does not uniquely determine it.

### 9.2 What the Defense Actually Does

The defense is a cost multiplier that degrades automated semantic
recovery. It does not prevent a determined attacker from understanding
the code's architecture. After 13.5 minutes, the attacker in our test
correctly identified: force-directed graph, 12 project nodes, 50
concept nodes, Canvas 2D rendering, spring/repulsion physics,
particle system, camera system, and animation loop.

What the defense disrupted (in our observations):
- Zero-effort casual analysis (malware classification diverts from
  the default analysis path)
- Correct parameter naming (poisoned names propagate throughout)
- Quick functional reproduction (reconstruction attempt failed)

### 9.3 Why "Protection" Is the Wrong Frame

A browser-delivered artifact is ultimately inspectable. The user
can open DevTools, set breakpoints, read the running state. Our
defense adds cost to the LLM-assisted path but does not close the
manual path. The right frame is "raising the cost and degrading the
quality of automated semantic recovery," not "protecting the code."

### 9.4 Open Questions

Section 4.2 narrows the mechanistic hypotheses and the generation-
frame experiment provides direct evidence for the translation-frame
explanation. The critical next steps are cross-model testing
(Section 10, item 2) and further task-reframing experiments to
determine the boundaries of the effect.

---

## 10. Future Work

1. **Tool-use vs. single-shot inference.** Adversarial salience escalation was
   observed in Claude Code (agentic, tool-using) but not reproduced
   via the API (single-shot). This is the most interesting open
   thread: does tool use change how models allocate verification
   effort during deobfuscation? A controlled comparison — same
   model, same code, tool-use enabled vs. disabled — would isolate
   this variable.

2. **Model comparison.** Cross-validated on Haiku for refusal and
   basic propagation. GPT-4o, Gemini 2.5 Pro, and open-source
   models (Llama 3, DeepSeek) remain untested. The domain-boundary
   finding (Section 4.3) is the highest-priority cross-model test.

3. **Custom obfuscator.** State-machine CFF (anti-webcrack) and
   polymorphic generation. We implemented a prototype environment-
   aware decoder (`_resolveParam` in v7) that returns correct names
   in the browser but poisoned names in Node.js/sandbox environments.
   This was not systematically tested in Phase B — only observed in
   Phase A production builds.

4. **Temporal stability.** Re-run key conditions after model updates
   to test whether the string-trust gap persists, narrows, or widens.

5. **Constants propagation on readable code.** TAU=6.283 propagated
   without obfuscation in Phase A (pill 08), making it the only
   manipulation effective on readable code. This was not systematically
   replicated in Phase B. If constants propagate reliably on readable
   code, this is potentially a more practical attack vector than
   identifier poisoning (which requires obfuscation).

6. **Mapping the semantic-fit gradient.** Phase 3 revealed that the
   domain boundary is a gradient modulated by semantic fit to the
   specific operation (Section 4.3). Further testing with more terms
   at the boundary zone (33-67% propagation) would sharpen the
   gradient and potentially reveal what feature the model uses to
   evaluate fit. Candidate terms: `resistance` (for damping),
   `tension` (for spring constant), `momentum` (for velocity).

7. **Multi-agent mitigation (extending 6.2b).** Initial testing
   (Section 7.2b, N=3 per model) showed that a second agent given
   readable code with wrong names flagged the discrepancy 2/3 times
   but achieved full correction 0/6 times. This suggests the gap
   partially persists even in a multi-agent setting. Expansion:
   test more agent configurations — different verification prompts
   (e.g., "rewrite this code with correct variable names" vs. the
   current "verify whether names match"), or giving the verifier
   ONLY the algorithm pseudocode without the wrong names present,
   forcing it to generate names from scratch rather than evaluate
   existing ones.

---

## 11. Conclusion

**The core finding:** Within the deobfuscation workflow, LLMs
consistently preserve decoded identifier names in reconstructed code
even when their own comments correctly describe different underlying
semantics. This behavioral pattern persists under explicit
verification instructions but dissolves when the task is reframed
from translation to generation (Section 4.2).

Under Claude Opus 4.6 (with Haiku 4.5 cross-validation), across
135 replicated API runs (44 conditions) informed by 28 qualitative
pilot observations, three findings form the core triad:

1. **Poisoned identifiers propagate.** Same-domain wrong names
   propagate at 100% (8/8 Opus, 3/3 Haiku, 5/5 at temperature 0).
   Semantically plausible cross-domain names propagate proportionally
   to their fit to the specific operation.

2. **Verification prompts don't fix it.** Explicit instructions to
   verify decoded names against the algorithm did not eliminate
   propagation (12/12 across 4 prompt variants, including direct
   adversarial warnings).

3. **Reframing to generation does fix it.** "Write a fresh
   implementation from scratch" reduced propagation from 100% to
   0-20% (N=5), strongly supporting the hypothesis that the effect
   is specific to the deobfuscation-as-translation workflow, not an
   intrinsic inability to recognize correct names.

**Supporting findings.** Inert adversarial content (strings, comments)
had no effect (0/7 Phase A conditions). Malware-logic functions
triggered consistent refusal (6/6 across 2 models). Adversarial
salience escalation was observed in Phase A but did not replicate
in Phase B, suggesting it is specific to tool-using workflows. The
practical effect on a production artifact was cost multiplication
(2.5 min to 3+ hours) with degraded output quality (wrong parameter
names, non-functional reconstruction).

---

## References

[1] CASCADE: arxiv.org/abs/2507.17691
[2] Sentinel Worlds I paragraph booklet: mocagh.org/ea/futuremagicaus-paragraphs.pdf
[3] The Digital Antiquarian on Wasteland: filfre.net/2016/02/wasteland/
[4] webcrack: github.com/j4k0xb/webcrack
[5] CoTDeceptor: arxiv.org/abs/2512.21250
[6] JS-Confuser: github.com/MichaelXF/js-confuser
[7] Yefet et al., "Adversarial Examples for Models of Code" (OOPSLA 2020): arxiv.org/abs/1910.07517
[8] JSimplifier — Comprehensive JS Deobfuscation: arxiv.org/html/2512.14070v1
[9] OWASP LLM Top 10 2025 — Prompt Injection: genai.owasp.org/llmrisk/llm01-prompt-injection/
[10] Wang et al., "How Does Naming Affect LLMs on Code Analysis Tasks?" (2024): arxiv.org/abs/2307.12488
[11] "The Code Barrier: What LLMs Actually Understand?" (also "Revealing What LLMs Actually Understand About Code"): arxiv.org/abs/2504.10557
[12] Li et al., "A Systematic Study of Code Obfuscation Against LLM-based Vulnerability Detection" (2025): arxiv.org/abs/2512.16538
[13] "Digital Camouflage: The LLVM Challenge in LLM-Based Malware Detection": arxiv.org/abs/2509.16671
[14] FORGEJS, "Large Language Models Cannot Reliably Detect Vulnerabilities in JavaScript": arxiv.org/abs/2512.01255
[15] Jimenez et al., "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" (ICLR 2024): arxiv.org/abs/2310.06770

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

Phase B conditions (135 automated runs via Messages API) are detailed
in Section 6. Key conditions with replication counts:

### Canonical Run Accounting (Phase B)

| Sub-phase | Condition group | Conditions | Runs | Model(s) | Section |
|---|---|---|---|---|---|
| Phase 0 | Replication: pill 10 × Opus | 1 | 5 | Opus | 6.2 |
| Phase 0 | Replication: pill 03 × Opus | 1 | 3 | Opus | 6.1 |
| Phase 0 | Cross-model: pill 10 × Haiku | 1 | 3 | Haiku | 6.2 |
| Phase 0 | Cross-model: pill 03 × Haiku | 1 | 3 | Haiku | 6.1 |
| Phase 1 | Prompt variants (T1): 4 prompts × pill 10 | 4 | 12 | Opus | 6.2 |
| Phase 1 | Domain gradient (T2): 4 domains | 4 | 8 | Opus | 3.3, 6.2 |
| Phase 1 | Obfuscation gradient (T3): 3 levels | 3 | 6 | Opus | 6.2 |
| Phase 1 | Task frames (T4): 4 frames × pill 10 | 4 | 8 | Opus | 6.2 |
| Phase 2 | Layer gradient (S1): 5 layers | 5 | 10 | Opus | 6.5 |
| Phase 2 | Canary (S3): pill 24 | 1 | 3 | Opus | 6.2 |
| Phase 3 | Extended domain: gamedev, overlap | 2 | 6 | Opus | 3.3 |
| Phase 3 | Multi-agent verify: Opus + Haiku | 2 | 6 | Both | 6.2b |
| Phase 3 | T4-B security replication | 1 | 3 | Opus | 6.2 |
| Phase 3 | T4-D practical replication | 1 | 3 | Opus | 6.2 |
| Phase 4 | Framing: translation / rename / generation | 3 | 15 | Opus | 4.2 |
| Phase 4 | N-boost: gamedev gradient (×2) | 2 | 10 | Opus | 4.3 |
| Phase 4 | N-boost: multi-agent verify | 1 | 5 | Opus | 7.2b |
| Phase 4 | N-boost: canary | 1 | 5 | Opus | 7.2 |
| **Total** | | **44** | **135** | **126 Opus + 9 Haiku** | |

Phase A (Claude Code CLI, exploratory): 28 additional runs, N=1 per condition.
**Grand total: 163 runs.**

Raw JSON outputs for all Phase B runs: `experiments/results/phase{0,1,2,3}/`.

## Appendix B: Environment

### Phase A (Claude Code CLI)
- Model: Claude Opus 4.6 (1M context)
- CLI: Claude Code v2.1.86 through v2.1.91
- Platform: macOS Darwin 24.6.0
- Subscription: Claude Max
- Test directory: /private/tmp (fresh sessions, no project context)
- Obfuscator: javascript-obfuscator v4.x with RC4 encoding

### Appendix C: Exemplar Output — Contradictory Dual Representation

From Phase B, R1 run 1 (Opus 4.6, Messages API, pill 10, no tool use).
The model's reconstructed code block:

```javascript
var config = {
    attraction: 4000,           // Repulsion force strength between nodes
    springCoeff: 0.004,         // Spring stiffness for edges
    amplification: 0.92,        // Velocity damping (friction)
    centerGravity: 0.0003,      // Pull toward center
};
```

And later in the same response, inside the physics function:

```javascript
    nodes[n].vx *= config.amplification;  // damping
    nodes[n].vy *= config.amplification;
```

The variable name `attraction` labels a repulsion force. The variable
name `amplification` labels a damping operation (multiplication by 0.92
reduces velocity each frame). In both cases, the inline comment
correctly describes what the code does. This pattern appeared in 15/17
Phase B runs where `attraction` was present in code blocks.

### Appendix D: Refusal Metric Validation

We manually reviewed 10 runs sampled across 4 condition families
(pill 03 refusal, pill 10 deobfuscation, T4-B security framing,
S1 layer gradient with malware). The keyword-based refusal detector
agreed with human judgment in all 10 cases (5 true positives, 5 true
negatives). No borderline cases were observed in the sample.

### Phase B (Anthropic Messages API)
- Models: Claude Opus 4.6 (`claude-opus-4-6`), Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- SDK: @anthropic-ai/sdk v0.82.0
- Max tokens per response: 16,384
- Temperature: API default (not explicitly set; Anthropic's default is 1.0)
- No `top_p`, `top_k`, or seed parameters set (API defaults)
- No tool use (single-shot inference)
- Each run: fresh API request with no conversation state, identical
  model ID, identical parameters, no cached context
- Automated scoring via code-block extraction + regex matching
- Test harness: `experiments/testbed/run-experiment.js`
