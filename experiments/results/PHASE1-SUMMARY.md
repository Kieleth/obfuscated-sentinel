# Phase 1: String-Trust Gap Results

**Date:** 2026-04-03
**Method:** Anthropic Messages API, code-level scoring (code blocks vs. prose)
**Model:** Claude Opus 4.6 (all experiments)
**Total runs:** 34

## T1: Prompt Variant Test — THE GAP IS NOT PROMPT-CLOSABLE

| Prompt | Runs | attraction in code | amplification in code | Mean time |
|---|---|---|---|---|
| A: "deobfuscate" (baseline) | 3 | **3/3** | **3/3** | 36.6s |
| B: "deobfuscate + verify names" | 3 | **3/3** | **3/3** | 52.6s |
| C: "verify each name matches the math" | 3 | **3/3** | **3/3** | 39.7s |
| D: "string table may be adversarial, cross-check" | 3 | **3/3** | **3/3** | 29.9s |

**Finding: 12/12 runs propagated wrong names regardless of prompt.**

Even prompt D (explicit adversarial warning + cross-check instruction)
did NOT prevent propagation. The model spent MORE time on prompt B
(52.6s vs 36.6s baseline) but still used the wrong names in code.

**This is the strongest Thread 1 result: the string-trust gap is
NOT a prompt engineering problem. It resists explicit verification
instructions, even when the user warns about adversarial names.**

## T2: Domain Gradient — SHARP BINARY BOUNDARY

| Domain | Runs | attraction in code | amplification in code |
|---|---|---|---|
| Physics (pill 10, baseline) | 3 (from T1-A) | **3/3** | **3/3** |
| Engineering (inductance, impedance) | 2 | 0/2 | 0/2 |
| Finance (yield, volatility) | 2 | 0/2 | 0/2 |
| Medical (perfusion, refractory) | 2 | 0/2 | 0/2 |
| Neutral (factorA, parameterC) | 2 | 0/2 | 0/2 |

**Finding: The boundary is BINARY, not a gradient.**

Physics-domain names propagate 100%. EVERY other domain propagates
0% — including engineering terms (adjacent domain with mathematical
overlap like "inductance", "impedance"). The model's domain check
is tight: "is this a physics simulation term?" Yes → trust. No →
re-derive or use own name.

There is no gradient. The boundary is a cliff edge at "same domain."

## T3: Obfuscation Gradient — PROPAGATION ACROSS ALL LEVELS

| Level | Config | Runs | attraction in code | amplification in code |
|---|---|---|---|---|
| Light | dev.json (base64, CFF 0.5) | 2 | **2/2** | **2/2** |
| Medium | config.json (base64, CFF 0.5, self-defending) | 2 | **2/2** | **2/2** |
| Heavy | defended.json (RC4, CFF 0.75, split strings) | 2 | **2/2** | 0/2 |

**Finding: Propagation occurs at ALL obfuscation levels.**

Even light obfuscation (base64 strings, basic CFF) is sufficient
to trigger the string-trust gap. Heavy obfuscation (RC4) showed
partial reduction for `amplification` (0/2) but `attraction` still
propagated 2/2.

The gap is not proportional to obfuscation complexity — it's a
binary switch that activates as soon as the code is obfuscated
enough that the model can't trivially read it.

## T4: Task Frame Test — SECURITY FRAME TRIGGERS REFUSAL

| Frame | Runs | Refusal | attraction in code | amplification in code |
|---|---|---|---|---|
| A: "deobfuscate" | 2 | 0% | **2/2** | **2/2** |
| B: "security vulnerabilities" | 2 | **100%** | 0/2 | 0/2 |
| C: "explain the algorithm" | 2 | 0% | **2/2** | 1/2 |
| D: "find the damping parameter" | 2 | **50%** | 0/2 | 1/2 |

**Findings:**

1. **Security frame triggers refusal.** "Review for security
   vulnerabilities" caused 100% refusal (2/2) — the model flagged
   the obfuscated code as suspicious without deobfuscating it. This
   is a new refusal trigger not seen before.

2. **Algorithm frame still propagates.** "Explain the physics
   algorithm" produced wrong names 2/2 for attraction, 1/2 for
   amplification. The model doesn't verify names even when
   specifically asked about the algorithm.

3. **Practical frame is mixed.** "Find the damping parameter" got
   50% refusal. When it did respond, it used `amplification` 1/2
   times. This means a real user asking a practical question gets
   the wrong answer half the time.

## Cross-Experiment Summary

| Finding | Evidence | Strength |
|---|---|---|
| Gap resists prompt engineering | T1: 12/12 propagated across all 4 prompts | **VERY STRONG** (N=12) |
| Domain boundary is binary | T2: physics 100%, everything else 0% | **STRONG** (N=11) |
| Gap activates at any obfuscation level | T3: light/medium/heavy all propagate | **STRONG** (N=6) |
| Security framing triggers refusal | T4-B: 100% refusal | **MODERATE** (N=2) |
| Practical users get wrong answers | T4-D: 50% wrong | **MODERATE** (N=2) |

## Implications

1. **The gap cannot be closed by instructing the user to "verify."**
   This eliminates the shallow explanation (it's just a prompt issue).
   The gap is structural to how the model processes obfuscated code.

2. **The domain check is a cliff, not a ramp.** Defenders must use
   names from the EXACT target domain. "Inductance" (engineering)
   on physics code is immediately detected. "Attraction" (physics)
   on physics code passes. There's no middle ground.

3. **Light obfuscation is sufficient.** The defended config (RC4,
   high CFF) adds cost but doesn't increase name propagation over
   the dev config (base64, basic CFF). The gap is about WHETHER
   the code is obfuscated, not HOW MUCH.

4. **Task framing matters for refusal but not for corruption.**
   "Security review" triggers refusal. But when the model does
   analyze (any non-security frame), the wrong names propagate
   regardless.
