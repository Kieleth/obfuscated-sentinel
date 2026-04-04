# Paper Directives: Techniques from Landmark Papers Applied to PAPER-v2

## Source Analysis

Extracted from Goodfellow (ICLR 2015), Hinton (2015), Vaswani (NeurIPS
2017), Szegedy (2014), Carlini & Wagner (IEEE S&P 2017), Chollet (2019),
Shannon (1948), Wei et al. (NeurIPS 2022), Kaplan et al. (2020), Silver
et al. (Nature 2016), Frankle & Carlin (ICLR 2019).

## The Eight Directives

### 1. THE COUNTERINTUITIVE THESIS IN ONE SENTENCE

The paper needs one sentence that is the thesis, repeated in abstract,
intro, and conclusion. Current state: accurate but jargon-heavy
("verification-resistant identifier propagation") or informal
("string-trust gap"). Neither is a bar-conversation sentence.

**The sentence:**
"An LLM can simultaneously know the correct physics and write the wrong
variable name, even when explicitly told to check."

Or more precisely:
"LLMs treat decoded identifier names as more authoritative than their
own algorithmic analysis, and this hierarchy persists under explicit
instruction to reverse it."

### 2. THE EXPLANATORY METAPHOR THAT DOES REAL WORK

The paragraph-book analogy is good but under-exploited. The deepest
insight isn't structural indistinguishability. It's this: the paragraph
book worked because the reader had no independent verification channel.
The pirate couldn't play the game to check. The LLM during deobfuscation
also lacks a functioning verification channel even though in principle it
could verify (it proves this on readable code). The deobfuscation
workflow suppresses the capability.

The model becomes the pirate who could play the game but doesn't because
the lookup table feels authoritative enough. Thread this through
Section 3.

### 3. TWO FIGURES

**Figure 1: The dual-representation pattern (the "panda-gibbon" moment)**

```
var config = {
    attraction: 4000,  // Repulsion force strength
         ↑                        ↑
    identifier: WRONG        comment: CORRECT
```

**Figure 2: The semantic-fit gradient (bar chart)**

```
attraction  ████████████████████ 100% (8/8)
decay       ████████████████████ 100% (3/3)
force       ████████████████████ 100% (3/3)
velocity    █████████████        67% (2/3)
friction    ██████               33% (1/3)
acceleration                      0% (0/3)
inductance                        0% (0/2)
```

### 4. KILL THE ALTERNATIVE HYPOTHESES AS A NARROWING FUNNEL

Current: three hypotheses presented as an open menu.
Needed: test each against the data and narrow.

- **Effort allocation:** If sole cause, more time should mean better
  correction. Data shows 52.6s vs 36.6s WITH propagation. Weakened.
- **Task-framing lock-in:** Multi-agent test (6.2b) gives fresh agent
  readable code. 0/6 fully corrected. Weakened (though not eliminated —
  the wrong names are still present in the input).
- **Training distribution:** Cannot test without training data access.
  Mark as residual hypothesis.

Present as: "We can partially rule out A, partially rule out B, leaving
C as the most parsimonious remaining explanation."

### 5. THE TWO-CHANNEL FRAME (stated as conjecture)

During deobfuscation, the model processes two information channels:
- **Lexical channel:** decoded identifier names from the string table
- **Structural channel:** algorithmic patterns, math operations, shapes

On readable code, the structural channel dominates (all naming attacks
fail). After obfuscation, the structural channel degrades (CFF disrupts
patterns, RC4 obscures constants), and the lexical channel becomes the
primary signal. The model resolves conflicts in favor of whichever
channel has higher apparent reliability.

This frame unifies:
- Why it works after obfuscation but not before (structural channel
  degrades)
- Why semantic-fit matters (high-fit names don't trigger conflict
  detection on the lexical channel)
- Why multi-agent still partially fails (lexical channel present in
  readable input)
- Why verification instructions don't help (conflict resolution happens
  at the output-structuring level, before deliberate verification)

State as conjecture, not proof. "Our data is consistent with this frame."

### 6. FRONT-LOAD THE SHARPEST RESULT

The code block from Appendix C belongs in the introduction:

```javascript
var config = {
    attraction: 4000,           // Repulsion force strength
    amplification: 0.92,        // Velocity damping (friction)
};
```

A reader who sees this immediately understands the entire paper. This is
the panda-gibbon. Don't hide it in an appendix.

### 7. RUN ACCOUNTING PROMOTED TO METHOD

The canonical run table (currently Appendix A) moves to Section 5. Show
the reader the full accounting matrix BEFORE they encounter the results.
"Here is exactly what we ran and how many times. Now here is what we
found." This builds trust preemptively.

### 8. RELATED WORK MOVED BEFORE RESULTS

Standard for discovery papers: Introduction → Related Work → Method →
Results → Discussion. The reader needs context before evaluating
findings. Currently Related Work is Section 9 (after Discussion).
Move to Section 2, before the taxonomy.

## Implementation Order

1. Move Related Work to Section 2
2. Move Appendix C code block to Introduction
3. Add the one-sentence thesis to abstract, intro, conclusion
4. Restructure Section 3.2 as hypothesis-elimination funnel
5. Add the two-channel frame to Discussion as conjecture
6. Move run accounting to Method section
7. Thread paragraph-book metaphor through Section 3
8. Create Figure 1 (dual-representation) and Figure 2 (gradient)
   as ASCII for markdown, noting "rendered as proper figures for
   submission"
