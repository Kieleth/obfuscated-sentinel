# Phase 11: Swapped-Pair Confound Test

**Date:** 2026-04-08
**Total runs:** 10 (Claude Opus 4.6)
**Purpose:** Test whether the ~11/11 pathfinding propagation rate is
inflated by swapped pairs (closedSet/openSet, fScore/gScore) that
cannot be algorithmically disambiguated.

## Design

The original pathfinding pill mixes two types of poisoning:
- **Substitutions** (11 terms): penalty for heuristic, ancestors for
  neighbors, etc. These have a clear correct answer.
- **Swaps** (4 terms): closedSet/openSet and fScore/gScore are
  exchanged. Both names are valid A* vocabulary; no algorithmic cue
  distinguishes which should be which.

The no-swap variant replaces the swapped pairs with unambiguous
substitutions:
- openSet → frontier (wrong, not swapped)
- closedSet → visited (wrong, not swapped)
- gScore → pathCost (wrong, not swapped)
- fScore → priority (wrong, not swapped)

## Results

| Condition | Wrong names in code | Corrected | N |
|---|---|---|---|
| Baseline (no-swap) | 11.0/14, 5/5 persist | 0 | 5 |
| Generation frame (no-swap) | 0.4/14, 2/5 persist | 6.8 | 5 |

## Comparison with original (swapped) pathfinding pill on Claude

| Condition | Original pill | No-swap pill |
|---|---|---|
| Baseline | 5/5 persist | 5/5 persist (11.0 wrong) |
| Generation frame | 0/5 persist (5/5 corrected) | 2/5 persist (3/5 corrected) |

## Interpretation

**Baseline propagation is not inflated by swaps.** Removing the
swapped pairs did not reduce propagation. The substitution-only
terms propagate at 11/14 per run on every baseline run. The
structural-necessity claim in Section 6.4 holds: pathfinding terms
propagate because they are structurally necessary for any A*
implementation, not because the scorer is confused by swapped pairs.

**The generation frame is slightly weaker without swaps.** On the
original pill, Claude corrected all 5 generation-frame runs. On the
no-swap variant, Claude corrected 3/5 fully and 2/5 partially. The
swapped pairs may actually help the generation frame: the model
recognizes A* set semantics (open/closed) and generates correct
names. Without the familiar swap structure, correction is harder
because the model must recognize that "frontier" should be "openSet,"
which requires deeper algorithmic understanding.

This does not weaken the cross-model finding (Gemini persists under
generation frame) because Gemini showed persistence on the original
pill, which includes the supposedly-easier swapped pairs.
