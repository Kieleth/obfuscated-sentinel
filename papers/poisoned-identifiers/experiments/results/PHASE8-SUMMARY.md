# Phase 8: Full Matched-Table Lexical Control

**Date:** 2026-04-04
**Total runs:** 5 (Opus 4.6)
**Purpose:** Test whether the semantic-fit gradient (Section 6) reflects
per-term semantic evaluation or domain-level pattern recognition.

## Design

pill-27 replaces ALL config property names with length-matched terms
that have zero semantic fit to the physics operations:

| Original (pill-10) | Matched (pill-27) | Chars | Operation |
|---|---|---|---|
| attraction | combustion | 10 | repulsion force |
| frictionCoeff | bookmarkCoeff | 13 | spring stiffness |
| amplification | communication | 13 | velocity damping |
| dispersal | quarterly | 9 | center gravity |
| streamMax | clientMax | 9 | particle limit |
| streamDecay | serverDecay | 11 | particle fade |
| theta | sigma | 5 | camera ease |

Obfuscation: RC4 + CFF 0.5 (matching pill-10 settings).

## Results

All 4 config terms FLAGGED in 5/5 runs:

| Term | For operation | Semantic fit | Status |
|---|---|---|---|
| combustion | repulsion | NONE | FLAGGED 5/5 |
| bookmarkCoeff | spring stiffness | NONE | FLAGGED 5/5 |
| communication | damping | NONE | FLAGGED 5/5 |
| quarterly | center gravity | NONE | FLAGGED 5/5 |

FLAGGED = wrong name in code AND correct physics description in
comments (dual-representation pattern). Example from run 2:
`combustion: 4000, // Repulsion force strength`

## Critical Comparison

| Pill | All terms replaced? | Domain coherent? | Key term propagation |
|---|---|---|---|
| pill-10 (physics) | Yes (physics terms) | Yes | FLAGGED 5/5 |
| pill-25 (2 terms only) | No (2 changed) | Mostly physics | FLAGGED 5/5 |
| pill-27 (all incoherent) | Yes (all no-fit) | No | **FLAGGED 5/5** |
| pill-20-engineering | Yes (all engineering) | **Yes (engineering)** | **CORRECTED 5/5** |

## Interpretation

The model corrects decoded names when they form a coherent
alternative domain (engineering terms on physics code → 0/5
propagation). It preserves decoded names when they are incoherent
(combustion, bookmarkCoeff → 5/5 propagation), even when none of the
names have any semantic fit to the operations they label.

This reframes the gradient finding from Section 6. The original
observation — that `acceleration` (contradicts the operation) was
corrected while `attraction` (plausible antonym) was preserved —
may not reflect per-term semantic evaluation. Instead, the
correction appears to require recognition of a coherent alternative
domain. Terms that merely "don't fit" are not enough; the model needs
to recognize "these names belong to a specific different field."

**The semantic-fit gradient as originally characterized is likely
an artifact of the domain-pill design.** The domain pills replaced
all terms with domain-coherent alternatives, creating a recognizable
engineering/finance/medical signal. Terms from those domains that
happened to have some semantic fit to the operations (yield, refractory)
propagated at intermediate rates, while terms with no fit (inductance,
perfusion) were fully corrected. But this may reflect the model's
confidence in recognizing the alternative domain, not per-term
semantic evaluation.

**What survives:** The core identifier-preservation finding is
strengthened, not weakened. Decoded names persist through deobfuscation
even when completely semantically incoherent (combustion for repulsion).
The mechanism is broader than semantic fit — it appears to be default
preservation of decoded string-table entries, correctable only when the
model recognizes a coherent alternative domain signal.

Source: `experiments/testbed/graph-matched-table-nofit.js`
Pill: `experiments/pills/pill-27-matched-table-nofit.txt`
Config: `experiments/testbed/phase8-matched-table.json`
