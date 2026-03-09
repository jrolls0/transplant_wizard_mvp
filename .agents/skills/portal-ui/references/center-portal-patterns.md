# Transplant Center Portal UI Patterns

**Primary reference:** `reference/transplant-prototype/`

The transplant center portal is the main internal operations workspace for coordinators, specialists, and administrative staff. It should feel professional, operational, and workflow-driven.

This file is a **pattern reference**, not a requirement to copy the prototype literally. Use it to preserve the right interaction model, information density, and visual tone while building maintainable production code.

## How to Use This Reference

Use the prototype to understand:
- page layout and shell structure
- queue and dashboard patterns
- cockpit/tab workspace patterns
- modal and decision-flow structure
- data density and role-aware behavior

Recommended reference areas:
1. `reference/transplant-prototype/components/`
2. `reference/transplant-prototype/app/dashboard/`
3. `reference/transplant-prototype/app/cases/`
4. `reference/transplant-prototype/lib/data/`
5. `reference/transplant-prototype/lib/context/`

Do **not** treat any single component or file as a canonical production implementation. Extract patterns, then rebuild cleanly.

## Design Principles

- **Operational, not decorative**: this is an internal workflow product, not a marketing site
- **Data-dense but scannable**: information should be easy to scan, not sparse
- **Role-aware**: each role should see the right queues, actions, and emphasis
- **Decision-focused**: the next action should be obvious
- **Status-forward**: SLA, stage, blockers, and flags should be visible without hunting
- **Trustworthy**: avoid gimmicky styling or over-designed visuals
- **Responsive where needed**: desktop-first, but should still degrade cleanly

## Visual Direction

The center portal should generally feel like:
- neutral and professional
- structured, not playful
- clear under pressure
- suited for repeated daily use

Typical visual characteristics from the prototype:
- light page backgrounds
- white or near-white surfaces
- dark sidebar/navigation
- compact cards, queues, and tables
- strong use of status chips, pills, or badges
- visible workflow state

Do not overuse decorative gradients, oversized empty states, or highly stylized consumer-app patterns.

## Layout Patterns

### App Shell
Typical center portal structure:
- persistent sidebar
- top header / page title area
- main content region
- role-aware navigation

Good shell behaviors:
- fast scanning
- stable navigation
- enough whitespace to separate sections without feeling sparse
- clear content containment

### Role-Based Dashboards
Each role should get:
- different queue groupings
- different counts and action emphasis
- the same overall interaction language

Good dashboard traits:
- queue summaries should feel actionable
- cards/tables should map clearly to work queues
- important statuses should surface immediately
- avoid empty shell dashboards with generic filler content

## Queue Patterns

Queues are a core pattern for the center portal.

Good queue design should:
- highlight what needs attention
- show why the item matters
- make the next click obvious
- expose status without clutter

Typical useful fields:
- case number
- patient name
- current stage
- SLA / urgency
- assigned owner
- flags / blockers
- next required action

Queues may appear as:
- cards
- compact tables
- split panes
- tabbed queue views

Choose the format that best supports the role and task.

## Case Cockpit Pattern

The case cockpit is the main detailed workspace for a single case.

Typical cockpit structure:
- sticky or clearly visible case header
- tabbed or sectioned workspace
- summary + timeline + documents + tasks + decisions + messages
- visible stage / SLA / blockers / assignment context

Good cockpit behavior:
- keep the case identity visible
- make high-risk info obvious
- avoid hiding critical workflow state behind too many clicks
- tabs should separate concerns clearly without fragmenting context

## Tab / Section Guidance

Typical useful tabs:
- Overview / Summary
- Timeline / Audit
- Documents
- Tasks
- Messages
- Decisions
- Specialist Reviews
- Scheduling / Education, depending on flow

Tabs should:
- have clear labels
- not overload the user with too many states at once
- keep critical status/context accessible near the top

## Modal Patterns

The prototype uses modal-heavy workflow interactions. This is fine when:
- the user is making a decision
- the action has meaningful consequences
- rationale or explicit confirmation is required

Good modal design:
- clear title
- short explanation of what is being decided
- explicit outcome options
- rationale area when needed
- strong primary action
- safe cancel path

Use destructive or irreversible confirmations carefully and clearly.

## Table Patterns

Tables are appropriate for:
- larger queues
- pipeline views
- administrative review
- document/task lists

Good table behavior:
- sortable/scannable columns where useful
- compact but readable rows
- status indicators that are meaningful, not noisy
- row click or clear action affordance
- avoid overly wide tables with low-value columns

## Status and Color Guidance

Use color for:
- SLA / urgency
- stage context
- end/terminal states
- warnings / blockers

But keep this in mind:
- color should support meaning, not carry the entire interface
- avoid rainbow-heavy UI if it reduces scanability
- use consistent semantic meanings across screens

General semantic tendencies:
- green = complete / healthy / on track
- yellow / amber = at risk / pending attention
- red = overdue / blocked / destructive
- blue / neutral = informational or active state
- gray = ended / inactive / low emphasis

If stage-specific colors exist, use them consistently and sparingly.

## Example Interaction Patterns to Reuse

Good center portal patterns to preserve:
- role-based dashboards
- decision modals with rationale
- case cockpit with stable header + tabs
- queue summaries with clear next-action emphasis
- compact status chips
- sidebars and shell structure that reduce navigation friction

## What Not To Do

- Do not redesign the center portal into a consumer/mobile aesthetic
- Do not make dashboards sparse and generic
- Do not hide workflow-critical state behind multiple clicks
- Do not blindly copy prototype code
- Do not treat every queue as the same visual component if the role/task differs
- Do not over-style internal screens for “wow” at the expense of clarity

## Key Reference Areas

```text
reference/transplant-prototype/
├── app/
│   ├── dashboard/
│   ├── cases/
│   ├── inbox/
│   └── pipeline/
├── components/
│   ├── dashboard/
│   ├── case-cockpit/
│   ├── modals/
│   ├── pipeline/
│   ├── layout/
│   └── shared/
└── lib/
    ├── data/
    ├── context/
    └── utils/
```

Use these to understand:
- workflow structure
- information hierarchy
- layout composition
- interaction patterns