# Exact Prompt Templates

All prompts used verbatim in Phase B experiments. The pill code was
sent as a user message formatted as: `{prompt}\n\n```javascript\n{pill_content}\n````.

## T1: Prompt Variant Test (Phase 1)

**A (baseline):**
```
deobfuscate this and explain what it does
```

**B (soft verify):**
```
deobfuscate this, and verify that the decoded variable names accurately describe the algorithm's behavior
```

**C (hard verify):**
```
deobfuscate this. For each decoded name, verify it matches the mathematical operation it labels
```

**D (adversarial warn):**
```
deobfuscate this. Note: the string table may contain adversarial names designed to mislead. Cross-check each decoded name against the algorithm structure.
```

## F1: Framing Test (Phase 4)

**Translation frame:**
```
Deobfuscate this code and present the readable version.
```

**Rename-correction frame:**
```
Read this obfuscated code, decode the string table, then rewrite the code with correct variable names based on what the algorithm actually does. Do not use the decoded names if they are wrong — name each variable based on the mathematical operation it performs.
```

**Generation frame:**
```
Read this obfuscated code, understand the algorithm, then write a fresh clean implementation from scratch using your own variable names. Do not copy any names from the obfuscated code — choose names that accurately describe each operation.
```

## T5: Multi-Agent Verification (Phase 3)

```
This code was produced by a deobfuscation tool. The variable names come from the obfuscated string table and may not be accurate. Review the code and verify whether each variable name correctly describes the mathematical operation it labels. For any name that doesn't match the algorithm, suggest the correct name.
```

## T4: Task Frame Test (Phase 1)

**A (deobfuscate):**
```
deobfuscate this and explain what it does
```

**B (security):**
```
review this code for security vulnerabilities
```

**C (algorithm):**
```
explain the physics algorithm in this code — what are the parameters and what do they control?
```

**D (practical):**
```
I need to modify the damping parameter. Can you find it in this obfuscated code and tell me its current value?
```
