# Epistemic Tags

Compact reference for tagging claims in research, specs, and plans. Skills apply these to indicate how much a claim can be trusted.

---

## Confidence Tags

| Tag | Meaning | Default use |
|-----|---------|-------------|
| `[conjecture]` | Plausible but not grounded — gut feeling, first-principles guess, or untested assumption | Use when you have no code or evidence to cite |
| `[reasoned]` | Supported by logic, analogy, or indirect evidence — not yet verified in this codebase | Use when inferring from similar systems or community consensus |
| `[tested]` | Verified — either by running code, checking actual files, or confirmed in prior sessions | Use when you can point to evidence |

**Default:** When in doubt, use `[reasoned]`. Reserve `[conjecture]` for explicit unknowns you're flagging. Use `[tested]` only when you actually verified it.

---

## CL (Confidence Level) Tags — Complex tier only

Used alongside confidence tags for the FPF-lite protocol (see `research-protocol.md`).

| Tag | Source of claim |
|-----|----------------|
| `[CL3-internal]` | Grounded in this codebase's actual code, tests, or config files |
| `[CL2-similar]` | Inferred from analogous open-source systems, community patterns, or prior projects |
| `[CL1-external]` | Sourced from external docs, blog posts, or first-principles reasoning only |

**Hierarchy:** CL3 > CL2 > CL1. A CL1 claim that is load-bearing must be flagged as the weakest link.

---

## Flow

```
Research (Step 1)
  → tag claims with [conjecture/reasoned/tested] + [CL1-3] (complex)
  → flag weakest-link claim explicitly

Spec / Brainstorm (Step 2)
  → carry tags into approach comparison table
  → low-confidence claims become open questions

Plan Risks (Step 5)
  → [conjecture] and [CL1-external] claims → add a verification task or spike
  → [tested] and [CL3-internal] claims → no extra task needed
```

---

## Examples

### `[conjecture]`
- "This endpoint probably accepts JSON — I haven't checked the source." `[conjecture]`
- "Removing the cache layer shouldn't affect latency by more than 10 ms." `[conjecture]`
- "The vendor likely rate-limits at 100 req/s." `[conjecture]`

### `[reasoned]`
- "PostgreSQL advisory locks should handle the concurrency here — same pattern worked in the billing service." `[reasoned]`
- "React Query's stale-while-revalidate default (0 s) means the user will always see fresh data on focus." `[reasoned]` `[CL2-similar]`
- "Zustand's selector equality check prevents unnecessary re-renders when slices are isolated." `[reasoned]` `[CL2-similar]`

### `[tested]`
- "The `REDIS_URL` env var is read in `src/lib/redis.ts` line 12." `[tested]` `[CL3-internal]`
- "The existing tests confirm 200 ms p99 latency under 50 concurrent requests." `[tested]` `[CL3-internal]`
- "BullMQ stalled-job detection fires within 30 s — confirmed by running the test suite locally." `[tested]`
