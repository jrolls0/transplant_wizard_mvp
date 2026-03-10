# Active Plan

This is the execution source of truth. One milestone at a time.

## Current Goal
Implement Milestone 2: Cross-Portal Intake Slice.

---

## Milestone 1: Workspace Hardening
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
- Key instruction and memory files are present
- Agent and skill files are in place

---

## Milestone 2: Cross-Portal Intake Slice
**Status**: In progress

### Goal
Prove the first real multi-portal handoff with real auth, real persistence, auditability, and a hard stop at `initial-todos`.

### Thinnest Slice That Still Proves Value
- An authenticated clinic staff user submits a referral.
- The system creates a patient and case, generates a real patient onboarding auth link, and shows that link on the success screen for manual use.
- The patient opens the link, completes onboarding, signs ROI form 1, signs ROI form 2, and the case advances from `patient-onboarding` to `initial-todos`.
- The clinic sees the updated stage in a simple read-only referrals list.
- Front Desk sees the case in a simple read-only intake queue.
- Nothing downstream is implemented.

### Exact Scope
**In Scope**
- Minimal app scaffold required to run this slice
- Staff auth for one clinic role and one Front Desk role
- Clinic referral submission surface
- Referral success state with manual copyable patient onboarding link
- Patient onboarding access through a real generated auth link
- `Welcome & Preferences` screen
- `ROI Form 1` screen
- `ROI Form 2` screen
- `Onboarding Complete` screen
- Distinct workflow checkpoint that advances the case to `initial-todos`
- Clinic read-only referrals/status list
- Front Desk read-only intake queue
- Audit events for referral creation, auth-link generation, onboarding access, both ROI signatures, and the stage transition
- RLS for clinic, patient, and Front Desk access boundaries

**Out of Scope**
- Front Desk case detail surface
- Real invite email sending
- Real invite SMS sending
- Invite reminder logic
- ROI reminder logic
- Care partner prompt
- Care partner invitation
- Care partner auth
- Care partner status view
- Patient dashboard
- Patient checklist UI
- Patient TODO list UI
- Inclusion/Exclusion form
- Government ID upload
- Insurance card upload
- Patient messaging
- Clinic dashboard beyond simple referrals list
- Clinic document checklist
- Clinic document upload
- Clinic packet initialization UI
- Front Desk write actions
- Front Desk document review
- Front Desk screening actions
- Financial screening
- PTC assignment
- SLA timers and alerts
- Realtime subscriptions
- End referral
- Re-referral
- Admin/configuration UI

### Required Referral Fields
- Patient first name
- Patient last name
- Patient email
- Patient phone
- Patient preferred language
- DUSW contact name
- DUSW contact email
- Nephrologist contact name
- Nephrologist contact email

### Deferred Referral Fields
- Patient title
- Patient date of birth
- MRN
- Free-text clinic notes
- Attachments
- Additional contacts

### Patient Onboarding Screens
- `Welcome & Preferences`
- `ROI Form 1`
- `ROI Form 2`
- `Onboarding Complete`

### Deferred Onboarding Screens
- Care partner prompt
- Dashboard
- TODO list
- Document upload
- Message center
- Profile editing
- Support/help flow

### Auth Model
- Staff auth uses real Supabase Auth with seeded email/password accounts for one clinic user and one Front Desk user.
- `submitted_by_role` comes from the authenticated clinic user role.
- `referring_clinic_id` comes from the authenticated clinic user organization.
- Referral submission generates a real Supabase magic-link auth URL for the patient and displays it manually on the success state.
- The patient uses that link to enter onboarding.
- No password-creation screen, OTP entry screen, or separate email-verification screen exists in this milestone.

### Schema Decision
- Milestone 2 keeps clinic contact fields and ROI/current-consent state denormalized on `cases`.
- This is intentional MVP debt.
- `audit_events` is the immutable history.
- `cases` holds current workflow state for this slice.
- Future normalization is documented in `docs/decisions/002-first-slice.md` and is not part of this milestone.

### Minimum Tables
- `organizations`
- `profiles`
- `patients`
- `cases`
- `audit_events`

### Explicit Workflow Checkpoint
**Implementation Step**
- Implement a dedicated ROI completion checkpoint after `ROI Form 2`.
- On `ROI Form 2` completion, the system must write `roi_form_2_signed_at`, set `roi_completed_at`, write the ROI form 2 audit event, write the stage transition audit event, move the case from `patient-onboarding` to `initial-todos`, and update `stage_entered_at`.

