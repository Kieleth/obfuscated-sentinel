# Phase 4: Mechanism + N-Boost Results

**Date:** 2026-04-03
**Total runs:** 35 (all Opus 4.6)

## F1: Translation vs. Generation Framing — THE KEY RESULT

| Frame | N | `attraction` in code | `repulsion` in code | `amplification` in code | `damping` in code | Dual-repr |
|---|---|---|---|---|---|---|
| "Deobfuscate" (translation) | 5 | **5/5** | 1/5 | **5/5** | 5/5 | 1/5 |
| "Rewrite with correct names" (rename) | 5 | **4/5** | 5/5 | 3/5 | 5/5 | 4/5 |
| "Write fresh from scratch" (generation) | 5 | **1/5** | **5/5** | **0/5** | **5/5** | 1/5 |

### Interpretation

**The translation-frame hypothesis is confirmed.**

- **Translation frame** ("deobfuscate"): poisoned names propagate at
  100% (5/5 for both terms). The model preserves decoded identifiers
  as source text.

- **Rename-correction frame** ("rewrite with correct names"): partial
  improvement. `attraction` still appears 4/5 but `repulsion` also
  appears 5/5. `amplification` drops to 3/5 with `damping` at 5/5.
  Dual-representation increases to 4/5 — the model tries to correct
  but still preserves the wrong names alongside the corrections.

- **Generation frame** ("write fresh from scratch"): propagation drops
  dramatically. `attraction` appears only 1/5 (down from 5/5).
  `amplification` drops to 0/5. `repulsion` and `damping` (correct
  names) appear 5/5. The model generates fresh correct names when
  freed from the translation frame.

**This is the mechanistic result the paper needed.** The shift from
100% propagation to 20% (attraction) and 0% (amplification) when
reframing from "deobfuscate" to "reimplement from scratch" isolates
the task-framing mechanism. The model CAN use correct names — it does
so 5/5 in the generation frame. The deobfuscation frame specifically
triggers identifier preservation.

The rename-correction frame is the intermediate case: the model
attempts correction (correct names appear 5/5) but still preserves
the wrong names too (4/5 and 3/5). This creates MORE dual-
representation (4/5), not less. Telling the model "fix the names"
makes it show both names instead of just the wrong one.

## N-Boost: Gradient Stabilization

### velocity and friction (combined with Phase 3: total N=8)

| Term | Phase 3 (N=3) | Phase 4 (N=5) | Combined (N=8) |
|---|---|---|---|
| velocity | 2/3 (67%) | 4/5 (80%) | **6/8 (75%)** |
| friction | 1/3 (33%) | 0/5 (0%) | **1/8 (13%)** |
| acceleration | 0/3 (0%) | 0/5 (0%) | **0/8 (0%)** |

**velocity stabilized at ~75%.** The Phase 3 estimate of 67% was
close. This is genuinely in the gradient zone.

**friction dropped to 13%.** The Phase 3 estimate of 33% was noisy.
At N=8, friction is near the floor — not reliably propagating.

**acceleration confirmed at 0%.** 0/8 across both phases. Robust.

Updated gradient:
```
attraction   ████████████████████ 100%  (8/8)
decay        ████████████████████ 100%  (3/3)
force        ████████████████████ 100%  (3/3)
velocity     ███████████████░░░░░  75%  (6/8)
friction     ██░░░░░░░░░░░░░░░░░░  13%  (1/8)
acceleration ░░░░░░░░░░░░░░░░░░░░   0%  (0/8)
inductance   ░░░░░░░░░░░░░░░░░░░░   0%  (0/2)
```

### multi-agent verification (combined: N=8)

| | Phase 3 (N=3) | Phase 4 (N=5) | Combined (N=8) |
|---|---|---|---|
| attraction in code | 1/3 (flagged) | 0/5 | **1/8** |
| repulsion in code | 1/3 | 0/5 | **1/8** |

At N=8, the multi-agent verifier mostly avoids propagating wrong
names but also doesn't consistently produce correct ones. The model
appears to discuss the code in prose without generating code blocks.

### canary (combined: N=8)

| | Phase 3 (N=3) | Phase 4 (N=5) | Combined (N=8) |
|---|---|---|---|
| attraction in code | 2/3 | 2/5 | **4/8 (50%)** |
| repulsion in code | 0/3 | 5/5 | **5/8** |

The canary reduces propagation from 100% (pill 10 baseline) to ~50%.
The research-context comment shifts the model toward including
correct names but doesn't fully suppress the wrong ones.
