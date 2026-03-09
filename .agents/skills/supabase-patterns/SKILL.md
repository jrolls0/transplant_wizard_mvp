---
name: supabase-patterns
description: Supabase database patterns for the Transplant Portal. Use when writing migrations, setting up RLS policies, designing schema, or implementing API routes. Use this skill for any database or backend data work.
---

# Supabase Patterns for Transplant Portal

## When to Use This Skill

Use this skill when:
- Creating or modifying database tables
- Writing migrations
- Designing RLS policies
- Building API routes that touch the database
- Debugging access control issues
- Optimizing queries

## Read First

- `docs/HANDOFF.md` Section 3 (Data Model) and Section 4 (Database Schema)
- `references/schema-conventions.md`
- `references/rls-policies.md`

## Schema Conventions

### Primary Keys
- All tables use `id` as UUID primary key
- Default: `gen_random_uuid()`

### Timestamps
Every table must have:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Plus a trigger:
```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Naming
- Tables: `snake_case`, plural (`cases`, `documents`, `decisions`)
- Columns: `snake_case`
- Foreign keys: `referenced_table_id` (e.g., `case_id`, `patient_id`)
- Indexes: `idx_table_column` or `idx_table_column1_column2`
- Enums: `snake_case` (e.g., `case_stage`, `decision_type`)

### Data Types
- Use `text` over `varchar` unless explicit length limit needed
- Use `timestamptz` for all timestamps (not `timestamp`)
- Use `jsonb` for flexible structured data (I/E form responses, etc.)
- Use enums for fixed value sets

## Migration Naming

Format: `YYYYMMDDHHMMSS_description.sql`

Examples:
```
20260309120000_create_cases_table.sql
20260309120100_create_documents_table.sql
20260309120200_add_rls_policies.sql
20260310090000_add_case_flags_column.sql
```

## Key Tables

From the data model:

| Table | Purpose |
|-------|---------|
| `organizations` | Transplant centers, clinics |
| `users` | All user types with role |
| `patients` | Patient demographics |
| `care_partners` | Patient care partners |
| `cases` | Referral cases (core entity) |
| `documents` | Uploaded documents with validation status |
| `decisions` | Recorded decisions with rationale |
| `tasks` | Assigned tasks with completion tracking |
| `messages` | Messages between parties |
| `timeline_events` | Audit trail of case events |
| `specialist_reviews` | Dietitian/SW/Nephro reviews |
| `contact_attempts` | Tracking outreach attempts |
| `education_progress` | Patient education completion |
| `scheduling_info` | Appointment scheduling state |

## RLS Pattern

**Every table must have RLS enabled and policies defined.**
```sql
-- Step 1: Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Step 2: Define policies (see references/rls-policies.md)
```

Never treat RLS as optional cleanup work. Design it with the schema.

## Multi-Portal Auth

Three authentication contexts:

| Portal | User Type | Auth Method |
|--------|-----------|-------------|
| Patient | `patient_users` | Email magic link |
| Clinic | `clinic_users` | Email + password |
| Center | `center_users` | SSO or email + password |

Portal type is stored in `user_metadata.portal_type`:
```typescript
const { data: { user } } = await supabase.auth.getUser();
const portalType = user?.user_metadata?.portal_type;

if (portalType !== expectedPortal) {
  redirect('/unauthorized');
}
```

## Query Patterns

### Fetching Cases with Related Data
```typescript
const { data: cases } = await supabase
  .from('cases')
  .select(`
    *,
    patient:patients(*),
    documents(*),
    assigned_ptc:users!assigned_ptc_id(id, name, email)
  `)
  .eq('stage', 'initial-screening')
  .order('created_at', { ascending: false });
```

### Dashboard Queue Counts
```typescript
const { count } = await supabase
  .from('cases')
  .select('*', { count: 'exact', head: true })
  .eq('stage', 'initial-screening')
  .is('assigned_ptc_id', null);
```

## Indexing Strategy

Always index:
- Foreign keys (`case_id`, `patient_id`, etc.)
- Common filter columns (`stage`, `status`, `assigned_ptc_id`)
- Timestamp columns used in sorting (`created_at`)
```sql
CREATE INDEX idx_cases_stage ON cases(stage);
CREATE INDEX idx_cases_assigned_ptc ON cases(assigned_ptc_id);
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_tasks_case_id_status ON tasks(case_id, status);
```

## Edge Functions

Place in `supabase/functions/`.

Naming: `verb-noun` (e.g., `send-notification`, `process-webhook`)

## Checklist for Schema Changes

For every table change:
1. [ ] Table definition with proper types
2. [ ] Primary key (UUID)
3. [ ] created_at / updated_at timestamps
4. [ ] updated_at trigger
5. [ ] Foreign key constraints
6. [ ] Indexes on FKs and filter columns
7. [ ] RLS enabled
8. [ ] SELECT policy
9. [ ] INSERT policy (if applicable)
10. [ ] UPDATE policy (if applicable)
11. [ ] DELETE policy (or document why not needed)
12. [ ] Service-role exceptions (if needed, document why)