**Acceptance Criterion**
- Completing `ROI Form 2` transitions the case from `patient-onboarding` to `initial-todos`, stores both ROI signature timestamps plus `roi_completed_at`, and creates the required audit events.

**Validation Checkpoint**
- Before `ROI Form 2` is signed, the case remains in `patient-onboarding`.
- After `ROI Form 2` is signed, the case is in `initial-todos`.
- `audit_events` contains referral created, auth link generated, onboarding accessed, ROI form 1 signed, ROI form 2 signed, and stage transitioned to `initial-todos`.

### Acceptance Criteria
- A seeded clinic staff user can submit a referral with the required fields.
- Referral submission creates a patient, case, case number, manual onboarding link, and audit events.
- A patient can complete `Welcome & Preferences`, `ROI Form 1`, and `ROI Form 2`.
- `ROI Form 2` completion triggers the explicit `patient-onboarding` to `initial-todos` transition.
- The clinic read-only referrals list shows the updated stage.
- The Front Desk read-only intake queue shows the case.
- RLS blocks unauthorized cross-portal access.
- No workflow beyond `initial-todos` is implemented.

### Exact User Journey
1. A seeded clinic user signs in.
2. The clinic user opens the referral form and submits patient and clinic-contact data.
3. The system creates the patient and case, generates a case number, writes audit events, sets the case to `patient-onboarding`, and displays a manual copyable onboarding link.
4. The clinic user sees the case in the clinic read-only referrals list as `patient-onboarding`.
5. The patient opens the onboarding link.
6. The patient completes `Welcome & Preferences`.
7. The patient signs `ROI Form 1`.
8. The patient signs `ROI Form 2`.
9. The system records both signatures, marks ROI complete, advances the case to `initial-todos`, and shows `Onboarding Complete`.
10. The clinic read-only referrals list shows the case at `initial-todos`.
11. A seeded Front Desk user signs in and sees the case in the read-only intake queue.

### Files Likely to Change
- Root app/config files
- `src/`
- `supabase/migrations/`
- `plans/ACTIVE_PLAN.md`
- `docs/WORKING_MEMORY.md`
- `docs/decisions/002-first-slice.md`

### Dependencies
- Minimal Next.js scaffold
- Supabase auth, database, and RLS wiring
- Seeded clinic and Front Desk users via `npm run seed:staff` in the configured Supabase project
- Manual display of the generated patient auth link

### Current Batch Status
- Completed in this batch:
  - Minimal Next.js app scaffold with only `/clinic`, `/patient`, and `/center`
  - Supabase SSR auth foundation and portal-aware proxy
  - Milestone 2 foundation migration with minimum schema and RLS
  - Organization seed data plus an idempotent `npm run seed:staff` bootstrap script for the clinic and Front Desk auth users
  - Seeded clinic and Front Desk auth users in the configured Supabase project
  - Live clinic email/password login verification with the seeded clinic user
  - Live referral submission verification through the clinic flow, including patient creation, case creation, audit events, and manual onboarding-link display
  - Step-5 fix: moved the initial referral action state out of the `use server` module so form posts execute successfully
  - Patient magic-link callback handling that establishes a session and redirects to `/patient`
  - Live patient onboarding verification through `Welcome & Preferences`, `ROI Form 1`, `ROI Form 2`, and `Onboarding Complete`
  - Distinct ROI completion checkpoint verification:
    - `roi_form_2_signed_at` written
    - `roi_completed_at` written
    - `roi-form-2-signed` audit event written
    - `stage-transitioned` audit event written
    - case advanced from `patient-onboarding` to `initial-todos`
    - `stage_entered_at` updated
  - Clinic read-only referrals/status list on `/clinic`, scoped to the authenticated clinic organization through the existing RLS path
  - Live step-7 verification of the clinic list:
    - authenticated clinic user sees the referrals/status list on `/clinic`
    - the list shows case number, patient name, current stage, last-updated time, and referral-created time
    - the list renders both `patient-onboarding` and `initial-todos` from live case data
    - a newly submitted referral appears immediately in the list with `patient-onboarding`
  - Front Desk login flow on `/center` for the seeded Front Desk user
  - Front Desk read-only intake queue on `/center`, using the existing RLS path that limits visible cases to `initial-todos`
  - Live step-8 verification of the center queue:
    - Front Desk login works with the seeded user
    - the queue shows case number, patient name, clinic name, current stage, and ROI completed timestamp
    - the visible queue count matches the live `initial-todos` case count
    - known live `patient-onboarding` cases do not appear in the queue
  - Step-9 automated coverage added for Milestone 2:
    - local workflow tests for referral creation defaults, ROI checkpoint guards, audit-row ordering, and onboarding-step progression
    - live Supabase integration coverage for clinic, patient, and Front Desk RLS boundaries
    - live Milestone 2 smoke coverage for referral creation, onboarding completion, `initial-todos` advancement, clinic visibility, and Front Desk queue visibility
  - Live step-9 verification:
    - the smoke test proves a case starts at `patient-onboarding`, cannot jump to `initial-todos` before ROI completion, then advances correctly on the ROI checkpoint
    - the live database row shows `roi_form_1_signed_at`, `roi_form_2_signed_at`, `roi_completed_at`, and `stage_entered_at`
    - the required audit events are present for the full slice
    - clinic users only see their own org's cases
    - patient users only see their own case
    - Front Desk only sees `initial-todos` cases
    - `patient-onboarding` cases do not appear in the Front Desk queue

