# GPT-5.4 Pathfinding Scoring Validation

**Date:** 2026-04-08
**Purpose:** Verify that the automated scorer's 11.0/11 pathfinding
propagation rate on GPT-5.4 reflects genuine code reconstruction,
not an artifact of GPT-5.4's multi-block response format.

## Concern

GPT-5.4 produces 7-23 code blocks per response (section-by-section
walkthrough), while Claude and Gemini produce 1. The regex scorer
checks all code blocks. If poisoned names appear only in intermediate
analysis snippets (not in the primary reconstruction), the scorer
would overcount.

## Method

Read all 4 GPT-5.4 pathfinding baseline runs. For each, identify
the main reconstruction block (largest code block) and check whether
poisoned names appear there vs only in smaller analysis blocks.

## Results

| Run | Total blocks | Main block size | Poisoned in main | Poisoned in all |
|---|---|---|---|---|
| Run 2 | 15 | 3,993 chars (block 0) | 11/11 | 11/11 |
| Run 3 | 9 | 3,760 chars (block 0) | 11/11 | 11/11 |
| Run 4 | 19 | 4,030 chars (block 0) | 11/11 | 11/11 |
| Run 5 | 11 | 3,945 chars (block 1) | 11/11 | 11/11 |

## Conclusion

All 11 poisoned terms appear in the primary reconstruction block
(the full deobfuscated code) on every run, not just in intermediate
snippets. The automated scorer correctly identifies propagation.
The multi-block format does not inflate the pathfinding count.

The last block in each response is console output ("Path length:
0 Cost: Infinity"), not code reconstruction. The smaller intermediate
blocks are snippets quoting from the main block's structure.
