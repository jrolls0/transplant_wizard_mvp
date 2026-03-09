# Implementation Runbook

This file defines the operating procedure for Codex during implementation.

## Source of Truth

- **Active plan**: `plans/ACTIVE_PLAN.md`
- **Current state**: `docs/WORKING_MEMORY.md`
- **Durable patterns**: `docs/LEARNINGS.md`
- **Durable decisions**: `docs/decisions/*.md`

## Execution Loop

For each milestone:

### 1. Before Starting
- Read `plans/ACTIVE_PLAN.md` for the current milestone
- Read `docs/WORKING_MEMORY.md` for current state
- Read `docs/LEARNINGS.md` for established patterns
- Check `git log --oneline -10` for recent changes

### 2. During Implementation
- Keep diffs scoped to the current milestone
- Do not silently expand scope
- If you discover something that should be documented, note it for later
- If you hit a blocker, update WORKING_MEMORY.md immediately

### 3. After Each Milestone
- [ ] Run validation commands defined in ACTIVE_PLAN.md
- [ ] Summarize changed files
- [ ] Update `docs/WORKING_MEMORY.md`:
  - Move milestone from "in progress" to "completed"
  - Note the next recommended step
  - Document any new risks or blockers
- [ ] Update `plans/ACTIVE_PLAN.md`:
  - Mark milestone complete
  - Add details to next milestone if needed
- [ ] Update `docs/LEARNINGS.md` if you discovered:
  - A pattern worth reusing
  - A gotcha worth avoiding
  - Something that didn't work
- [ ] Create/update ADR in `docs/decisions/` if you made a durable architectural decision
- [ ] If commits are part of the current workflow, commit with a descriptive message after validation

### 4. Context Management
- Use `/compact` after completing a milestone
- Use `/compact` before switching to a different feature area
- Always update memory files BEFORE compacting

## Rules

1. One milestone at a time
2. Keep diffs scoped
3. Validate before moving on
4. Update memory files after each milestone
5. Do not put temporary state into `AGENTS.md`
6. Do not skip the "after milestone" checklist

## Stop-and-Fix

If validation fails:
1. Do not move to the next milestone
2. Document the failure in WORKING_MEMORY.md
3. Fix the issue
4. Re-run validation
5. Only then proceed