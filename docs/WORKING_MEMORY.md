# Working Memory

Last updated: 03/10/2026

## Current Milestone
Milestone 2: Cross-Portal Intake Slice

## Status
- Completed: Workspace hardening and Codex workspace setup
- In progress: Milestone 2 implementation is complete through step 9 and ready for final review
- Blocked: None

## Completed
- Root `AGENTS.md` established for stable repo-wide rules
- Repo-local skills added under `.agents/skills/`
- Agent configs added (`planner`, `reviewer`, `database-architect`, `tester`)
- File-backed memory established in `docs/WORKING_MEMORY.md`, `plans/ACTIVE_PLAN.md`, `docs/IMPLEMENT.md`, and `docs/LEARNINGS.md`
- Subtree override files added for `reference/`, `src/`, and `supabase/`
- Reference prototypes added and protected as read-only
- Initial ADR structure established in `docs/decisions/`
- ADR-001 recorded the current platform direction: Next.js + Supabase
- Milestone 2 was selected and locked as the Cross-Portal Intake Slice
- Minimal Next.js scaffold added with only `/clinic`, `/patient`, and `/center`
- Supabase SSR auth foundation and portal-aware proxy added
- Milestone 2 foundation migration added for minimum schema and RLS
- Organization seed data added
- `npm run seed:staff` bootstrap script added and executed successfully for the clinic and Front Desk users
- Clinic login page added on `/clinic` for the clinic Supabase email/password path
- Clinic referral form added with the 9 locked Milestone 2 required fields
- Server-side referral action added to create the patient record, case record, case number, audit events, and patient magic link
- Manual onboarding-link success state added to the clinic flow
- Step 5 was verified live:
  - Clinic email/password login works with the seeded clinic user
  - Referral submission creates the patient row, case row, and required audit events
  - The patient magic-link URL is generated and displayed on the referral success state
- Step-5 fix applied: the initial referral action state now lives outside the `use server` module so the clinic form can post successfully
- Patient auth callback handling added so the magic-link establishes a session and redirects into `/patient`
- Patient onboarding screens added for `Welcome & Preferences`, `ROI Form 1`, `ROI Form 2`, and `Onboarding Complete`
- Distinct ROI completion checkpoint path added for `ROI Form 2`
- Step 6 was verified live:
  - The patient magic-link establishes a patient session and reaches `/patient`
  - `Welcome & Preferences` writes patient language plus case SMS/email consent
  - `ROI Form 1` writes `roi_form_1_signed_at` and the `roi-form-1-signed` audit event
  - `ROI Form 2` writes `roi_form_2_signed_at`, sets `roi_completed_at`, writes the ROI and stage-transition audit events, and moves the case to `initial-todos`
  - `/patient` shows the `Onboarding Complete` state after the checkpoint
- Clinic read-only referrals/status list added on `/clinic`
- Step 7 was verified live:
  - The authenticated clinic user sees a read-only referrals list for the clinic organization on `/clinic`
  - The list shows case number, patient name, current stage, `stage_entered_at` as the current update time, and referral creation time
  - The list renders both `patient-onboarding` and `initial-todos` stages correctly from live case data
  - Submitting a new referral updates the success state and immediately prepends the new case to the clinic list
- Front Desk login flow added on `/center` for the seeded Front Desk Supabase email/password path
- Front Desk read-only intake queue added on `/center`
- Step 8 was verified live:
  - Front Desk email/password login works with the seeded Front Desk user
  - `/center` renders a read-only intake queue with case number, patient name, clinic name, current stage, and ROI completed timestamp
  - The queue shows only live cases at `initial-todos`
  - Known live cases still at `patient-onboarding` do not appear in the queue, confirming the current RLS boundary from the browser-visible result
- Step 9 automated coverage added:
  - Local workflow tests cover referral creation defaults, referral audit ordering, ROI checkpoint guards, ROI checkpoint field updates, ROI checkpoint audit ordering, and onboarding-step progression
  - Live Supabase integration tests cover clinic, patient, and Front Desk RLS boundaries plus one Milestone 2 smoke path
- Step 9 was verified live:
  - The smoke path creates a referral, confirms the case starts at `patient-onboarding`, blocks invalid advancement to `initial-todos`, completes onboarding, writes both ROI timestamps, writes `roi_completed_at`, advances the case, and verifies clinic plus Front Desk visibility
  - The live RLS suite verifies clinic users only see their own org's cases, patient users only see their own case, Front Desk only sees `initial-todos`, and `patient-onboarding` cases do not appear in the Front Desk queue

## Locked Scope
- Clinic referral submission surface
- Manual copyable real patient auth link
- `Welcome & Preferences`
- `ROI Form 1`
- `ROI Form 2`
- `Onboarding Complete`
- Explicit `patient-onboarding` to `initial-todos` workflow transition
- Clinic read-only referrals list
- Front Desk read-only intake queue

## Explicit Defer List
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

## Schema Decision
- Milestone 2 keeps clinic contact fields and ROI/current-consent state denormalized on `cases`.
- This is intentional MVP debt.
- `audit_events` is the immutable history for the slice.
- Future normalization is documented in `docs/decisions/002-first-slice.md`.

## Workflow Checkpoint
- `ROI Form 2` completion is the explicit trigger for `patient-onboarding` to `initial-todos`.
- The transition must write both ROI timestamps, `roi_completed_at`, and the required audit events.

## Known Risks
- Milestone 2 keeps denormalized case fields intentionally
- Invite delivery is manual and temporary in this milestone
- Scope must stop at `initial-todos`
- Milestone 2 still needs a final review pass before it is declared closed

## Next Step
Review Milestone 2 as a whole. Do not begin Milestone 3 until the final review is approved.