### Validation
- Automated workflow coverage for `new-referral` to `patient-onboarding` to `initial-todos`
- RLS verification for clinic, patient, and Front Desk access
- One end-to-end smoke path covering referral submission, onboarding, ROI completion, clinic list update, and Front Desk queue visibility
- Build and typecheck
- Local/offline verification:
  - `npm run test:unit`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Live verification completed through step 9:
  - clinic login
  - referral submission
  - patient magic-link generation
  - patient onboarding progression
  - explicit ROI completion checkpoint
  - `initial-todos` transition
  - clinic referrals/status list rendering real case stages for the clinic org
  - Front Desk login and read-only intake queue
  - browser-visible RLS boundary check for `initial-todos` vs `patient-onboarding`
  - automated live Supabase smoke path and RLS tests via `npm run test:live:m2`

### Risks
- Bootstrap creep
- Auth creep
- Workflow creep
- Schema creep
- Milestone 2 is implemented; final review still needs to confirm no scope drift before declaring the milestone closed

### Explicit Defer List
- Real email invite sending
- Real SMS invite sending
- Invite reminder logic
- ROI reminder logic
- Care partner prompt
- Care partner invitation
- Care partner auth
- Care partner status view
- Patient dashboard
- Patient checklist UI
- Patient TODO list UI
- Inclusion/Exclusion form
- Government ID upload
- Insurance card upload
- Patient messaging
- Clinic dashboard beyond simple referrals list
- Clinic document checklist
- Clinic document upload
- Clinic packet initialization UI
- Front Desk case detail surface
- Front Desk write actions
- Front Desk document review
- Front Desk screening actions
- Financial screening
- PTC assignment
- SLA timers and alerts
- Realtime subscriptions
- End referral
- Re-referral
- Admin/configuration UI

### Recommended Implementation Order
1. Apply the Milestone 2 documentation updates
2. [x] Scaffold the minimal Next.js and Supabase app foundation
3. [x] Add the minimum schema and RLS
4. [x] Seed one clinic user and one Front Desk user in a configured Supabase project, using the committed organization seed data and `npm run seed:staff`
5. [x] Implement clinic referral creation and the manual onboarding-link success state
6. [x] Implement patient onboarding screens and the ROI completion checkpoint
7. [ ] Implement the clinic read-only referrals list
8. [ ] Implement the Front Desk read-only intake queue
9. [ ] Add workflow, RLS, and smoke coverage

---

## Milestone 3: Next Product Slice
**Status**: Not started

### Goal
Define the next narrow implementation slice after Milestone 2 validates the cross-portal intake handoff.

### Validation
- [TBD after Milestone 2 completion]

---

## Decision Log
- Keep `AGENTS.md` stable and free of temporary project state
- Put evolving execution state in `docs/WORKING_MEMORY.md`
- Put active milestone scope and validation in this file
- Put durable patterns and gotchas in `docs/LEARNINGS.md`
- Create ADRs for significant architecture decisions

## Stop-and-Fix Rule
If validation fails:
1. Do not move to the next milestone
2. Document the issue in `docs/WORKING_MEMORY.md`
3. Fix the issue
4. Re-run validation
5. Only then proceed
