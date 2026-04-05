# Mode-Specific Analysis

## Step 0E. Mode-Specific Analysis

**For SCOPE EXPANSION** — run all three:
1. 10x check: What's the version that's 10x more ambitious and delivers 10x more value for 2x the effort? Describe it concretely.
2. Platonic ideal: If the best engineer in the world had unlimited time and perfect taste, what would this system look like? What would the user feel when using it? Start from experience, not architecture.
3. Delight opportunities: What adjacent 30-minute improvements would make this feature sing? Things where a user would think "oh nice, they thought of that." List at least 3.

**For HOLD SCOPE** — run this:
1. Complexity check: If the plan touches more than 8 files or introduces more than 2 new classes/services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
2. What is the minimum set of changes that achieves the stated goal? Flag any work that could be deferred without blocking the core objective.
3. **Expansion opportunities snapshot** (1-2 sentences, not scope creep): "If we were in EXPAND mode, the ambitious version would be: _{one sentence describing the 10x version}_." Save this to CONTEXT.md's Deferred Ideas as `[Expansion opportunity]: {description}`. This preserves the "thinking bigger" insight for future planning sessions without expanding current scope.

**For SCOPE REDUCTION** — run this:
1. Ruthless cut: What is the absolute minimum that ships value to a user? Everything else is deferred. No exceptions.
2. What can be a follow-up PR? Separate "must ship together" from "nice to ship together."

## Mode Quick Reference

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     MODE COMPARISON                             │
  ├─────────────┬──────────────┬──────────────┬────────────────────┤
  │             │  EXPANSION   │  HOLD SCOPE  │  REDUCTION         │
  ├─────────────┼──────────────┼──────────────┼────────────────────┤
  │ Scope       │ Push UP      │ Maintain     │ Push DOWN          │
  │ 10x check   │ Mandatory    │ Optional     │ Skip               │
  │ Platonic    │ Yes          │ No           │ No                 │
  │ ideal       │              │              │                    │
  │ Delight     │ 5+ items     │ Note if seen │ Skip               │
  │ opps        │              │              │                    │
  │ Complexity  │ "Is it big   │ "Is it too   │ "Is it the bare    │
  │ question    │  enough?"    │  complex?"   │  minimum?"         │
  │ Taste       │ Yes (from    │ No           │ No                 │
  │ calibration │ DESIGN.md)   │              │                    │
  │ Temporal    │ Full (hr 1-6)│ Key decisions│ Skip               │
  │ interrogate │              │  only        │                    │
  │ Error map   │ Full + chaos │ Full         │ Critical paths     │
  │             │  scenarios   │              │  only              │
  │ Phase 2/3   │ Map it       │ Note it      │ Skip               │
  │ planning    │              │              │                    │
  └─────────────┴──────────────┴──────────────┴────────────────────┘
```
