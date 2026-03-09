# Working Memory

Last updated: 2026-03-09

## Current Milestone
Milestone 2: First product implementation planning

## Status
- **Completed**: Workspace hardening and Codex structure setup
- **In Progress**: Defining the first real product implementation milestone
- **Blocked**: None

## What Was Completed
- Root `AGENTS.md` established for stable repo-wide rules
- Repo-local skills added under `.agents/skills/`
- Agent configs added (`planner`, `reviewer`, `database-architect`, `tester`)
- File-backed memory structure established:
  - `docs/WORKING_MEMORY.md`
  - `plans/ACTIVE_PLAN.md`
  - `docs/IMPLEMENT.md`
  - `docs/LEARNINGS.md`
- Subtree override files added for:
  - `reference/`
  - `src/`
  - `supabase/`
- Reference prototypes added and protected as read-only
- Initial ADR structure established in `docs/decisions/`

## What Is In Progress
- Finalizing the first concrete build milestone
- Validating that the workspace structure supports clean long-running Codex sessions
- Deciding the best first implementation slice for the actual product

## Next Step
1. Define Milestone 2 concretely in `plans/ACTIVE_PLAN.md`
2. Choose the first real implementation slice
3. Start planner-led implementation planning for that milestone
4. Begin real product work with memory files and runbook in place

## Key Decisions
| Decision | Rationale | ADR |
|----------|-----------|-----|
| `AGENTS.md` is for stable rules only | Prevents context rot and instruction bloat | - |
| `docs/WORKING_MEMORY.md` stores evolving execution state | Separates current state from stable instructions | - |
| `plans/ACTIVE_PLAN.md` is the execution source of truth | Keeps milestone scope explicit | - |
| `docs/LEARNINGS.md` stores durable patterns and gotchas | Avoids losing useful lessons across sessions | - |
| `reference/` is read-only | Protects prototype/reference code from accidental edits | - |
| Next.js + Supabase is the current platform direction | Strong fit for MVP speed, auth, storage, and workflow data | 001 |

## Known Risks
- No production app code has been implemented yet
- No real database schema has been created yet
- Hard gates are specified but not yet implemented in production code
- The first milestone is not yet defined, which creates planning ambiguity

## Open Questions
- What should the first implementation milestone be?
- Should the project start with schema/auth foundation or with one concrete portal slice?
- Which narrow product surface gives the best first validation of the system architecture?

## Important Commands
```bash
# Start Codex
codex

# Check recent changes
git log --oneline -10

# Check current status in Codex
/status

# Inspect MCP servers in Codex
/mcp

# Compact context after milestone boundaries
/compact
```

## Key File Locations
| Purpose | Location |
|---------|----------|
| Stable rules | `AGENTS.md` |
| Full spec | `docs/HANDOFF.md` |
| Original requirements | `docs/WORKFLOW_SPEC.md` |
| Current state | `docs/WORKING_MEMORY.md` |
| Durable patterns | `docs/LEARNINGS.md` |
| Active execution | `plans/ACTIVE_PLAN.md` |
| Execution runbook | `docs/IMPLEMENT.md` |
| ADRs | `docs/decisions/` |
| Skills | `.agents/skills/` |
| Agent configs | `agents/` |
| Prototypes | `reference/` |