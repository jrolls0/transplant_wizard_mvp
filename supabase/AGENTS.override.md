# Supabase Subtree Rules

## Before Starting
- Read `docs/HANDOFF.md` Section 3-4 for data model and schema
- Read `docs/LEARNINGS.md` for database-related gotchas
- Use `$supabase-patterns` skill for conventions

## Migrations

### Naming
Format: `YYYYMMDDHHMMSS_description.sql`

Examples:
```
20260309120000_create_cases_table.sql
20260309120100_add_cases_indexes.sql
20260309120200_add_cases_rls_policies.sql
```

### Structure
Each migration should be self-contained and include:
1. Table/column changes
2. Indexes
3. RLS policies
4. Triggers (if needed)

### Testing
- Test migrations locally before committing
- Verify RLS policies with different user contexts

## Edge Functions

Location: `supabase/functions/`

Naming: `verb-noun` (e.g., `send-notification`, `process-webhook`)

## Rules
- Prefer migrations over ad hoc database changes
- Always enable RLS on new tables
- Always add indexes on foreign keys
- Think about auditability for every table
- Do not put secrets in committed files
- Reference `docs/HANDOFF.md` for schema conventions

## After Schema Changes
- Update `docs/WORKING_MEMORY.md` with what changed
- Create/update ADR in `docs/decisions/` if the decision is durable
- Update `docs/LEARNINGS.md` if you discovered a pattern or gotcha