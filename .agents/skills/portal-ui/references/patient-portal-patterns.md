# Patient Portal UI Patterns

**Primary reference:** `reference/patient-mobile/page.tsx`

The patient portal has an **approved visual direction**. When implementing patient-facing UI, preserve that design language closely.

This file exists to help you reproduce the same tone, spacing, and interaction style in a maintainable production codebase. Do **not** copy the prototype blindly. Extract reusable patterns and rebuild them cleanly.

## Design Philosophy

The patient portal should feel:

- calm
- reassuring
- mobile-first
- clear and guided
- soft and modern, not clinical or harsh
- supportive for anxious users

This is not an internal ops dashboard. It should feel more guided, warm, and progress-oriented than the center portal.

## How to Use This Reference

1. Inspect `reference/patient-mobile/page.tsx` for real visual and interaction examples
2. Use the values below to keep styling consistent
3. Match the approved visual direction closely
4. Extract reusable components instead of mirroring the prototype file structure

If a production constraint forces a change, preserve:
- the overall visual tone
- mobile-first behavior
- spacing/radius/shadow language
- CTA emphasis
- bottom-navigation / guided-flow feel where relevant

## Color Palette

### Backgrounds

| Usage | Value | Example |
|-------|-------|---------|
| Page background | `bg-[#f0f5fb]` or `bg-[#f4f7fb]` | Outer page wrapper |
| Card surface | `bg-white` or `bg-white/95` | Content cards |
| Soft onboarding gradient | `bg-gradient-to-br from-[#f2f7ff] via-[#ecf3ff] to-[#e2edf8]` | Entry / onboarding surfaces |

### Primary Blue

| Usage | Value | Example |
|-------|-------|---------|
| Primary CTA / emphasis | `bg-[#3399e6]` | Main action buttons |
| Blue text accent | `text-[#2a6ead]` | Links, info text |
| Info surface | `bg-[#edf5ff]` | Informational callouts |
| CTA shadow | `shadow-[0_10px_24px_rgba(51,153,230,0.35)]` | Primary button elevation |

### Status Colors

| Usage | Value | Example |
|-------|-------|---------|
| Success | `text-green-500`, `bg-green-500` | Completion states |
| Warning | `text-amber-500`, `bg-amber-500` | Attention needed |
| Error | `bg-[#ef4444]` | Alerts / destructive state |

### Borders & Neutrals

| Usage | Value | Example |
|-------|-------|---------|
| Input/card borders | `border-[#dde7f2]` | Inputs, cards |
| Dividers | `border-[#e3ebf5]` or `border-[#dce7f2]` | Separators |
| Primary text | `text-slate-900` | Headings |
| Secondary text | `text-slate-500` or `text-slate-600` | Supporting copy |
| Muted text | `text-slate-400` | Placeholders, lower emphasis |

## Typography

Typical patterns from the approved design:

```tsx
// Main heading
<h1 className="text-[31px] font-bold tracking-tight text-slate-900">

// Section label
<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">

// Body copy
<p className="text-sm text-slate-600">

// Primary button text
<button className="text-base font-semibold">
```

Preferred font stack:
- Inter
- system fallbacks

Use readable type with strong hierarchy. Avoid tiny low-contrast text.

## Spacing and Sizing

Common patterns:
- page padding: `px-4` or `px-5`
- card padding: `p-4`
- common gaps: `gap-1`, `gap-2`, `gap-4`
- vertical section spacing: `space-y-4`

The patient UI should feel comfortably spaced, but not loose or empty.

## Border Radius

| Element | Value |
|---------|-------|
| Cards / elevated surfaces | `rounded-[24px]` |
| Buttons | `rounded-full` |
| Inputs | `rounded-xl` |
| Info cards / smaller surfaces | `rounded-xl` |
| Badges / pills | `rounded-full` |

Rounded corners are a major part of the visual identity. Keep them consistent.

## Shadows

| Usage | Value |
|-------|-------|
| Demo phone frame | `shadow-[0_28px_60px_rgba(15,23,42,0.24)]` |
| Elevated cards | `shadow-[0_20px_40px_rgba(15,23,42,0.11)]` |
| Floating surfaces | `shadow-[0_8px_18px_rgba(15,23,42,0.08)]` |
| Primary CTA | `shadow-[0_10px_24px_rgba(51,153,230,0.35)]` |

The design should feel elevated and soft, not flat or harsh.

## Common Component Patterns

### Bottom Navigation

Use for key patient-app sections where appropriate.

```tsx
<nav className="fixed bottom-0 left-0 right-0 border-t border-[#dce7f2] bg-white px-2 py-2">
  <div className="grid grid-cols-4 gap-1">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex flex-col items-center py-2 ${
          activeTab === tab.id ? 'text-[#3399e6]' : 'text-slate-400'
        }`}
      >
        <tab.icon className="h-5 w-5" />
        <span className="text-[10px] font-semibold">{tab.label}</span>
      </button>
    ))}
  </div>
</nav>
```

### Elevated Card

```tsx
<div className="rounded-[24px] bg-white/95 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.11)]">
  {children}
</div>
```

### Primary Button

```tsx
<button className="w-full rounded-full bg-[#3399e6] py-4 text-base font-semibold text-white shadow-[0_10px_24px_rgba(51,153,230,0.35)] transition hover:bg-[#2a8ad4] disabled:opacity-50">
  Continue
</button>
```

### Secondary Button

```tsx
<button className="w-full rounded-full border border-[#dde7f2] bg-white py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
  Cancel
</button>
```

### Info Card

```tsx
<div className="rounded-xl bg-[#edf5ff] px-3 py-2 text-xs text-[#2a6ead]">
  Information message here
</div>
```

### Form Input

```tsx
<div className="space-y-1.5">
  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
    Email Address
  </label>
  <input
    type="email"
    className="w-full rounded-xl border border-[#dde7f2] bg-white px-4 py-3.5 text-base outline-none transition focus:border-[#3399e6] focus:ring-2 focus:ring-[#3399e6]/20"
    placeholder="you@example.com"
  />
</div>
```

### Checklist / Progress Item

```tsx
<div className={`flex items-center gap-3 rounded-xl p-3 ${
  completed ? 'bg-green-50' : 'bg-white border border-[#dde7f2]'
}`}>
  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
    completed ? 'bg-green-500 text-white' : 'border-2 border-slate-300'
  }`}>
    {completed && <Check className="h-4 w-4" />}
  </div>
  <div className="flex-1">
    <p className={`font-medium ${completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
      {title}
    </p>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
</div>
```

## Screen Types to Preserve

The patient portal should preserve the design language across screens such as:
- entry / login / onboarding
- consent flows
- dashboard / home
- questionnaires
- document upload
- care team / messaging
- profile / support

When recreating these screens, inspect the mobile reference file for:
- spacing rhythm
- card patterns
- CTA treatment
- info messaging
- checklist/progress treatment
- bottom navigation behavior

## Icons

Use `lucide-react` consistently.

Common icon types for the patient portal:
- home
- profile
- care team
- help
- notifications
- check / complete
- document
- time / pending
- back / forward navigation

## What Not To Do

- Do not redesign the patient portal into a generic SaaS dashboard
- Do not introduce harsh colors or dense admin-style layouts
- Do not use raw default shadcn styling without matching the approved visual direction
- Do not flatten the radius/shadow/CTA language
- Do not copy the prototype file directly into production code
- Do not make major visual changes casually; preserve the approved direction
