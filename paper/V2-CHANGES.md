# v2 Change Plan

## Scope

v2 adds cross-model replication (GPT-5.4, Gemini 3.1 Pro, 116 runs)
and corrects a scoring pipeline issue discovered via independent audit.

## Title change

v1: "Poisoned Identifiers Survive LLM Deobfuscation: A Case Study on Claude Opus 4.6"
v2: "Poisoned Identifiers Survive LLM Deobfuscation: Cross-Model Evidence from Claude, GPT, and Gemini"

## Metadata changes

- Date: extend to 2026-04-08
- Model tested: → Models tested: Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro
- Add "v2" note after title

## Abstract rewrite

- Lead with cross-model scope (3 model families, 308 runs)
- Persistence replicates across all three models
- Framing effect is model-dependent (Claude corrects, Gemini does not)
- Pathfinding propagation stronger than physics (new finding)
- Note the scoring correction transparently

## Section-by-section changes

### 1. Introduction
- Update opening to reference three models, not just Claude
- The framing asymmetry is now qualified: works on Claude, not Gemini
- Add "Changes in v2" paragraph at the end of the introduction

### 2. Related Work
- No changes needed

### 3. Method
- 3.1 Stimuli: update to 308 runs, 63 conditions, 12 sub-phases
- 3.2 Protocol: add Phase C (cross-model API, OpenAI/Google SDKs)
- 3.3 Metrics: note scoring fix (refusal detection, pathfinding map)
- 3.4 Experimental Matrix: add Phase 10 rows
- 3.5 Limitations: update "two models" → "three model families"
  Add: temperature defaults may differ across providers

### 4. Taxonomy
- 4.2: correct T4-B security refusal from 100% to 60%
- Rest unchanged

### 5. Identifier Persistence
- 5.2: verification resistance table unchanged (12/12 is Claude-only,
  cross-model data goes in new Section 6.4)
- 5.3: framing experiment unchanged (Claude data). Cross-model
  framing goes in new section
- 5.4: unchanged

### 6. What Determines Whether Wrong Names Are Corrected?
- 6.1-6.3: unchanged (Claude + Phase 9 pathfinding)
- NEW 6.4: Cross-Model Replication
  - Baseline persistence table (3 models x 2 artifacts)
  - Framing effect table (3 models x 2 artifacts)
  - Verification resistance table (3 models)
  - Matched controls table (3 models x 2 artifacts)
  - Obfuscation gradient table (3 models x 3 levels)
  - Engineering domain table (3 models)
  - Temperature 0 table (3 models)
  - Narrative: persistence generalizes, framing does not

### 7. Secondary Findings
- 7.1: unchanged
- 7.2: add cross-model cost inflation data with honest framing
  (single-shot vs agentic measurement distinction)
- 7.3: unchanged

### 8. Discussion
- 8.1: update conjecture with cross-model evidence
  (domain-recognition not cleanly model-general)
- 8.2: add GPT-5.4 cost inflation note
- 8.3: unchanged

### 9. Future Work
- Item 2 (model comparison): mark as completed, note what remains
  (open-source models, GPT-4o prose-only behavior)
- Item 8 (cross-model framing): mark as completed, note the
  surprising result (Gemini resists)
- Add: agentic cost-inflation cross-model as new future work item

### 10. Conclusion
- Rewrite: persistence cross-model, framing Claude-specific,
  pathfinding stronger than physics, mechanism still unresolved
- Note scoring correction

### Appendices
- B: add Phase C environment (OpenAI SDK, Google SDK, model IDs)
- NEW H: Cross-Model Scoring Notes
  - Pathfinding poison map
  - Refusal detection fix and impact
  - v1 → v2 scoring changes with before/after table
- F: unchanged
- G: unchanged

## Numbers to update throughout

- 192 runs → 308 runs
- 50 conditions → 63 conditions
- 10 sub-phases → 12 sub-phases
- "one model family" → "three model families"
- "two models tested" → "four models tested" (Opus, Haiku, GPT-5.4, Gemini 3.1 Pro)
- T4-B security refusal: 100% → 60%
