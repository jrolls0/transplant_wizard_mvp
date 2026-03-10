# Working Memory

Last updated: 03/09/2026

## Current Milestone
Milestone 2: Cross-Portal Intake Slice

## Status
- Completed: Workspace hardening and Codex workspace setup
- In progress: Milestone 2 step 5 is implemented and live-verified; step 6 has not started
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
- Patient onboarding, clinic referrals list, and Front Desk queue are still unimplemented
- No automated workflow or RLS verification exists yet for the full Milestone 2 slice

## Next Step
Review and approve step 5. Do not begin step 6 until this review is complete.
