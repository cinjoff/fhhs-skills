# Debugging Protocol

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes. Symptom fixes are failure.

## Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read errors carefully** — don't skip past stack traces; note line numbers, file paths, error codes
2. **Reproduce consistently** — if not reliably reproducible, gather more data; do not guess
3. **Check recent changes** — git diff, recent commits, new dependencies, config changes
4. **Gather evidence in multi-component systems** — add diagnostic instrumentation at each component boundary to see WHERE it breaks before investigating WHY
5. **Trace data flow** — use LSP (`goToDefinition`, `incomingCalls`, `findReferences`, `hover`) to trace bad values back to their source; fix at source, not at symptom

## Phase 2: Pattern Analysis

1. Find working examples of similar code in the codebase
2. Compare against the working version — list every difference, however small
3. Understand dependencies: config, environment, assumptions

## Phase 3: Hypothesis and Testing (Scientific Method)

1. **Form a single hypothesis:** "I think X is the root cause because Y" — write it down, be specific
2. **Test minimally:** make the smallest possible change to test the hypothesis, one variable at a time
3. **Verify before continuing:** worked → Phase 4; didn't work → form NEW hypothesis, do NOT stack more fixes

## Phase 4: Implementation

1. **Create failing test** before writing any fix
2. **Implement single fix** addressing the root cause — no "while I'm here" changes
3. **Verify:** test passes, no regressions, issue resolved
4. **3-fix escalation rule:** if 3+ fixes have failed, STOP — question the architecture, discuss with your human partner before attempting more

## Red Flags — STOP and Return to Phase 1

Any of these mean you are guessing, not debugging:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- "One more fix attempt" after already trying 2+
- Each fix reveals a new problem in a different place

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence, trace data flow | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create failing test, single fix, verify | Bug resolved, tests pass |
