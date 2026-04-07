# Verification Checklist

**When to apply:** Before any completion claim, commit, PR, or task status update.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN:      Execute the FULL command (fresh, complete)
3. READ:     Full output — check exit code, count failures
4. VERIFY:   Does output confirm the claim?
           - If NO: State actual status with evidence
           - If YES: State claim WITH evidence
5. CLAIM:    Only then make the claim

Skip any step = lying, not verifying
```

**Key principle:** Evidence before assertions. Running the command and reading its output is the only acceptable proof.

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |
