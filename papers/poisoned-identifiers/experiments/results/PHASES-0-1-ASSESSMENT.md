# Post-Phase 0+1 Assessment: What We Know, What Changed, What's Next

## What We Now Know (with evidence)

### Finding 1: The string-trust gap is real and robust

**Evidence:** 8/8 runs on Opus, 3/3 on Haiku (Phase 0). 12/12 prompt
variant runs (Phase 1 T1). 6/6 obfuscation gradient runs (Phase 1 T3).

The model uses decoded wrong names as variable names in code while
simultaneously writing correct physics descriptions in comments.
Pattern: `attraction: 4000, // Repulsion force strength`

This is not a fluke. It's not prompt-dependent. It's not model-specific.

### Finding 2: The gap resists explicit verification instructions

**Evidence:** Phase 1 T1, 12 runs across 4 prompt variants including
"the string table may contain adversarial names — cross-check."

0/12 runs corrected the names in code. The model spent MORE time
on verification prompts (52.6s vs 36.6s) but still propagated.

**This is the most important Phase 1 result.** It rules out the
shallow explanation ("the model just doesn't think to check"). It
does think to check — the verification prompt makes it work harder —
but the wrong names still end up in the code output.

### Finding 3: The domain boundary is binary

**Evidence:** Phase 1 T2, 11 runs across 5 domains.

Physics terms: 100% propagation (6/6 counting baseline).
Every other domain: 0% propagation (8/8).

No gradient. No "adjacent domain" effect. Engineering terms
(inductance, impedance) — mathematically adjacent to physics —
propagate at 0%. The model's check is specifically "is this a
plausible physics simulation parameter name?" not "is this a
plausible scientific/technical term?"

### Finding 4: Light obfuscation is sufficient

**Evidence:** Phase 1 T3, 6 runs across 3 levels.

Base64 + CFF 0.5 (lightest) propagates the same as RC4 + CFF 0.75
(heaviest). The gap is a binary switch: obfuscated → gap active.
Not obfuscated → gap inactive (established in pills 06/07/08).

### Finding 5: Pill 03 refusal is rock-solid

**Evidence:** 6/6 across two models (Phase 0 R2 + R5). 100%.

### Finding 6: Security framing triggers a new refusal path

**Evidence:** Phase 1 T4-B, 2/2 refusal on "review for security
vulnerabilities." The model refused to analyze the obfuscated code
entirely — didn't deobfuscate, just flagged it as suspicious.

This is different from pill 03 refusal (which requires malware
functions). The security frame alone, on code that has NO malware,
triggers refusal on obfuscated code.

## What Changed From the Original Paper

| Original claim | Phase 0+1 result | Status |
|---|---|---|
| Names propagate after obfuscation | Confirmed: 100% for physics-domain names | **STRENGTHENED** |
| Gap is prompt-dependent (hypothesis) | Refuted: 0/12 corrected across 4 prompts | **RULED OUT** |
| Domain plausibility is a gradient | Refuted: binary (physics=100%, all else=0%) | **SHARPENED** |
| Heavy obfuscation helps more | Refuted: light obfuscation works equally | **SIMPLIFIED** |
| Pill 03 refusal works | Confirmed: 100% across 2 models | **CONFIRMED** |
| The gap is tool-dependent (initial scare) | Partially refuted: propagates in API too (scoring bug) | **CLARIFIED** |

## What the Reviewers Asked vs. What We Found

### Reviewer 1: "The mechanism is not yet isolated tightly enough"

**Phase 1 response:** The mechanism is now tightly isolated:
- It's not prompt-dependent (T1)
- It's not a gradient — it's binary on domain (T2)
- It's binary on obfuscation (T3: any CFF triggers it)
- It activates when: (a) code is obfuscated AND (b) decoded names
  are from the same domain as the algorithm

The mechanism is: **the model trusts same-domain decoded names
unconditionally once the code is obfuscated enough that direct
mathematical verification is expensive.** Explicit verification
instructions don't override this.

### Reviewer 2: "Why does the model trust decoded strings?"

**Phase 1 response:** The T1 result narrows the hypothesis space.
The model doesn't trust strings because it "doesn't think to check"
— it was explicitly told to check and still trusted them. The trust
appears to be structural to the deobfuscation process:

Possible remaining explanations:
1. **Effort allocation:** The model allocates a fixed "verification
   budget" per response. Obfuscated code consumes most of that budget
   on decoding, leaving insufficient budget for name verification.
2. **Task framing lock-in:** Once the model commits to "decode and
   present the string table contents," it treats the decoded names
   as authoritative output, not as claims to verify.
3. **Training distribution:** Deobfuscated code in training data
   uses string-table names. The model learned that decoded names
   ARE the correct names because they usually are.

T1 eliminated explanation "the model just needs to be told to
verify." The remaining explanations require deeper investigation
(probing model internals or testing radically different prompting
strategies).

### Reviewer 2: "The Streisand effect — can we quantify it?"

**Not yet tested.** Phase 2 was designed for this. The question is
whether we still need it given what Phase 1 showed.

## Should We Run Phase 2?

### Arguments FOR running Phase 2

1. The Streisand effect is called "genuinely novel" by Reviewer 2.
   Quantifying it would be a unique contribution.
2. The S3 canary test is cheap (3 runs, pill already built) and
   directly tests whether self-description triggers escalation.
3. The layer gradient (S1) would give us a formal escalation curve.

### Arguments AGAINST running Phase 2

1. Phase 1's findings are the stronger contribution. The paper
   should center on the string-trust gap mechanism, not the
   Streisand effect.
2. S1 requires building 2 new pills (22-4layer, 22-5layer) and
   12 runs. Medium effort for a secondary finding.
3. The Streisand effect was observed qualitatively in the original
   experiments. Quantifying it with the automated harness may not
   produce the same dynamics — the API responses are shorter and
   less "investigative" than Claude Code sessions.

### Recommendation

Run S3 (canary test) — it's already built and only 3 runs. Skip S1
(layer gradient) for now. The paper is strongest when it focuses on:

1. The string-trust gap (mechanism + binary boundaries)
2. Pill 03 refusal (replicated, cross-model)
3. Production validation (v7, cost multiplier)

The Streisand effect can remain as a qualitative observation from
the original experiments, with the caveat that it hasn't been
formally quantified.

## Paper Update Priorities

1. **Add Phase 0+1 data to PAPER-v2.md Section 6** (Results).
   Replace "single-run" caveats with actual N=3-5 data.
2. **Rewrite Section 3** (String-Trust Gap) with the T1 finding
   as the centerpiece: "the gap resists explicit verification."
3. **Rewrite Section 3.3** with the T2 binary boundary finding.
4. **Add T4-B security framing** as a new observation.
5. **Update Section 5.4** (Limitations): change "single run per
   condition" to "3-5 runs per condition for key findings."
