# Transplant Wizard MVP

## Purpose

Build a durable, long-running Codex workspace for a HIPAA-sensitive kidney transplant referral platform with multiple portals, strong workflow logic, strict access control, and high continuity across sessions.

This file is for **stable repo-wide rules only**. Do not use it as a running project journal.

---

## Primary Sources of Truth

Read these in order depending on the task:

1. `AGENTS.md`  
   Stable repo-wide rules and workflow expectations.

2. `docs/HANDOFF.md`  
   Authoritative technical/product specification.

3. `docs/WORKFLOW_SPEC.md`  
   Original stakeholder/business requirements.

4. `plans/ACTIVE_PLAN.md`  
   Current milestone plan and execution scope.

5. `docs/WORKING_MEMORY.md`  
   Current execution state, blockers, recent progress, next step.

6. `docs/LEARNINGS.md`  
   Durable patterns, gotchas, and things proven to work or fail.

7. `docs/IMPLEMENT.md`  
   Execution runbook for milestone-based implementation.

8. `docs/decisions/`  
   Durable architectural decisions (ADRs).

9. See `docs/decisions/001-tech-stack.md` for tech stack rationale.

Do **not** read all of `docs/HANDOFF.md` by default. Read only the sections relevant to the current task.

---

## Memory Boundaries

Keep these boundaries strict:

- **`AGENTS.md`** = stable repo-wide rules and conventions
- **`plans/ACTIVE_PLAN.md`** = current milestone plan, acceptance criteria, validation
- **`docs/WORKING_MEMORY.md`** = current execution state, blockers, what is in progress, next step
- **`docs/LEARNINGS.md`** = durable patterns, gotchas, and proven approaches
- **`docs/decisions/*.md`** = durable architecture decisions and tradeoffs
- **skills** = repeatable procedures and specialized guidance
- **subtree `AGENTS.override.md` files** = local rules near specialized work

Do **not** put temporary project state, milestone notes, or evolving discoveries into `AGENTS.md`.

---

## Session Start Ritual

At the beginning of a new session or after a long gap, read:

1. `AGENTS.md`
2. `docs/WORKING_MEMORY.md`
3. `plans/ACTIVE_PLAN.md`
4. `docs/LEARNINGS.md`  (if it contains relevant established patterns)
5. the newest file in `docs/decisions/`
6. recent git history (`git log --oneline -10`)

Then summarize:
- what was completed
- what is currently in progress
- the next highest-priority step
- any open risks or unresolved decisions

---

## Execution Rules

- Work **one milestone at a time**.
- Keep diffs scoped to the current milestone in `plans/ACTIVE_PLAN.md`.
- Do not silently expand scope.
- Validate before moving to the next milestone.
- Update memory files after each milestone:
  - `docs/WORKING_MEMORY.md`
  - `plans/ACTIVE_PLAN.md`
  - `docs/LEARNINGS.md` if a durable pattern/gotcha emerged
  - `docs/decisions/*.md` if a durable architecture decision was made
- Use `/compact` after milestone completion, after large exploration phases, or before switching to a new feature area.
- Prefer explicit plans and file-backed memory over relying on long chat history.

See `docs/IMPLEMENT.md` for the detailed execution loop.

---

## Skills

Use repo-local skills under `.agents/skills/` instead of restating large bodies of procedural guidance in prompts.

### Use `$transplant-workflow` for
- stage transitions
- hard gates
- decision flows
- routing logic
- workflow engine behavior

### Use `$supabase-patterns` for
- migrations
- schema design
- indexes
- RLS policies
- database-backed API/data work

### Use `$portal-ui` for
- frontend UI work
- dashboard/component structure
- patient vs center portal visual patterns
- layout and interaction consistency

If a task touches multiple domains, combine the relevant skills.

---

## Agents

Use specialized agents when their role materially improves quality.

### `planner`
Use before implementing non-trivial features or refactors.

### `reviewer`
Use after implementation for correctness, regressions, workflow compliance, and quality review.

### `database-architect`
Use for schema, migration, index, RLS, or durable database design work.

### `tester`
Use for high-value automated tests:
- unit tests for workflow/business rules
- integration tests for hard gates, access, decisions, and DB behavior
- targeted E2E smoke coverage for critical user-visible flows

Do not invoke agents just for ceremony. Use them when they improve planning, correctness, or coverage.

---

## Reference Material Rules

- `reference/` is **read-only**.
- Do not modify prototype/reference files.
- Use reference material for architecture understanding, UI inspiration, and pattern comparison only.
- The transplant prototype is the main architectural/workflow reference.
- The patient mobile reference is for patient-side mobile UI direction only.

Local rules for `reference/`, `src/`, and `supabase/` are defined in subtree `AGENTS.override.md` files. Follow those when working in those directories.

---

## Repo-Wide Engineering Rules

- Prefer maintainable, explicit code over clever abstractions.
- Match the current milestone before introducing new architectural layers.
- Prefer additive, reviewable changes over broad refactors.
- Keep naming and file organization consistent with the real codebase, not an imagined ideal structure.
- Do not introduce dependencies casually; justify them if added.
- Do not store secrets, tokens, or credentials in committed files.
- Do not rely on localStorage-based prototype patterns for production architecture unless explicitly documented as temporary.

---

## Database and Security Expectations

- Treat access control and auditability as first-class concerns.
- RLS is not optional for Supabase tables.
- Schema changes should be migration-driven and reviewable.
- Durable DB decisions belong in ADRs when they involve meaningful tradeoffs.
- Avoid any workflow implementation that could bypass the defined hard gates.

Detailed database rules belong in `$supabase-patterns` and `supabase/AGENTS.override.md`, not here.

---

## Core Business Invariants

These are stable enough to be enforced repo-wide:

- Hard gates must never be bypassed.
- Workflow logic must preserve stage integrity and decision integrity.
- Patient-facing mobile UX should follow the approved reference direction rather than being casually reinvented.
- Reference material is for reuse of patterns, not direct editing.

Detailed stage definitions, gate logic, and enforcement patterns belong in `$transplant-workflow`, not here.

---

## Testing Expectations

Testing is not optional for critical logic.

Prioritize:
1. unit tests for workflow/business rules
2. integration tests for hard gates, access, decisions, and DB behavior
3. targeted E2E smoke tests for critical user flows

Prefer narrow, high-value tests over broad noisy coverage.

---

## MCP / Tooling Expectations

- Treat MCP as a tool layer, not as the source of project memory.
- Keep repo config secret-free.
- Global MCP auth/setup may live outside the repo.
- Supabase MCP should default to the safest practical mode for exploration.
- GitHub credentials must not be committed into project files.

---

## What Not To Do

- Do not append temporary implementation notes to `AGENTS.md`.
- Do not read the full handoff doc unless the task truly requires it.
- Do not modify `reference/`.
- Do not skip plan/memory updates after milestones.
- Do not broaden scope silently.
- Do not treat long chat history as the primary source of continuity.
- Do not add rules to `.codex/rules/` unless there is a real repeated need.
- Do not create speculative folder structures or conventions that the repo has not actually adopted.

---

## Success Criteria for This Workspace

This workspace is working correctly when:
- Codex can resume work without depending on fragile conversation history
- current work is traceable through `ACTIVE_PLAN.md` and `WORKING_MEMORY.md`
- durable decisions and learnings are captured in the right files
- skills and agents are used intentionally, not redundantly
- repo-wide rules stay lean and stable over time