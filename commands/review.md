---
description: Review the architecture wiki's structural adequacy per kind (deterministic Core floor) and add the FPF judgement rubric — read-only, proposes fixes.
argument-hint: "[--kind <k>] [--id <ID>]"
allowed-tools: Bash(arch-wiki:*), Task
---

Run the **Review** operation (FPF adequacy, C.32.ADA / C.30.AD). The structural floor is deterministic
and Core-owned; you add the judgement it cannot.

1. `arch-wiki adequacy --json` (pass through `--kind`/`--id`). Each artifact gets a `band`
   (`adequate` | `thin` | `inadequate`) computed from checkable `bases` (FACTS, not judgement) plus a
   `summary`. The band is a **capped structural floor, not a quality score**: `inadequate` = a *critical*
   base fails (an ADR with no Decision Outcome / no options / invalid status; a driver at AssuranceLevel L0);
   `thin` = only non-critical bases fail (missing Sources, carries epistemic debt, no Consequences section).
2. Following the **`adequacy-rubric`** skill, for the `inadequate`/`thin` artifacts add the **judgement
   layer** the Core cannot: are the options genuinely distinct, is the measure truly testable, are the
   consequences balanced — beyond mere section presence? Cross-reference `arch-wiki assurance` (driver
   maturity L0/L1/L2) and `epistemic-debt.md` (decay signals) for context.
3. Present a prioritized report (**inadequate → thin → adequate**) with the failing bases and one concrete
   fix per artifact. **Do NOT edit artifacts** — propose. Never fabricate coverage, invent an `accepted`
   status, or hand-author a register.
