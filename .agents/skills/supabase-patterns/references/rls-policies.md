# RLS Policy Patterns

## Core Principle

**Every application table must have RLS enabled and explicit policies defined.**

Never treat RLS as optional cleanup work. Design it with the schema.

## Enable RLS
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Also force RLS for table owners (important for service role)
ALTER TABLE table_name FORCE ROW LEVEL SECURITY;
```

## Policy Types

| Policy | Applies To | Use For |
|--------|-----------|---------|
| SELECT | Reading rows | Who can see what |
| INSERT | Creating rows | Who can create |
| UPDATE | Modifying rows | Who can edit |
| DELETE | Removing rows | Who can delete |
| ALL | All operations | Simple cases only |

## Helper Functions

Create these once and reuse:
```sql
-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has any of the specified roles
CREATE OR REPLACE FUNCTION auth.has_role(allowed_roles user_role[])
RETURNS boolean AS $$
  SELECT auth.user_role() = ANY(allowed_roles)
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's organization
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

## Common Policy Patterns

### Pattern 1: Role-Based Read Access

Center staff can read all cases in their organization:
```sql
CREATE POLICY "center_staff_read_cases" ON cases
  FOR SELECT
  USING (
    organization_id = auth.user_org_id()
    AND auth.has_role(ARRAY['front-desk', 'ptc', 'senior-coord', 'financial-coord', 
                            'dietitian', 'social-worker', 'nephrology', 'admin']::user_role[])
  );
```

### Pattern 2: Ownership-Based Access

Users can only update their own records:
```sql
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

### Pattern 3: Case-Scoped Access

Patients can only see documents for their own case:
```sql
CREATE POLICY "patients_read_own_documents" ON documents
  FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN patients p ON c.patient_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
```

### Pattern 4: Assigned PTC Access

PTCs can update cases assigned to them:
```sql
CREATE POLICY "ptc_update_assigned_cases" ON cases
  FOR UPDATE
  USING (
    assigned_ptc_id = auth.uid()
    AND auth.user_role() = 'ptc'
  );
```

### Pattern 5: Role-Specific Insert

Only front-desk can create certain task types:
```sql
CREATE POLICY "front_desk_create_tasks" ON tasks
  FOR INSERT
  WITH CHECK (
    auth.has_role(ARRAY['front-desk', 'senior-coord', 'admin']::user_role[])
    AND organization_id = auth.user_org_id()
  );
```

### Pattern 6: Clinic Portal Access

Clinic staff can only see cases they referred:
```sql
CREATE POLICY "clinic_read_referred_cases" ON cases
  FOR SELECT
  USING (
    referring_clinic_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND auth.has_role(ARRAY['dusw', 'nephrologist']::user_role[])
  );
```

## Table-Specific Policies

### Cases Table
```sql
-- Center staff read all org cases
CREATE POLICY "center_staff_read" ON cases FOR SELECT
  USING (organization_id = auth.user_org_id() AND auth.has_role(ARRAY['front-desk', 'ptc', 'senior-coord', 'financial-coord', 'dietitian', 'social-worker', 'nephrology', 'admin']::user_role[]));

-- Clinic staff read cases they referred
CREATE POLICY "clinic_staff_read" ON cases FOR SELECT
  USING (referring_clinic_id = auth.user_org_id() AND auth.has_role(ARRAY['dusw', 'nephrologist']::user_role[]));

-- Patients read their own case
CREATE POLICY "patient_read_own" ON cases FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- Front desk and above can create cases
CREATE POLICY "staff_insert" ON cases FOR INSERT
  WITH CHECK (auth.has_role(ARRAY['front-desk', 'senior-coord', 'admin']::user_role[]));

-- Assigned PTC or senior coord can update
CREATE POLICY "assigned_update" ON cases FOR UPDATE
  USING (assigned_ptc_id = auth.uid() OR auth.has_role(ARRAY['senior-coord', 'admin']::user_role[]));
```

### Documents Table
```sql
-- Staff read all docs for cases in their org
CREATE POLICY "staff_read" ON documents FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE organization_id = auth.user_org_id()));

-- Patients read docs for their case
CREATE POLICY "patient_read" ON documents FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.user_id = auth.uid()));

-- Patients can upload to their case
CREATE POLICY "patient_insert" ON documents FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.user_id = auth.uid()));

-- Staff can upload and validate
CREATE POLICY "staff_insert" ON documents FOR INSERT
  WITH CHECK (auth.has_role(ARRAY['front-desk', 'ptc', 'senior-coord']::user_role[]));

CREATE POLICY "staff_update" ON documents FOR UPDATE
  USING (auth.has_role(ARRAY['front-desk', 'senior-coord']::user_role[]));
```

### Decisions Table
```sql
-- Staff read decisions for org cases
CREATE POLICY "staff_read" ON decisions FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE organization_id = auth.user_org_id()));

-- Only specific roles can record decisions
CREATE POLICY "authorized_insert" ON decisions FOR INSERT
  WITH CHECK (
    auth.has_role(ARRAY['front-desk', 'senior-coord', 'financial-coord', 'dietitian', 'social-worker', 'nephrology']::user_role[])
    AND recorded_by = auth.uid()
  );

-- Decisions are immutable (no update policy)
```

### Timeline Events Table
```sql
-- Staff read events for org cases
CREATE POLICY "staff_read" ON timeline_events FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE organization_id = auth.user_org_id()));

-- System and staff can insert events
CREATE POLICY "insert_events" ON timeline_events FOR INSERT
  WITH CHECK (TRUE);  -- Controlled by application logic

-- Events are immutable (no update or delete policies)
```

## Service Role Access

Sometimes you need service role to bypass RLS (for cron jobs, webhooks, etc.):
```typescript
// In edge function or server-side code
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Bypasses RLS
);
```

Document every use of service role key. It's a security-sensitive pattern.

## Testing RLS

Always test policies with actual user contexts:
```sql
-- Test as a specific user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Then run queries and verify results
SELECT * FROM cases;  -- Should only return allowed rows

-- Reset
RESET request.jwt.claims;
```

## Checklist

For every table:
- [ ] RLS enabled
- [ ] SELECT policy (who can read)
- [ ] INSERT policy (who can create)
- [ ] UPDATE policy (who can modify, and what fields)
- [ ] DELETE policy (or explicit decision to omit)
- [ ] Policies tested with different user roles
- [ ] Service role usage documented if needed