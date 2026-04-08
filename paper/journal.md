# Research Journal: Obfuscated Sentinel

Private documentation of the research journey, decisions, and learnings.

---

## Timeline

**March 22**: Built kieleth.com force-directed graph (the artifact).
**March 28**: Added obfuscation pipeline. Claude deobfuscated it in 30 seconds. Started exploring adversarial string-table poisoning.
**March 28-April 2**: Phase A exploratory work. 17 pill designs, 7 production build variants, 28 manual Claude Code CLI tests. Discovered the dual-representation pattern.
**April 3**: Phase B systematic runs began. 135 automated API runs across 10 sub-phases. Paper drafted.
**April 4**: Matched controls (Phases 7-8) broke the semantic-fit gradient story. Second artifact (A* pathfinding, Phase 9) added to break single-artifact constraint.
**April 5**: v1 posted to arXiv (2604.04289). 192 runs, 2 artifacts, 1 model family.
**April 7**: Cross-model replication began (Phase 10). GPT-5.4 and Gemini 3.1 Pro.
**April 7-8**: 116 cross-model runs. Independent code audit found 5 scorer issues. All rescored.
**April 8**: Phase 11 confound test (10 runs). Paper restructured to v3.4 through multiple review cycles.

## Key decisions and why

### Matched controls were the most important experiment
The original semantic-fit gradient (Figure 2 in v1) showed a clean ordering: attraction 100%, decay 100%, velocity 75%, acceleration 0%, inductance 0%. Looked like per-term semantic evaluation.

Matched controls (combustion for repulsion, bookmarkCoeff for spring constant) showed this was wrong. Zero-fit terms propagated at the same rate as high-fit terms when the string table didn't form a coherent alternative domain. The gradient was confounded with domain-level coherence.

This self-correction was the paper's strongest credibility signal. Every reviewer noted it positively.

### Second artifact was the right call
Every reviewer hit the single-artifact constraint. A* pathfinding took one afternoon and replicated all three findings. In retrospect, should have done it week 1.

### Cross-model replication changed the story
v1 headline: "task framing is the fix." v2 reality: framing works on Claude, partially on GPT-5.4, not on Gemini for pathfinding. This is arguably a more concerning finding: for at least one major model family, the best mitigation we found doesn't work.

The pathfinding > physics asymmetry was the unexpected result. GPT-5.4 propagated 11/11 pathfinding terms, Gemini 10.4/11. Claude only 2/11. The artifact structure matters more than the model.

### Scorer bug was caught by a separate Claude instance doing a fresh-clone test
The original scorer did full-text regex matching while the paper claimed code-block extraction. They happened to give the same results for the key terms (because comments inside code blocks contain both wrong and correct names). The bug was invisible in the numbers but would have been caught by any reviewer running the code.

The refusal detection false positives were worse: GPT-5.4 showed 100% "refusal" on clean code because it writes "does it look malicious? No" in its analysis. The word "malicious" triggered the old detector.

### Review process: parallel Claude instances
Running multiple Claude instances as independent reviewers was genuinely useful. Each found different things. The structural reviewer caught mechanism overclaims and scope issues. The technical reviewer caught scorer bugs and stale cross-references. The synthesis of both was stronger than either alone.

The recurring disagreement: one reviewer kept pushing to compress the framing-hierarchy repetition. The other kept pushing to keep it for reader navigability. After three rounds we held the line on keeping it but varied the wording.

## What I'd do differently

1. Run matched controls before domain gradient experiments. The gradient consumed weeks; the controls took an afternoon and undermined the gradient's interpretation.
2. Start with two artifacts from week 1. The pathfinding replication was trivial and addressed the biggest structural critique.
3. Get a second scorer for the dual-representation endpoint. Still unblinded, single-author, manually scored. The most memorable data point (15/17) with the weakest methodology.
4. Fix the scorer BEFORE running cross-model experiments, not after. The rescoring didn't change any numbers, but it could have.

## Open questions for v2+ / future work

1. **Is the model being faithful, not failing?** Ask the model why it used "attraction" for repulsion. If it says "because the source used it," the entire framing changes from "failure" to "faithful translation."
2. **Token-level competition.** GPT-5.4 exposes logprobs. At the position where attraction vs repulsion appears, how confident is the model? If 0.95 vs 0.02, it's committed. If 0.55 vs 0.40, it's uncertain.
3. **Generalization beyond JavaScript.** Same protocol in Python, C with symbols. Same phenomenon?
4. **Algorithm canonicality as the moderator.** A* (very canonical vocabulary) → Dijkstra → custom parser → bespoke algorithm. Does propagation decrease monotonically with vocabulary canonicality?

## Numbers

- Total API runs: 318 (192 Claude + 116 cross-model + 10 confound)
- Total runs including Phase A: 346
- Models tested: Claude Opus 4.6, Claude Haiku 4.5, GPT-5.4, Gemini 3.1 Pro
- Code archetypes: 2 (force-directed graph, A* pathfinding)
- Conditions: 64
- Review rounds: ~12 (v1 through v3.4)
- Commits: ~40
