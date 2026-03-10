# Engineering Learnings

Durable patterns, gotchas, and things that work (or don't). Keep entries short.

Last updated: 03/10/2026

---

## Patterns That Work

<!-- Format: **[Pattern]**: [Why it works] -->

*None yet. Add entries as patterns emerge during implementation.*

---

## Patterns That Don't Work

<!-- Format: **[Approach]**: [Why it failed] -->

*None yet. Add entries when something fails and you want to prevent retry.*

---

## Gotchas

<!-- Format: **[Gotcha]**: [How to avoid] -->

*None yet. Add entries for non-obvious issues discovered during development.*

---

## Database / Supabase

*Patterns specific to schema, RLS, migrations.*

---

## Frontend / UI

*Patterns specific to React, Next.js, styling.*

---

## Workflow Engine

- **Shared workflow/audit builders keep transitions consistent**: Centralizing Milestone 2 case-update payloads and audit-row builders in `src/lib/milestone2/workflow.ts` keeps server actions thin and reduces drift between referral creation and the ROI completion checkpoint.

---

## Testing

- **Split workflow coverage into pure builders plus live RLS/integration tests**: Milestone-sized server actions stay testable when stage-transition payloads and audit-row builders live in a small pure module, while one live Supabase suite covers the real RLS and checkpoint behavior without needing brittle browser-heavy E2E.
