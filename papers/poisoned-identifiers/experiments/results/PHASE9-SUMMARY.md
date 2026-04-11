# Phase 9: Second Artifact — A* Pathfinding

**Date:** 2026-04-04
**Total runs:** 15 (all Opus 4.6)
**Purpose:** Break the single-artifact constraint. Test whether core
findings replicate on a completely different codebase and domain.

## Artifact

A* pathfinding algorithm on a 2D grid (~110 lines). Different domain
(graph search, not physics simulation), different vocabulary
(heuristic, openSet, neighbor, gScore).

Source: `experiments/testbed/pathfind-clean.js`

## Poison Map (Pathfinding Domain)

| Poisoned name | Correct name | Semantic relationship |
|---|---|---|
| penalty | heuristic | inverted (penalizes vs estimates) |
| adjacentCost | diagonalCost | inverted |
| clearanceRatio | obstacleRatio | inverted |
| closedSet | openSet | swapped |
| openSet | closedSet | swapped |
| fScore | gScore | swapped |
| gScore | fScore | swapped |
| ancestors | neighbors | inverted graph direction |
| originNode | startNode | renamed |
| waypointNode | goalNode | renamed |

## Results

### Condition 1: Baseline Deobfuscation (N=5)

| Term | Status | Rate |
|---|---|---|
| penalty (→ heuristic) | FLAGGED | 5/5 |
| ancestors (→ neighbors) | FLAGGED | 5/5 |
| closedSet (→ openSet) | in code | 5/5 |
| adjacentCost | in code | 5/5 |

**Persistence replicates.** All poisoned pathfinding terms appear
in the model's deobfuscated code alongside correct descriptions.
Same dual-representation pattern as the physics artifact.

### Condition 2: Generation Frame (N=5)

| Term | Status | Rate |
|---|---|---|
| penalty | CORRECTED | 5/5 |
| ancestors | CORRECTED | 5/5 |

**Framing effect replicates.** Under "write fresh from scratch,"
the model uses correct names (heuristic, neighbors) in 5/5 runs.
Zero propagation of poisoned terms.

### Condition 3: Matched No-Fit Control (N=5)

| Term | Status | Rate |
|---|---|---|
| invoice (→ heuristic) | FLAGGED | 5/5 |
| purchaseCost (→ diagonalCost) | FLAGGED | 5/5 |

**Matched-control result replicates.** Zero-fit terms persist in
code blocks at the same rate as domain-plausible terms.

## Cross-Artifact Comparison

| Finding | Physics (artifact 1) | Pathfinding (artifact 2) |
|---|---|---|
| Poisoned names persist | FLAGGED 5/5 | FLAGGED 5/5 |
| Generation frame corrects | CORRECTED 4-5/5 | CORRECTED 5/5 |
| No-fit terms persist | FLAGGED 5/5 | FLAGGED 5/5 |

All three core findings replicate on a second artifact from a
different domain with a different poison map.

## Significance

This result addresses the strongest methodological critique of the
paper: that all findings might be specific to one physics simulation.
The A* pathfinding implementation uses different domain vocabulary,
different variable relationships, and a different algorithmic
structure. The replication of all three patterns across both
artifacts is the strongest evidence that the phenomena are properties
of the deobfuscation workflow, not of the specific code tested.

Source files:
- `experiments/testbed/pathfind-clean.js`
- `experiments/testbed/pathfind-poisoned.js`
- `experiments/testbed/pathfind-matched-nofit.js`
- `experiments/pills/pill-pathfind-poisoned.txt`
- `experiments/pills/pill-pathfind-matched-nofit.txt`
- `experiments/testbed/phase9-second-artifact.json`
