# Visual Reference Sources

This file defines the visual source-of-truth order for UI work in this repo.

## Primary Goal

When rebuilding or refining UI, prefer matching the approved existing prototype experience over inventing new styling.

The goal is not “generic good UI.”
The goal is visual and UX fidelity to the approved prototype, while still respecting the currently locked milestone scope.

## Source Priority

Use sources in this order:

1. Running prototype URL for the relevant surface
2. Saved screenshots of the approved prototype
3. `reference/patient-mobile/page.tsx`
4. Other reference prototype code under `reference/transplant-prototype/`

If sources disagree:
- prioritize the running prototype and screenshots over inferred styling from code
- preserve the locked milestone functionality and scope
- do not add deferred features just because they exist in the prototype

## Running Prototype URLs

### Patient Portal Prototype
- URL: `http://127.0.0.1:3001/mobile`

Use this for:
- auth entry / registration feel
- mobile shell
- spacing and visual density
- card treatment
- button style
- form hierarchy
- consent / long-form document presentation
- overall branded patient experience

### Transplant Center Prototype
- URL: `http://localhost:3000/dashboard/`

Use this for:
- center-side dashboard feel
- queue/table hierarchy
- cockpit/detail surfaces
- staff-facing layout and interaction patterns

## Screenshot Fallbacks

If the running prototype is unavailable, use saved screenshots in the repo as the visual fallback.

Recommended folder structure:
- `reference/patient-ui-targets/`
- `reference/center-ui-targets/`

When screenshots exist, treat them as strong visual references for:
- layout
- spacing
- typography feel
- color usage
- card styling
- form presentation
- mobile shell treatment

## Important Rule: Match Feel, Not Full Feature Scope

A prototype may contain more fields, flows, or screens than the currently locked milestone.

When rebuilding UI:
- match the prototype’s visual language as closely as possible
- do not automatically recreate all prototype features
- do not add deferred fields or flows unless the active milestone explicitly allows them

Examples:
- If the prototype has password creation, but the current milestone uses magic-link auth, keep magic-link auth and match the visual style only.
- If the prototype has extra registration fields, but the milestone defers them, keep the reduced field set and match the visual style only.

## When to Use Playwright

If Playwright MCP is available and the task is UI-related:

1. inspect the current rebuilt app
2. inspect the relevant running prototype
3. compare them screen-by-screen
4. identify the biggest mismatches before editing
5. after edits, capture screenshots of the rebuilt result for review

Use Playwright especially for:
- patient portal fidelity passes
- center portal fidelity passes
- pre-review visual regression checks

Do not use Playwright for:
- backend-only tasks
- schema-only work
- migrations / RLS work
- docs-only updates

## What To Compare During UI Work

When comparing rebuilt UI against the prototype, focus on:

- overall shell / frame
- page hierarchy
- spacing rhythm
- typography feel
- card/surface treatment
- form layout
- button styling
- visual density
- mobile-first behavior
- consent/long-form content presentation
- emotional tone of the surface

## Anti-Pattern

Do not replace an approved prototype style with generic AI-generated SaaS styling.

Avoid:
- generic centered auth cards when the prototype uses a more branded/mobile shell
- default shadcn-style cards if the prototype is more opinionated
- overly simplified form layouts that lose the original product feel
- inventing a new design direction when the prototype already answers the question

## UI Review Rule

Before approving a major UI change:
- compare the rebuilt screen to the relevant prototype source
- confirm whether the rebuilt version feels materially closer to the approved prototype
- if not, do another bounded fidelity pass before moving on