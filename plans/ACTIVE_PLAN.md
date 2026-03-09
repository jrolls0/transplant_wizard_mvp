
---

## `plans/ACTIVE_PLAN.md`

```md
# Active Plan

This is the execution source of truth. One milestone at a time.

---

## Current Goal
Begin real product implementation for Transplant Wizard MVP using the hardened Codex workspace, file-backed memory, and milestone-based execution workflow.

---

## Milestone 1: Workspace Hardening ✅
**Status**: Complete

### Goal
Create a durable Codex-native workspace with stable instructions, layered overrides, repo-local skills, multi-agent configs, and file-backed memory.

### Acceptance Criteria
- [x] Working memory file exists (`docs/WORKING_MEMORY.md`)
- [x] Implementation runbook exists (`docs/IMPLEMENT.md`)
- [x] Subtree override files exist (`reference/`, `src/`, `supabase/`)
- [x] Root `.gitignore` exists
- [x] Skills and agent configs finalized
- [x] `docs/LEARNINGS.md` template created
- [x] `plans/ACTIVE_PLAN.md` established as the execution source of truth

### Validation
- Workspace structure exists and is internally consistent
- Key instruction/memory files are present
- Agent and skill files are in place

---

## Milestone 2: Define First Product Slice
**Status**: In progress

### Goal
Choose and fully define the first real implementation milestone for the product.

### Acceptance Criteria
- [ ] A single concrete first implementation slice is selected
- [ ] The milestone scope is narrow and testable
- [ ] Files likely to change are identified
- [ ] Validation steps are defined
- [ ] Major risks and dependencies are documented

### Candidate Starting Points
- Schema + auth foundation
- One center-portal workflow slice
- One patient-portal onboarding slice
- One end-to-end case progression backbone

### Files Likely to Change
- `plans/ACTIVE_PLAN.md`
- `docs/WORKING_MEMORY.md`
- potentially `docs/decisions/001-tech-stack.md` if a new durable architecture choice is made

### Validation
- Milestone can be explained in one paragraph
- Scope is small enough to complete without broad refactors
- Success criteria are specific and verifiable

### Risks
- Choosing a milestone that is too broad
- Starting in a layer that creates rework later
- Optimizing architecture before validating the first narrow product slice

---

## Milestone 3: First Product Implementation
**Status**: Not started

### Goal
Implement the first real product slice defined in Milestone 2.

### Acceptance Criteria
- [ ] The chosen slice is implemented
- [ ] Validation commands pass
- [ ] Memory files are updated
- [ ] Any durable patterns discovered are captured in `docs/LEARNINGS.md`
- [ ] Any durable architecture decisions are captured in `docs/decisions/`

### Files Likely to Change
- `src/`
- `supabase/`
- `docs/WORKING_MEMORY.md`
- `docs/LEARNINGS.md`
- `plans/ACTIVE_PLAN.md`

### Validation
- [TBD after Milestone 2 is finalized]

### Risks
- [TBD after Milestone 2 is finalized]

---

## Milestone Template

Copy this for future milestones:

```markdown
## Milestone N: [Title]
**Status**: Not started | In progress | Complete

### Goal
[One sentence describing what this milestone achieves]

### Acceptance Criteria
- [ ] [Specific, verifiable criteria]

### Files Likely to Change
- [List of files/directories]

### Validation
- [Commands to run]
- [What success looks like]

### Dependencies
- [What must be done first]

### Risks
- [What could go wrong]
---

## Decision Log
- Keep AGENTS.md stable and free of temporary project state
- Put evolving execution state in docs/WORKING_MEMORY.md
- Put active milestone scope and validation in this file
- Put durable patterns/gotchas in docs/LEARNINGS.md
- Create ADRs for significant architecture decisions

---

## Stop-and-Fix Rule
If validation fails:
1. Do not move to the next milestone
2. Document the issue in docs/WORKING_MEMORY.md
3. Fix the issue
4. Re-run validation
5. Only then proceed