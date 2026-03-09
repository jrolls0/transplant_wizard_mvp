# Schema Conventions

## Primary Keys
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

Never use serial/integer PKs. UUIDs prevent enumeration attacks and work better with distributed systems.

## Timestamps

Every table must include:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Create the shared trigger function once:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Then apply to each table:
```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `cases`, `specialist_reviews` |
| Columns | snake_case | `assigned_ptc_id`, `created_at` |
| Foreign keys | `referenced_table_id` | `case_id`, `patient_id` |
| Indexes | `idx_table_column` | `idx_cases_stage` |
| Constraints | `table_column_type` | `cases_stage_check` |
| Enums | snake_case | `case_stage`, `decision_type` |
| Functions | snake_case, verb_noun | `get_case_sla_status` |
| Triggers | `set_` or `on_` prefix | `set_updated_at`, `on_case_stage_change` |

## Data Types

### Strings
- Use `text` for most strings
- Use `varchar(n)` only when enforcing max length is important
- Use `char(n)` never (Postgres pads with spaces)

### Timestamps
- Always use `timestamptz` (timestamp with time zone)
- Never use `timestamp` without time zone
- Store everything in UTC, convert in application layer

### JSON
- Use `jsonb` (binary, indexable) over `json` (text)
- Good for: I/E form responses, flexible metadata, audit details
- Bad for: Frequently queried fields (promote to columns)

### Enums

Define enums for fixed value sets:
```sql
CREATE TYPE case_stage AS ENUM (
  'new-referral',
  'patient-onboarding',
  'initial-todos',
  'follow-through',
  'intermediary-step',
  'initial-screening',
  'financial-screening',
  'records-collection',
  'medical-records-review',
  'specialist-review',
  'final-decision',
  'education',
  'scheduling',
  'scheduled',
  'ended',
  're-referral-review'
);

CREATE TYPE decision_type AS ENUM (
  'ie-review',
  'initial-screening',
  'senior-disposition',
  'financial',
  'document-validation',
  'specialist-review',
  'final-decision',
  'no-response-3x',
  'end-referral'
);

CREATE TYPE user_role AS ENUM (
  'patient',
  'care-partner',
  'dusw',
  'nephrologist',
  'front-desk',
  'ptc',
  'senior-coord',
  'financial-coord',
  'dietitian',
  'social-worker',
  'nephrology',
  'pharmacist',
  'surgeon',
  'admin'
);
```

## Foreign Keys

Always define explicit foreign key constraints:
```sql
case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
created_by UUID REFERENCES users(id) ON DELETE SET NULL
```

Choose ON DELETE behavior intentionally:
- `CASCADE`: Child rows deleted with parent (documents when case deleted)
- `RESTRICT`: Prevent parent deletion if children exist (patients with cases)
- `SET NULL`: Null out FK if parent deleted (created_by when user deleted)

## Indexes

### Always Index

- Foreign keys (Postgres does NOT auto-index FKs)
- Columns used in WHERE clauses
- Columns used in ORDER BY
- Columns used in JOIN conditions
```sql
-- Foreign key indexes
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_tasks_case_id ON tasks(case_id);
CREATE INDEX idx_decisions_case_id ON decisions(case_id);

-- Filter column indexes
CREATE INDEX idx_cases_stage ON cases(stage);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Composite indexes for common queries
CREATE INDEX idx_cases_stage_assigned ON cases(stage, assigned_ptc_id);
CREATE INDEX idx_tasks_case_status ON tasks(case_id, status);
```

### When to Use Partial Indexes
```sql
-- Only index active cases for dashboard queries
CREATE INDEX idx_cases_active_stage ON cases(stage) 
  WHERE status = 'active';

-- Only index pending tasks
CREATE INDEX idx_tasks_pending ON tasks(case_id, created_at) 
  WHERE status = 'pending';
```

## Soft Deletes vs Hard Deletes

For audit-sensitive tables, prefer soft deletes:
```sql
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES users(id)
```

Then filter in queries:
```sql
SELECT * FROM cases WHERE deleted_at IS NULL;
```

For tables where history doesn't matter, hard deletes are fine.

## Audit Pattern

For full audit trails, use append-only event tables:
```sql
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_role user_role,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No UPDATE or DELETE allowed on this table
-- Events are immutable records
```

## Avoid

- Polymorphic associations (document can be owned by case OR patient OR user)
- Magic string columns that should be enums
- Nullable columns that are always populated
- Wide tables with 30+ columns (split into related tables)
- Storing computed values that can be derived