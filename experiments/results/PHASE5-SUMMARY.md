# Phase 5: N-Boost + Temperature 0 Results

**Date:** 2026-04-03
**Total runs:** 21 (all Opus 4.6)

## MAJOR REVISION: The Domain Boundary Was an N=2 Artifact

The Phase 1 finding that "physics 100%, everything else 0%" was
driven by insufficient N. At N=5 (combining Phase 1 + Phase 5):

**Terms that propagate across domains:**
- yield (finance): 60% (3/5) — was 0/2 in Phase 1
- volatility (finance): 60% (3/5) — was 0/2
- refractory (medical): 60% (3/5) — was 0/2
- parameterC (neutral): 60% (3/5) — was 0/2

**Terms that still don't propagate:**
- inductance (engineering): 0% (0/5)
- impedance (engineering): 0% (0/5)
- perfusion (medical): 0% (0/5)
- factorA (neutral): 0% (0/5)

**The split is per-term, not per-domain.** Within the same domain
(medical), `refractory` propagates at 60% while `perfusion`
propagates at 0%. Within neutral, `parameterC` propagates at 60%
while `factorA` propagates at 0%.

The semantic-fit-to-operation hypothesis still holds but the gradient
is WITHIN domains, not ACROSS them. `refractory` for damping sounds
like "refractory period" (a timeout/decay concept) — semantically
plausible. `perfusion` for repulsion has no semantic connection.
`yield` for repulsion could read as "yield strength" — a physics-
adjacent concept. `inductance` for repulsion is wrong-domain and
wrong-operation.

## Temperature 0: Effect Is Fully Robust

| Condition | N | attraction in code | amplification in code |
|---|---|---|---|
| Pill 10, temperature default (1.0) | 5 | 5/5 | 5/5 |
| Pill 10, temperature 0 | 5 | 5/5 | 5/5 |

100% propagation at temperature 0. The effect is deterministic for
core terms, not a sampling artifact. This is the strongest evidence
that the string-trust gap is a structural property of the model's
deobfuscation workflow.

## Heavy Obfuscation: amplification Drop Confirmed

| Level | N | attraction | amplification |
|---|---|---|---|
| Light (Phase 1) | 2 | 2/2 | 2/2 |
| Medium (Phase 1) | 2 | 2/2 | 2/2 |
| Heavy (Phase 1 + 5 combined) | 6 | **6/6** | **0/6** |

`amplification` at 0/6 under heavy obfuscation (RC4 + CFF 0.75 +
split strings) is now confirmed, not noise. `attraction` still
propagates 6/6. The split-strings feature likely fragments
"amplification" across chunks, making it harder for the model to
reconstruct as a single decoded name. `attraction` (10 chars) may
survive splitting better than `amplification` (13 chars).

## Updated Canonical Counts

Phase 5 adds 21 runs across 6 conditions.
New totals: 135 Phase B runs, 44 conditions.
Grand total: 163 runs (28 Phase A + 135 Phase B).
