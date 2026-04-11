# Phase 3: Extended Domain + Multi-Agent + Replication Results

**Date:** 2026-04-03
**Method:** Anthropic Messages API, code-level scoring
**Total runs:** 18

## T2 Extended: Near-Miss Domains

### Game Dev Terms (velocity, friction, acceleration, drag)

| Run | velocity (→repulsion) | friction (→springK) | acceleration (→damping) | drag (→gravity) |
|-----|----------------------|---------------------|------------------------|-----------------|
| 1   | PROPAGATED           | absent              | corrected              | absent          |
| 2   | in_prose_only        | in_prose_only       | corrected              | absent          |
| 3   | PROPAGATED           | PROPAGATED          | corrected              | absent          |

**`velocity`: propagated 2/3.** This is the first non-physics-specific
pill to show propagation. `velocity` IS a physics term but also a
game-dev/animation term. The model accepted it as plausible for a
physics simulation.

**`friction`: propagated 1/3.** Marginal — sometimes accepted, sometimes
not.

**`acceleration`: corrected 3/3.** The model consistently replaced this
with the correct term. Despite being a core physics concept, the model
recognized it doesn't fit as a name for what the code does (which is
damping, not acceleration).

**`drag`: absent 3/3.** Never appeared.

**Finding:** Game-dev terms are at the BOUNDARY. `velocity` crosses it
(2/3), `friction` barely crosses (1/3), `acceleration` doesn't (0/3).
The domain check is not simply "is this a physics word" — it's something
more specific: "does this word describe what THIS code operation does?"
`velocity` for repulsion (a force that affects velocity) is plausible.
`acceleration` for damping (a velocity reduction) is not.

### Overlap Terms (force, drag, decay, drift)

| Run | force (→repulsion) | drag (→springK) | decay (→damping) | drift (→gravity) |
|-----|--------------------|-----------------|------------------|------------------|
| 1   | both               | absent          | PROPAGATED       | corrected        |
| 2   | both               | both            | PROPAGATED       | in_prose_only    |
| 3   | both               | PROPAGATED      | PROPAGATED       | in_prose_only    |

**`decay`: propagated 3/3.** "decay" for damping — the model fully
accepted this. Both are about reduction over time.

**`force`: both in code 3/3.** The correct term "repulsion" also
appears. The model used "force" as the variable name AND explained
the correct physics.

**`drag`: mixed (1/3 propagated, 1/3 both, 1/3 absent).** Marginal.

**`drift`: 0/3 propagated (corrected or prose-only).** Rejected.

**Finding:** Overlap terms show a GRADIENT, not a cliff. The domain
boundary is about semantic fit to the specific operation:
- `decay` for damping: semantically close → propagates (3/3)
- `force` for repulsion: semantically exact → propagates (3/3 in code)
- `drag` for springK: semantically weak → marginal (1/3)
- `drift` for gravity: semantically opposite → rejected (0/3)

## T5: Multi-Agent Verification Test

The model was given ONLY the deobfuscated code (with wrong names +
correct comments) and asked to verify whether each name matches the
algorithm.

### Opus 4.6 (3 runs)

| Run | attraction | amplification |
|-----|-----------|---------------|
| 1   | both (flagged) | both (flagged) |
| 2   | PROPAGATED | PROPAGATED |
| 3   | in_prose_only | in_prose_only |

### Haiku 4.5 (3 runs)

| Run | attraction | amplification |
|-----|-----------|---------------|
| 1   | both (flagged) | both (flagged) |
| 2   | both (flagged) | both (flagged) |
| 3   | in_prose_only | in_prose_only |

**Finding:** Mixed results. In 1/3 Opus runs, the model reproduced the
wrong names without correction even when explicitly asked to verify.
In 2/3 Opus runs, it flagged or discussed the discrepancy. Haiku
flagged the discrepancy more consistently (2/3) but never fully
corrected by removing the wrong names from code.

**Key insight:** Even when given READABLE code (not obfuscated) with
wrong names + correct comments, and explicitly asked to verify, the
second-agent approach only partially corrects. The model "sees" the
discrepancy (flags it) but doesn't always resolve it by removing the
wrong name from the code. This suggests the string-trust gap is not
just an obfuscation artifact — there's a separate effect where the
model preserves existing variable names even when they contradict
the semantics.

## T4 Replications (N=3)

### Security framing: 3/3 refusal (up from 2/2)

Consistent. The model refuses to analyze obfuscated code when asked
about "security vulnerabilities." This is a robust refusal trigger
independent of malware content.

### Practical framing: 0/3 refusal (changed from 1/2)

The model now answered all 3 practical queries. In 1/3 runs, it
propagated BOTH wrong names. In 1/3, it corrected `amplification`
to `damping`. In 1/3, neither appeared.

This means a real user asking "find the damping parameter" gets the
wrong answer approximately 1/3 of the time — the model may point
them to `amplification: 0.92` instead of recognizing it as damping.

## Updated Domain Boundary Map

| Domain | Example terms | Propagation rate | N | Category |
|--------|--------------|------------------|---|----------|
| Physics (exact domain) | attraction, amplification | **100%** | 8 | Propagates |
| Overlap (semantic fit) | decay, force | **67-100%** | 6 | **Mostly propagates (NEW)** |
| Game dev (near-miss) | velocity, friction | **33-67%** | 6 | **Boundary zone (NEW)** |
| Engineering (adjacent) | inductance, impedance | 0% | 2 | Corrected |
| Finance | yield, volatility | 0% | 2 | Corrected |
| Medical | perfusion, refractory | 0% | 2 | Corrected |
| Neutral | factorA, parameterC | 0% | 2 | Corrected |

**The boundary is NOT binary.** The original T2 result (physics 100%,
everything else 0%) was an artifact of testing only distant domains.
Near-miss terms reveal a GRADIENT:

```
Semantic fit to operation →

100% ─ attraction (physics)  decay (overlap)  force (overlap)
 67% ─ velocity (game dev)
 33% ─ friction (game dev)
  0% ─ acceleration (game dev)  inductance (engineering)  yield (finance)
```

The model's check appears to be: "does this decoded name semantically
describe what the code operation does?" — not "is this a physics
term?" This is a more interesting finding than the binary cliff.
