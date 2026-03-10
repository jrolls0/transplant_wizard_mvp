---
name: portal-ui
description: UI component patterns for the Transplant Portal. Use when building dashboards, forms, modals, or any frontend UI work. Use this skill to preserve approved patient/mobile direction, center-portal operational UX, and overall healthcare-product consistency.
---

# Portal UI Patterns

## When to Use This Skill

Use this skill when:
- building user-facing screens
- creating role-based dashboards
- implementing patient-facing flows
- building modals or decision interfaces
- styling forms, cards, or navigation
- unsure about layout, spacing, color, or interaction treatment

## Design Philosophy

This is a healthcare product. Every design choice should be:

- **trustworthy**: calm, credible, not gimmicky
- **accessible**: readable, high-contrast enough, keyboard/focus aware
- **clear**: status, next steps, and actions should be obvious
- **consistent**: preserve shared interaction language across the product
- **appropriate to the portal**: patient and center experiences should not feel identical

## Portal-Specific Guidance

### Patient Portal

The patient portal has an **approved visual direction**.

Reference:
- `reference/patient-mobile/page.tsx`
- `references/patient-portal-patterns.md`

Your job is to:
1. preserve the approved visual and interaction direction closely
2. rebuild it as maintainable production components
3. extract reusable patterns instead of copying the prototype literally

Key characteristics:
- mobile-first
- calm blue-forward palette
- soft backgrounds and rounded surfaces
- supportive progress-oriented UI
- strong CTA treatment
- bottom-navigation / guided-flow feel where appropriate

If production constraints force changes, preserve:
- the visual tone
- mobile-first behavior
- spacing/radius/shadow language
- CTA emphasis
- user reassurance and clarity

### Transplant Center Portal

Reference:
- `reference/transplant-prototype/`
- `references/center-portal-patterns.md`

Key characteristics:
- desktop-first with responsive fallback
- professional, operational, data-dense UI
- role-based dashboards and queues
- strong status / stage / SLA visibility
- case cockpit as the main detailed workspace
- modal-heavy decision flows where explicit confirmation is needed

The goal is not to copy the prototype blindly. The goal is to preserve:
- the workflow model
- information density
- operational clarity
- role-aware structure

### Dialysis Clinic Portal

The clinic portal should generally:
- borrow interaction patterns from the center portal
- be simpler and lighter than the center portal
- focus on referral submission and status tracking
- remain clear and tablet-friendly

## Component Foundation

Use `shadcn/ui` as the base component system where appropriate, but customize it to match portal-specific visual direction.

Do not ship raw default shadcn styling for the patient portal.

## Common Patterns

### SLA Status Badge

Use for time-sensitivity across the product:

```tsx
import { Badge } from '@/components/ui/badge';

function SLABadge({ daysRemaining }: { daysRemaining: number }) {
  const variant =
    daysRemaining > 2 ? 'success' :
    daysRemaining > 0 ? 'warning' :
    'destructive';

  return (
    <Badge variant={variant} className="font-mono">
      {daysRemaining > 0 ? `${daysRemaining}d` : 'OVERDUE'}
    </Badge>
  );
}
```

### Role-Based Dashboard Queues

Center portal uses queue cards filtered by role:

```tsx
const ROLE_QUEUES: Record<Role, string[]> = {
  'front-desk': ['pending-ie-review', 'pending-doc-validation', 'ready-for-screening'],
  'ptc': ['my-cases', 'at-risk', 'pending-action'],
  'senior-coord': ['flagged-cases', 'escalations', 'decisions-needed'],
  'financial': ['pending-financial-review'],
  'specialist': ['pending-my-review'],
};
```

### Decision Modal

Decision modals should feel **consequential** and explicit, not like default generic forms:

```tsx
function DecisionModal({ decisionType, outcomes, onSubmit }: DecisionModalProps) {
  const [outcome, setOutcome] = useState('');
  const [rationale, setRationale] = useState('');

  return (
    <Dialog>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Decision: {decisionType}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ outcome, rationale }); }}>
          <RadioGroup value={outcome} onValueChange={setOutcome} className="space-y-3">
            {outcomes.map(o => (
              <div key={o.value} className="flex items-center space-x-3">
                <RadioGroupItem value={o.value} id={o.value} />
                <label htmlFor={o.value} className="text-sm font-medium">
                  {o.label}
                </label>
              </div>
            ))}
          </RadioGroup>

          <Textarea
            placeholder="Rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className="mt-4"
          />

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={!outcome}>
              Record Decision
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Browser-based visual verification

When working on patient or center UI and Playwright MCP is available:

1. Before editing, inspect:
   - current rebuilt app
   - the relevant running prototype reference
2. Compare:
   - layout hierarchy
   - spacing
   - typography feel
   - card treatment
   - button styling
   - visual density
   - form/consent presentation
3. After editing, use Playwright again to verify the result and capture screenshots for review.

Reference prototype URLs for this workspace:
- Patient prototype: http://127.0.0.1:3001/mobile
- Center prototype: http://localhost:3000/dashboard/

Do not use Playwright for backend-only tasks or schema-only batches.
Use it when:
- replicating an existing prototype
- doing UI fidelity passes
- reviewing visual regressions before approval

## Working Rules
- Match the portal’s approved visual direction before inventing new styling
- Use realistic healthcare/workflow content instead of generic placeholders
- Build reusable components from patterns; do not copy prototype files directly
- Keep patient UI calm and supportive
- Keep center UI operational and scan-friendly
- Prefer consistency over novelty

## What NOT to Do
- do not invent new color schemes casually
- do not use generic placeholder content for important states
- do not create empty shell screens with no meaningful state
- do not turn patient UI into an admin/dashboard aesthetic
- do not flatten or ignore the approved patient visual language
- do not blindly clone prototype code
- do not use raw default shadcn styling for patient-facing UI