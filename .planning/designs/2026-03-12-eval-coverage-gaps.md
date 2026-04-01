# Eval Coverage Gap Analysis — Approved Design

## Problem
105 evals exist but 5 skills have zero coverage, several high-value skills have only phantom (fileless) evals, design skill assertions are thin (2-3 vs 15 for /build), eval 83 is mislabeled, and no evals test failure recovery, state corruption, or skill misrouting.

## Approach
Three waves of work, all targeting `evals/evals.json` plus minimal fixture additions:

1. **Fix existing issues** — relabel eval 83, enrich thin assertions on design skills
2. **Add missing evals** — 5 uncovered skills, misrouting guards, failure recovery, state corruption
3. **Add fixture-backed evals** — standalone /review against fixtures, /simplify with fixtures, convert key fileless evals (7, 10, 26), one lifecycle chain eval

## Decisions
- No new fixture directories needed — reuse `nextjs-app-deep` for all fixture-backed additions
- For "corrupted STATE.md" evals, describe the corruption in the prompt rather than creating fixture variants (matches existing pattern for hypothetical-state evals like 27, 28, 29, 50)
- Eval 83 gets relabeled to `command: "critique"` (it's a review task, not a fix)
- Design skill assertions beefed up to 5+ each (add DESIGN.md read check, commit check, no-overengineering guard)
- New evals numbered 106-130 (continuing from 105)
