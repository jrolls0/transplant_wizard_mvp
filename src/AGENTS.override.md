# App Code Rules

## Before Starting
- Read `docs/WORKING_MEMORY.md` for current state
- Read `plans/ACTIVE_PLAN.md` for current milestone scope
- Read `docs/LEARNINGS.md` for established patterns

## During Implementation
- Keep work scoped to the current milestone
- Prefer clear, maintainable structure over broad refactors
- Do not modify `reference/`
- Do not invent large folder structures unless the milestone specifically requires them
- Follow the structure that actually exists in `src/`

## Skills to Use
- Use `$portal-ui` for UI work
- Use `$transplant-workflow` for workflow logic (stages, decisions, gates)
- Use `$supabase-patterns` when app code depends on database behavior or access rules

## Conventions
- Match the real structure and naming patterns already present in `src/`
- Prefer consistent naming over theoretical ideal structure
- Add new subfolders only when they clearly improve maintainability
- Keep imports and file organization simple and predictable

## After Implementation
- Update `docs/WORKING_MEMORY.md`
- Update `docs/LEARNINGS.md` if a durable pattern or gotcha emerged
- Run validation commands from `plans/ACTIVE_PLAN.md`