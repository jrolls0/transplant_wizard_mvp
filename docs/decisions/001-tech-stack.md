# ADR-001: Tech Stack Selection

## Status
Accepted

## Date
2026-03-09

## Context
We need to build a HIPAA-compliant SaaS platform for kidney transplant referral workflow management. The platform has three portals (patient, clinic, center) and requires:
- Strong authentication with role-based access
- Audit logging for compliance
- Real-time updates for workflow state
- File upload and storage
- Mobile-first patient experience
- Rapid iteration for MVP

## Decision

### Frontend
- **Next.js 14+** (App Router) for all three portals
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for component library

### Backend
- **Supabase** for database, auth, storage, and edge functions
- **PostgreSQL** as the underlying database
- **Row Level Security (RLS)** for access control
- **Supabase Auth** with magic links (patient) and email/password (staff)

### Deployment
- **Vercel** for frontend hosting
- **Supabase Cloud** for backend (HIPAA BAA available)

### Prototypes Referenced
- Transplant Center prototype (architectural patterns)
- Patient Mobile prototype (UI/UX reference)

## Consequences

### Positive
- Supabase provides auth + database + storage in one platform
- Vercel + Next.js enables fast deployments
- shadcn/ui matches existing prototype styling
- RLS enforces access control at database level
- TypeScript catches errors early

### Negative
- Supabase edge functions have cold start latency
- RLS policies require careful design and testing
- Vendor lock-in to Supabase (mitigated by standard Postgres)

### Risks
- Supabase HIPAA BAA requires enterprise plan
- Need to verify Supabase meets all compliance requirements