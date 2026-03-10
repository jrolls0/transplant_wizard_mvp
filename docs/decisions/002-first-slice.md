# ADR-002: First Implementation Slice Selection

## Status
Accepted

## Date
2026-03-09

## Context
Workspace hardening is complete, but no product code has been implemented yet. The first implementation slice needed to prove real stakeholder value without forcing early workflow-engine sprawl, document handling, or broad portal build-out.

## Decision
- Choose `Cross-Portal Intake Slice` as the first implementation milestone
- Use manual delivery of a real generated Supabase patient auth link
- Keep center visibility limited to a read-only Front Desk intake queue
- Keep referral contact fields and ROI/current-consent state denormalized on `cases`
- Stop the slice at the explicit `patient-onboarding` to `initial-todos` transition

## Why This Slice
- It proves the multi-portal handoff from clinic to patient to transplant center
- It validates real auth, real persistence, and auditable ROI completion
- It delivers visible product value without forcing uploads, messaging, tasks, decisions, or downstream workflow logic

## Consequences

### Positive
- Proves the earliest meaningful business handoff
- Keeps scope narrow enough for a first product milestone
- Preserves a clean boundary at `initial-todos`
- Makes the workflow checkpoint explicit and testable

### Negative
- Invite delivery is temporary and manual in this milestone
- Clinic contact fields and ROI/current-consent state remain denormalized on `cases`
- Downstream workflow remains unimplemented

## Alternatives Considered

### Option 2: Early Workflow Backbone
Rejected because it would require patient TODOs, uploads, Front Desk write actions, and early workflow-engine complexity before the intake handoff is proven.

### Option 3: Foundation Backbone
Rejected because it is architecture-heavy and lower in visible MVP value for the first product milestone.

## MVP Debt and Future Refactor Path
Keeping clinic contact fields and ROI/current-consent state on `cases` is intentional MVP debt for Milestone 2. When clinic collaboration or reusable consent workflows are implemented, split:
- clinic contact fields into a contact-focused table
- ROI/current-consent fields into a consent-focused table

`audit_events` remains the immutable signature and transition history.
