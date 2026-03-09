# Transplant Referral Platform: Complete Technical Handoff

**Version:** 1.2  
**Last Updated:** 2026-03-09  
**Changes from v1.1:** Restored all content from v1.0, fixed patient portal prototype references, added Section 15 (AI Agent Context Management)

## Document Purpose

This document provides **everything** an AI coding agent (Claude Code, Codex CLI, etc.) needs to build a production-ready kidney transplant referral SaaS platform. It captures all context, design decisions, workflow rules, data models, and implementation guidance from extensive prior analysis.

**Target:** AI coding agent building a functional MVP with Next.js, TypeScript, and a real backend (Postgres/Supabase or similar).

**Source Materials Synthesized:**
- Workflow specification document (13 stages + appendices)
- Transplant Center portal prototype (95% complete, ~60 files) - **primary architectural reference**
- Patient portal prototype (single-file mobile UI demo, ~3,933 lines) - **UI/UX visual reference only**
- Gap analysis and fix instructions
- Synthesized design proposal

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Concepts](#2-core-concepts)
3. [Complete Data Model](#3-complete-data-model)
4. [Database Schema](#4-database-schema)
5. [Authentication Model](#5-authentication-model)
6. [Workflow Engine](#6-workflow-engine)
7. [Patient Portal Specification](#7-patient-portal-specification)
8. [Dialysis Clinic Portal Specification](#8-dialysis-clinic-portal-specification)
9. [Transplant Center Portal Specification](#9-transplant-center-portal-specification)
10. [API Design](#10-api-design)
11. [Implementation Priorities](#11-implementation-priorities)
12. [UI/UX Guidelines](#12-uiux-guidelines)
13. [Configuration System](#13-configuration-system)
14. [Testing Strategy](#14-testing-strategy)
15. [AI Agent Context Management](#15-ai-agent-context-management)
- [Appendix A: Prototype File Mapping](#appendix-a-prototype-file-mapping)
- [Appendix B: Quick Reference](#appendix-b-quick-reference)

---

## 1. System Overview

### 1.1 What We're Building

A HIPAA-compliant SaaS platform to digitize the kidney transplant referral-to-evaluation workflow, initially for ChristianaCare, then scalable to other transplant centers.

### 1.2 The Three Portals

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRANSPLANT REFERRAL PLATFORM                     │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│   patient.domain    │    clinic.domain    │      center.domain          │
│   (Patient Portal)  │  (Dialysis Clinic)  │   (Transplant Center)       │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ - Mobile-first PWA  │ - Desktop web app   │ - Desktop web app           │
│ - Patient + Care    │ - DUSW role         │ - 7+ roles:                 │
│   Partner access    │ - Nephrologist role │   - Front Desk              │
│ - Complete TODOs    │ - Submit referrals  │   - Pre-Transplant Coord    │
│ - Sign ROIs         │ - Upload documents  │   - Senior Coordinator      │
│ - Upload documents  │ - View case status  │   - Financial Coordinator   │
│ - Watch education   │ - Respond to        │   - Dietitian               │
│ - Select scheduling │   record requests   │   - Social Worker           │
│   windows           │                     │   - Nephrology              │
│ - Message care team │                     │   - (Pharmacist, Surgeon)   │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
```

### 1.3 High-Level Data Flow

```
1. DIALYSIS CLINIC submits referral
   └── Creates Case record + sends Patient secure link

2. PATIENT onboards via Patient Portal
   └── Signs ROIs → Completes TODOs (I/E form, Gov ID, Insurance)

3. TRANSPLANT CENTER processes case through 13 stages
   └── Screening → Financial → Records → Specialist Reviews → Decision

4. PATIENT completes Education
   └── Video + Form + Healthcare Guidance

5. SCHEDULING via huddle + Surginet (external)
   └── Case reaches "Scheduled" status

OR at any point:
   └── Case ends → Standardized end reason + letter → Re-referral possible
```

### 1.4 Tech Stack (Recommended)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14+ (App Router) | SSR, file-based routing, existing prototype |
| Styling | Tailwind CSS + shadcn/ui | Prototype uses these, rapid iteration |
| Language | TypeScript | Type safety, existing prototype |
| Database | PostgreSQL (via Supabase) | Row-level security, real-time, auth built-in |
| Auth | Supabase Auth or NextAuth | Multi-portal, role-based access |
| File Storage | Supabase Storage or S3 | HIPAA-eligible, signed URLs |
| Hosting | Vercel or Cloudflare Pages | Edge functions, easy deployment |

---

## 2. Core Concepts

### 2.1 Tasks as First-Class Objects

Tasks are NOT just UI buttons. They are **structured data** with:
- Explicit assignment (role + optional user)
- Due dates and SLA status
- Completion tracking (who, when, notes)
- Types that determine behavior

**Task Types (16 total):**
```typescript
type TaskType =
  | 'review-document'        // Front Desk validates uploaded doc
  | 'review-ie-responses'    // Front Desk reviews I/E answers
  | 'confirm-ie-review'      // Front Desk confirms I/E acceptable (HARD GATE)
  | 'collect-missing-info'   // Front Desk gathers missing I/E values
  | 'send-message'           // Any role sends message
  | 'log-external-step'      // Log phone call, fax, etc.
  | 'financial-screening'    // Financial reviews insurance
  | 'specialist-review'      // Dietitian/SW/Nephro reviews case
  | 'request-records'        // Request docs from clinic or external
  | 'partial-packet-decision'// Senior decides proceed/wait/end
  | 'final-decision'         // Senior makes approval decision
  | 'send-end-letter'        // Front Desk sends termination letter
  | 'schedule-appointment'   // Enter scheduling windows
  | 'confirm-surginet'       // EXTERNAL STEP: confirm in Surginet
  | 're-referral-review'     // Senior reviews re-referral eligibility
  | 'assign-ptc'             // PTC assignment task
  | 'screening-override'     // Senior reviews flagged case
  | 'scheduling-huddle'      // Record huddle decision
  | 'education-follow-up';   // Follow up on education completion
```

### 2.2 Decisions as First-Class Objects

Decisions require **rationale** and are **auditable**. They drive workflow routing.

**Decision Types (9 total):**
```typescript
type DecisionType =
  | 'screening-routing'      // Front Desk: Financial vs Senior
  | 'screening-override'     // Senior: Override flagged screening
  | 'partial-packet'         // Senior: Proceed with partial records
  | 'hard-block-override'    // Senior: Override missing 2728 (rare)
  | 'specialist-conflict'    // Senior: Resolve conflicting reviews
  | 'final-decision'         // Senior: Approve vs Not Approved
  | 'no-response-3x'         // Senior: Continue vs End after 3 attempts
  | 'end-referral'           // Any authorized role: End case
  | 're-referral-eligibility'; // Senior: Re-referral proceed/end
```

### 2.3 EXTERNAL STEP Pattern

Actions outside our platform are tracked as tasks with `isExternalStep: true`:
- Phone calls (log attempt + outcome)
- Surginet appointment confirmation
- Faxing/mailing letters
- External record retrieval

The system tracks THAT the step was done, not the external system state.

### 2.4 Contact Attempt Escalation

The system tracks contact attempts across all channels:
- After attempt #1: Flag "No Response x1"
- After attempt #2: Flag "No Response x2"
- After attempt #3: Auto-create Decision for Senior Coordinator
  - Options: "Continue outreach (reset)" vs "End referral (No Response)"

### 2.5 Hard-Block Documents

Some documents MUST be received before case can advance:
- **Medicare 2728 Form** is a hard-block for Records Collection stage
- Hard-block override requires Senior Coordinator decision with rationale

### 2.6 Document Age/Expiry

Documents have `maxAgeDays` configuration:
- Government ID: 365 days
- Insurance Card: 180 days
- Lab Results: 90 days
- Medicare 2728: 365 days

Used for re-referral eligibility checks.

---

## 3. Complete Data Model

### 3.1 Core Entities

```typescript
// ============ USER & AUTH ============

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  portalAccess: ('patient' | 'clinic' | 'center')[];
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

type UserRole =
  | 'patient'
  | 'care-partner'
  | 'clinic-dusw'
  | 'clinic-nephrologist'
  | 'front-desk'
  | 'ptc'
  | 'senior-coordinator'
  | 'financial'
  | 'dietitian'
  | 'social-work'
  | 'nephrology'
  | 'pharmacist'
  | 'surgeon'
  | 'admin';

// ============ CASE ============

interface Case {
  id: string;
  caseNumber: string; // TC-2026-0001 format
  
  // Patient
  patient: Patient;
  carePartner?: CarePartner;
  
  // Referral source
  referringClinicId: string;
  referringClinicName: string;
  clinicContacts: ClinicContact[];
  referralSubmittedBy: 'dusw' | 'nephrologist';
  referralSubmittedAt: string;
  
  // Workflow state
  stage: CaseStage;
  stageEnteredAt: string;
  daysInStage: number;
  slaStatus: SLAStatus;
  slaDueDate: string;
  
  // Ownership
  assignedPTC?: string; // userId
  ptcAssignedAt?: string;
  
  // Flags (array of strings for flexibility)
  flags: string[];
  
  // Stage-specific state
  consent: ConsentState;
  initialTodosComplete: InitialTodosState;
  ieConfirmReviewComplete: boolean;
  contactAttempts: number;
  lastContactAttempt?: string;
  financialStatus?: FinancialStatus;
  educationProgress?: EducationProgress;
  schedulingState?: SchedulingState;
  schedulingDecision?: SchedulingDecision;
  schedulingWindows?: string[];
  appointmentConfirmed?: boolean;
  appointmentDate?: string;
  
  // End state
  endReason?: string;
  endRationale?: string;
  endedAt?: string;
  endedBy?: string;
  letterDraft?: string;
  letterApprovedAt?: string;
  
  // Re-referral linkage
  linkedFromCaseId?: string; // Original case if this is re-referral
  linkedToCaseId?: string;   // New case if original was re-referred
  
  createdAt: string;
  updatedAt: string;
}

type CaseStage =
  | 'new-referral'
  | 'patient-onboarding'
  | 'initial-todos'
  | 'follow-through'
  | 'intermediary-step'
  | 'initial-screening'
  | 'financial-screening'
  | 'records-collection'
  | 'medical-records-review'
  | 'specialist-review'
  | 'final-decision'
  | 'education'
  | 'scheduling'
  | 'scheduled'
  | 'ended'
  | 're-referral-review';

type SLAStatus = 'on-track' | 'at-risk' | 'overdue';

type FinancialStatus = 
  | 'pending' 
  | 'cleared' 
  | 'not-cleared' 
  | 'needs-clarification';

// ============ PATIENT & CONTACTS ============

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  preferredLanguage: 'en' | 'es';
  mrn?: string; // Medical record number if available
}

interface CarePartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  consentedToNotifications: boolean;
  consentedToViewStatus: boolean;
  invitedAt: string;
  acceptedAt?: string;
}

interface ClinicContact {
  userId: string;
  name: string;
  email: string;
  role: 'dusw' | 'nephrologist';
}

// ============ CONSENT ============

interface ConsentState {
  roiSigned: boolean;
  roiSignedAt?: string;
  smsConsent: boolean;
  emailConsent: boolean;
  carePartnerConsent: boolean;
}

// ============ TODOS ============

interface InitialTodosState {
  inclusionExclusion: boolean;
  governmentId: boolean;
  insuranceCard: boolean;
}

// ============ EDUCATION ============

interface EducationProgress {
  videoWatched: boolean;
  videoWatchedAt?: string;
  confirmationFormComplete: boolean;
  confirmationFormAt?: string;
  healthcareGuidanceReviewed: boolean;
  healthcareGuidanceAt?: string;
}

// ============ SCHEDULING ============

interface SchedulingDecision {
  type: 'direct-evaluation' | 'testing-first';
  carePartnerRequired: boolean;
  appointmentTypes: string[];
  notes?: string;
  decidedBy: string;
  decidedAt: string;
}

type SchedulingState =
  | 'awaiting-huddle'
  | 'in-progress'
  | 'pending-patient-selection'
  | 'pending-surginet'
  | 'scheduled';

// ============ TASK ============

interface Task {
  id: string;
  caseId: string;
  type: TaskType;
  title: string;
  description?: string;
  
  // Assignment
  assignedToRole: UserRole;
  assignedToUser?: string; // userId, optional
  
  // Status
  status: TaskStatus;
  priority: TaskPriority;
  
  // SLA
  dueDate: string;
  slaStatus: SLAStatus;
  
  // External step tracking
  isExternalStep: boolean;
  externalSystem?: string;
  
  // Completion
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
  
  createdAt: string;
}

type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============ DECISION ============

interface Decision {
  id: string;
  caseId: string;
  type: DecisionType;
  title: string;
  options: string[];
  
  // Resolution
  selectedOption?: string;
  rationale?: string;
  decidedBy?: string;
  decidedAt?: string;
  status: 'pending' | 'completed';
  
  // End referral specific
  letterDraft?: string;
  letterApproved?: boolean;
  letterApprovedAt?: string;
  
  createdAt: string;
}

// ============ DOCUMENT ============

interface Document {
  id: string;
  caseId: string;
  
  // Classification
  type: string; // e.g., 'government-id', 'medicare-2728'
  name: string;
  ownership: DocumentOwnership;
  
  // Status
  status: DocumentStatus;
  isHardBlock: boolean;
  
  // Upload details
  uploadedAt?: string;
  uploadedBy?: string;
  source: DocumentSource;
  fileUrl?: string;
  fileSize?: number;
  
  // Review
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  
  // Expiry
  expiresAt?: string;
  
  createdAt: string;
}

type DocumentOwnership = 'patient' | 'dusw' | 'nephrologist' | 'shared';
type DocumentStatus = 
  | 'required' 
  | 'received' 
  | 'needs-review' 
  | 'validated' 
  | 'rejected' 
  | 'expired';
type DocumentSource = 'patient' | 'clinic' | 'external-retrieval';

// ============ MESSAGE ============

interface Message {
  id: string;
  caseId: string;
  threadId: string;
  
  // Sender
  fromUserId: string;
  fromUserName: string;
  fromUserRole: UserRole;
  
  // Recipients
  toRecipients: MessageRecipient[];
  
  // Content
  subject?: string;
  body: string;
  channel: MessageChannel;
  templateUsed?: string;
  
  // Contact tracking
  isContactAttempt: boolean;
  attemptNumber?: number;
  
  // Status
  sentAt: string;
  readAt?: string;
  
  createdAt: string;
}

interface MessageRecipient {
  type: 'patient' | 'care-partner' | 'clinic-dusw' | 'clinic-nephrologist' | 'staff';
  userId?: string;
  name: string;
}

type MessageChannel = 'in-app' | 'sms' | 'email';

// ============ SPECIALIST REVIEW ============

interface SpecialistReview {
  id: string;
  caseId: string;
  specialistType: 'dietitian' | 'social-work' | 'nephrology' | 'pharmacist' | 'surgeon';
  
  // Assignment
  assignedTo?: string;
  taskId: string;
  
  // Outcome
  outcome?: 'clear' | 'needs-clarification' | 'escalate';
  notes?: string;
  
  // Completion
  completedAt?: string;
  completedBy?: string;
  
  createdAt: string;
}

// ============ INCLUSION/EXCLUSION ============

interface InclusionExclusionData {
  // Basic
  onDialysis: boolean | null;
  dialysisStartMonth?: string;
  dialysisStartYear?: string;
  dialysisType?: 'hemodialysis' | 'peritoneal';
  
  // Physical
  heightFeet?: number;
  heightInches?: number;
  weight?: number;
  
  // Medical history (ternary: yes/no/not-sure)
  previousTransplant?: 'yes' | 'no' | 'not-sure';
  previousTransplantDetails?: string;
  activeCancer?: 'yes' | 'no' | 'not-sure';
  heartConditions?: 'yes' | 'no' | 'not-sure';
  lungConditions?: 'yes' | 'no' | 'not-sure';
  liverConditions?: 'yes' | 'no' | 'not-sure';
  hivPositive?: 'yes' | 'no' | 'not-sure';
  hepatitisB?: 'yes' | 'no' | 'not-sure';
  hepatitisC?: 'yes' | 'no' | 'not-sure';
  
  // Substances
  tobaccoUse?: 'yes' | 'no' | 'prefer-not-to-answer';
  tobaccoQuitDate?: string;
  alcoholUse?: 'yes' | 'no' | 'prefer-not-to-answer';
  substanceUse?: 'yes' | 'no' | 'prefer-not-to-answer';
  
  // Support
  hasSupport: boolean | null;
  supportDetails?: string;
  
  submittedAt?: string;
  
  // Missing fields tracking
  missingFields?: string[];
}

// ============ AUDIT ============

interface AuditEvent {
  id: string;
  caseId: string;
  eventType: string;
  description: string;
  performedBy: string; // userId
  performedByName: string;
  performedByRole: UserRole;
  performedAt: string;
  metadata?: Record<string, unknown>;
}

// ============ DIALYSIS CLINIC ============

interface DialysisClinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  fax?: string;
  
  // Contacts
  duswContacts: ClinicStaffMember[];
  nephrologistContacts: ClinicStaffMember[];
  
  createdAt: string;
  updatedAt: string;
}

interface ClinicStaffMember {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}
```

### 3.2 Configuration Entities

```typescript
// ============ STAGE DEFINITIONS ============

interface StageDefinition {
  id: CaseStage;
  name: string;
  shortName: string;
  order: number;
  slaDays: number;
  description: string;
  rolesThatCanAdvance: UserRole[];
  autoAdvanceConditions?: string; // JSON config
}

// ============ DOCUMENT CATALOG ============

interface DocumentCatalogItem {
  type: string;
  name: string;
  ownership: DocumentOwnership;
  isRequired: boolean;
  isHardBlock: boolean;
  maxAgeDays?: number;
  description?: string;
}

// ============ END REASONS ============

interface EndReasonCode {
  code: string;
  label: string;
  category: 'financial' | 'clinical' | 'patient' | 'administrative';
  reReferralRequirements: string[];
  letterTemplate: string;
}

// ============ MESSAGE TEMPLATES ============

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  subject?: string;
  body: string;
  variables: string[]; // e.g., ['patientName', 'caseNumber']
  channel: MessageChannel;
}
```


---

## 4. Database Schema

### 4.1 PostgreSQL Schema (Supabase-ready)

```sql
-- ============================================
-- USERS & AUTH
-- ============================================

CREATE TYPE user_role AS ENUM (
  'patient', 'care-partner',
  'clinic-dusw', 'clinic-nephrologist',
  'front-desk', 'ptc', 'senior-coordinator', 'financial',
  'dietitian', 'social-work', 'nephrology', 'pharmacist', 'surgeon',
  'admin'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  portal_access TEXT[] DEFAULT '{}', -- ['patient', 'clinic', 'center']
  clinic_id UUID REFERENCES dialysis_clinics(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DIALYSIS CLINICS
-- ============================================

CREATE TABLE dialysis_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  fax TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CASES
-- ============================================

CREATE TYPE case_stage AS ENUM (
  'new-referral', 'patient-onboarding', 'initial-todos', 'follow-through',
  'intermediary-step', 'initial-screening', 'financial-screening',
  'records-collection', 'medical-records-review', 'specialist-review',
  'final-decision', 'education', 'scheduling', 'scheduled',
  'ended', 're-referral-review'
);

CREATE TYPE sla_status AS ENUM ('on-track', 'at-risk', 'overdue');
CREATE TYPE financial_status AS ENUM ('pending', 'cleared', 'not-cleared', 'needs-clarification');
CREATE TYPE scheduling_state AS ENUM ('awaiting-huddle', 'in-progress', 'pending-patient-selection', 'pending-surginet', 'scheduled');

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE NOT NULL, -- TC-2026-0001
  
  -- Patient (denormalized for performance)
  patient_id UUID NOT NULL,
  patient_first_name TEXT NOT NULL,
  patient_last_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT,
  patient_dob DATE,
  patient_language TEXT DEFAULT 'en',
  patient_mrn TEXT,
  
  -- Care partner
  care_partner_id UUID,
  care_partner_name TEXT,
  care_partner_email TEXT,
  care_partner_phone TEXT,
  care_partner_notification_consent BOOLEAN DEFAULT FALSE,
  care_partner_view_consent BOOLEAN DEFAULT FALSE,
  
  -- Referral source
  clinic_id UUID REFERENCES dialysis_clinics(id),
  clinic_name TEXT NOT NULL,
  clinic_dusw_name TEXT,
  clinic_dusw_email TEXT,
  clinic_nephrologist_name TEXT,
  clinic_nephrologist_email TEXT,
  referral_submitted_by TEXT, -- 'dusw' or 'nephrologist'
  referral_submitted_at TIMESTAMPTZ,
  
  -- Workflow state
  stage case_stage NOT NULL DEFAULT 'new-referral',
  stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
  sla_status sla_status DEFAULT 'on-track',
  sla_due_date TIMESTAMPTZ,
  
  -- Ownership
  assigned_ptc_id UUID REFERENCES users(id),
  ptc_assigned_at TIMESTAMPTZ,
  
  -- Flags (flexible string array)
  flags TEXT[] DEFAULT '{}',
  
  -- Consent
  roi_signed BOOLEAN DEFAULT FALSE,
  roi_signed_at TIMESTAMPTZ,
  sms_consent BOOLEAN DEFAULT FALSE,
  email_consent BOOLEAN DEFAULT FALSE,
  care_partner_consent BOOLEAN DEFAULT FALSE,
  
  -- Initial TODOs
  ie_completed BOOLEAN DEFAULT FALSE,
  gov_id_completed BOOLEAN DEFAULT FALSE,
  insurance_completed BOOLEAN DEFAULT FALSE,
  ie_confirm_review_complete BOOLEAN DEFAULT FALSE,
  
  -- Contact tracking
  contact_attempts INT DEFAULT 0,
  last_contact_attempt TIMESTAMPTZ,
  
  -- Financial
  financial_status financial_status,
  
  -- Education
  education_video_watched BOOLEAN DEFAULT FALSE,
  education_video_watched_at TIMESTAMPTZ,
  education_form_complete BOOLEAN DEFAULT FALSE,
  education_form_complete_at TIMESTAMPTZ,
  education_guidance_reviewed BOOLEAN DEFAULT FALSE,
  education_guidance_reviewed_at TIMESTAMPTZ,
  
  -- Scheduling
  scheduling_state scheduling_state,
  scheduling_type TEXT, -- 'direct-evaluation' or 'testing-first'
  scheduling_care_partner_required BOOLEAN DEFAULT TRUE,
  scheduling_appointment_types TEXT[],
  scheduling_notes TEXT,
  scheduling_decided_by UUID REFERENCES users(id),
  scheduling_decided_at TIMESTAMPTZ,
  scheduling_windows TEXT[],
  appointment_confirmed BOOLEAN DEFAULT FALSE,
  appointment_date TIMESTAMPTZ,
  
  -- End state
  end_reason TEXT,
  end_rationale TEXT,
  ended_at TIMESTAMPTZ,
  ended_by UUID REFERENCES users(id),
  letter_draft TEXT,
  letter_approved_at TIMESTAMPTZ,
  
  -- Re-referral linkage
  linked_from_case_id UUID REFERENCES cases(id),
  linked_to_case_id UUID REFERENCES cases(id),
  
  -- Inclusion/Exclusion data (JSONB for flexibility)
  ie_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cases_stage ON cases(stage);
CREATE INDEX idx_cases_sla_status ON cases(sla_status);
CREATE INDEX idx_cases_assigned_ptc ON cases(assigned_ptc_id);
CREATE INDEX idx_cases_clinic ON cases(clinic_id);
CREATE INDEX idx_cases_patient_email ON cases(patient_email);

-- ============================================
-- TASKS
-- ============================================

CREATE TYPE task_type AS ENUM (
  'review-document', 'review-ie-responses', 'confirm-ie-review',
  'collect-missing-info', 'send-message', 'log-external-step',
  'financial-screening', 'specialist-review', 'request-records',
  'partial-packet-decision', 'final-decision', 'send-end-letter',
  'schedule-appointment', 'confirm-surginet', 're-referral-review',
  'assign-ptc', 'screening-override', 'scheduling-huddle', 'education-follow-up'
);

CREATE TYPE task_status AS ENUM ('pending', 'in-progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type task_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  assigned_to_role user_role NOT NULL,
  assigned_to_user_id UUID REFERENCES users(id),
  
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  
  due_date TIMESTAMPTZ,
  sla_status sla_status DEFAULT 'on-track',
  
  is_external_step BOOLEAN DEFAULT FALSE,
  external_system TEXT,
  
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_case ON tasks(case_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_role ON tasks(assigned_to_role);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================
-- DECISIONS
-- ============================================

CREATE TYPE decision_type AS ENUM (
  'screening-routing', 'screening-override', 'partial-packet',
  'hard-block-override', 'specialist-conflict', 'final-decision',
  'no-response-3x', 'end-referral', 're-referral-eligibility'
);

CREATE TYPE decision_status AS ENUM ('pending', 'completed');

CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type decision_type NOT NULL,
  title TEXT NOT NULL,
  options TEXT[] NOT NULL,
  
  selected_option TEXT,
  rationale TEXT,
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  status decision_status DEFAULT 'pending',
  
  letter_draft TEXT,
  letter_approved BOOLEAN DEFAULT FALSE,
  letter_approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decisions_case ON decisions(case_id);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decisions_type ON decisions(type);

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TYPE document_ownership AS ENUM ('patient', 'dusw', 'nephrologist', 'shared');
CREATE TYPE document_status AS ENUM ('required', 'received', 'needs-review', 'validated', 'rejected', 'expired');
CREATE TYPE document_source AS ENUM ('patient', 'clinic', 'external-retrieval');

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- e.g., 'government-id', 'medicare-2728'
  name TEXT NOT NULL,
  ownership document_ownership NOT NULL,
  
  status document_status DEFAULT 'required',
  is_hard_block BOOLEAN DEFAULT FALSE,
  
  uploaded_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES users(id),
  source document_source,
  file_url TEXT,
  file_size INT,
  
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_case ON documents(case_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);

-- ============================================
-- MESSAGES
-- ============================================

CREATE TYPE message_channel AS ENUM ('in-app', 'sms', 'email');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL, -- Groups related messages
  
  from_user_id UUID REFERENCES users(id),
  from_user_name TEXT NOT NULL,
  from_user_role user_role NOT NULL,
  
  to_recipients JSONB NOT NULL, -- Array of {type, userId, name}
  
  subject TEXT,
  body TEXT NOT NULL,
  channel message_channel DEFAULT 'in-app',
  template_used TEXT,
  
  is_contact_attempt BOOLEAN DEFAULT FALSE,
  attempt_number INT,
  
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_case ON messages(case_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_from_user ON messages(from_user_id);

-- ============================================
-- SPECIALIST REVIEWS
-- ============================================

CREATE TYPE specialist_type AS ENUM ('dietitian', 'social-work', 'nephrology', 'pharmacist', 'surgeon');
CREATE TYPE review_outcome AS ENUM ('clear', 'needs-clarification', 'escalate');

CREATE TABLE specialist_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  specialist_type specialist_type NOT NULL,
  
  assigned_to UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  
  outcome review_outcome,
  notes TEXT,
  
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_specialist_reviews_case ON specialist_reviews(case_id);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  
  performed_by UUID REFERENCES users(id),
  performed_by_name TEXT,
  performed_by_role user_role,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_case ON audit_events(case_id);
CREATE INDEX idx_audit_type ON audit_events(event_type);
CREATE INDEX idx_audit_performed_at ON audit_events(performed_at);

-- ============================================
-- CONFIGURATION TABLES
-- ============================================

CREATE TABLE stage_definitions (
  id case_stage PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  display_order INT NOT NULL,
  sla_days INT NOT NULL,
  description TEXT,
  roles_that_can_advance user_role[],
  auto_advance_config JSONB
);

CREATE TABLE document_catalog (
  type TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ownership document_ownership NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  is_hard_block BOOLEAN DEFAULT FALSE,
  max_age_days INT,
  description TEXT
);

CREATE TABLE end_reason_codes (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL, -- 'financial', 'clinical', 'patient', 'administrative'
  re_referral_requirements TEXT[],
  letter_template TEXT
);

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[],
  channel message_channel DEFAULT 'in-app'
);

-- ============================================
-- SEED CONFIGURATION DATA
-- ============================================

-- Stage Definitions
INSERT INTO stage_definitions (id, name, short_name, display_order, sla_days, description) VALUES
('new-referral', 'New Referral', 'Ref', 1, 1, 'Referral received and awaiting intake review.'),
('patient-onboarding', 'Patient Onboarding', 'ROI', 2, 3, 'Consent and communication preferences are collected.'),
('initial-todos', 'Initial TODOs', 'TODO', 3, 4, 'Patient completes I/E, ID, and insurance items.'),
('follow-through', 'Follow Through', 'Follow', 4, 3, 'Front desk confirms I/E review and closes gaps.'),
('intermediary-step', 'Intermediary Step', 'Interm', 5, 3, 'Missing inclusion/exclusion values are collected.'),
('initial-screening', 'Initial Screening', 'Screen', 6, 3, 'Routing decision to financial or senior queue.'),
('financial-screening', 'Financial Screening', 'Fin', 7, 3, 'Coverage is verified and cleared or ended.'),
('records-collection', 'Records Collection', 'Rec', 8, 7, 'Clinic packet and hard-block records are collected.'),
('medical-records-review', 'Medical Records Review', 'Med', 9, 4, 'Senior reviews packet completeness and clinical readiness.'),
('specialist-review', 'Specialist Review', 'Spec', 10, 5, 'Dietitian, social work, nephrology complete parallel reviews.'),
('final-decision', 'Final Decision', 'Dec', 11, 2, 'Senior coordinator issues transplant pathway decision.'),
('education', 'Education', 'Edu', 12, 5, 'Patient education deliverables are completed.'),
('scheduling', 'Scheduling', 'Sched', 13, 5, 'Huddle, windows, and Surginet confirmation are completed.'),
('scheduled', 'Scheduled', 'Done', 14, 999, 'Appointment is confirmed and active.'),
('ended', 'Ended', 'End', 15, 1, 'Referral is closed with approved rationale and letter.'),
('re-referral-review', 'Re-Referral Review', 'ReRef', 16, 3, 'Senior reviews eligibility for re-entry from ended case.');

-- Document Catalog
INSERT INTO document_catalog (type, name, ownership, is_required, is_hard_block, max_age_days) VALUES
('government-id', 'Government ID', 'patient', TRUE, FALSE, 365),
('insurance-card', 'Insurance Card', 'patient', TRUE, FALSE, 180),
('inclusion-exclusion-form', 'Inclusion/Exclusion Form', 'patient', TRUE, FALSE, NULL),
('medicare-2728', 'Medicare 2728 Form', 'dusw', TRUE, TRUE, 365),
('dialysis-summary', 'Dialysis Treatment Summary', 'dusw', TRUE, FALSE, 90),
('lab-results', 'Lab Results (last 3 mo)', 'nephrologist', TRUE, FALSE, 90),
('hepatitis-panel', 'Hepatitis Panel', 'nephrologist', TRUE, FALSE, 365),
('cardiology-clearance', 'Cardiology Clearance', 'shared', FALSE, FALSE, 180),
('outside-cardiology-records', 'Outside Cardiology Records', 'shared', FALSE, FALSE, 180),
('pcp-records', 'PCP Records', 'shared', FALSE, FALSE, 365);

-- End Reason Codes
INSERT INTO end_reason_codes (code, label, category, re_referral_requirements, letter_template) VALUES
('FIN-INS-NA', 'Financial - Insurance not accepted', 'financial', ARRAY['Updated accepted insurance coverage verification'], 'financial_not_accepted'),
('FIN-VERIFY', 'Financial - Unable to verify coverage', 'financial', ARRAY['Verified active policy details from payer'], 'financial_unverified'),
('CLN-INCLUSION', 'Clinical - Does not meet inclusion criteria', 'clinical', ARRAY['Documented change in inclusion criteria factors'], 'clinical_inclusion'),
('CLN-EXCLUSION', 'Clinical - Exclusion criteria present', 'clinical', ARRAY['Specialist clearance for prior exclusion criteria'], 'clinical_exclusion'),
('CLN-CONTRA', 'Clinical - Medical contraindication', 'clinical', ARRAY['Updated physician documentation resolving contraindication'], 'clinical_contra'),
('PAT-NORESP', 'No response after 3 attempts', 'patient', ARRAY['Patient direct contact and consent confirmation'], 'patient_no_response'),
('PAT-WITHDRAW', 'Patient withdrew interest', 'patient', ARRAY['Patient written request to restart evaluation'], 'patient_withdraw'),
('ADM-INCOMPLETE', 'Incomplete packet - unable to proceed', 'administrative', ARRAY['Complete required packet including hard-block documents'], 'administrative_incomplete'),
('OTHER', 'Other (requires detailed explanation)', 'administrative', ARRAY['Senior coordinator documented review for re-entry'], 'other');
```

### 4.2 Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own case
CREATE POLICY patients_own_case ON cases
  FOR SELECT USING (
    auth.uid() = patient_id OR 
    auth.uid() = care_partner_id
  );

-- Clinic staff can see cases they referred
CREATE POLICY clinic_staff_cases ON cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('clinic-dusw', 'clinic-nephrologist')
      AND u.clinic_id = cases.clinic_id
    )
  );

-- Transplant center staff can see all cases
CREATE POLICY center_staff_all_cases ON cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('front-desk', 'ptc', 'senior-coordinator', 'financial', 
                     'dietitian', 'social-work', 'nephrology', 'pharmacist', 'surgeon', 'admin')
    )
  );
```

---

## 5. Authentication Model

### 5.1 Multi-Portal Authentication

```
┌────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PATIENT PORTAL                                                    │
│  ├── Magic link email (no password)                                │
│  ├── First access creates patient user record                     │
│  └── Care partner gets separate magic link                        │
│                                                                    │
│  CLINIC PORTAL                                                     │
│  ├── Email + password login                                        │
│  ├── Clinic admin creates staff accounts                          │
│  └── Role determines DUSW vs Nephrologist permissions             │
│                                                                    │
│  CENTER PORTAL                                                     │
│  ├── Email + password login                                        │
│  ├── SSO integration possible (future)                            │
│  └── Role determines dashboard and permissions                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Role-Permission Matrix

| Action | Patient | CarePartner | DUSW | Nephro | FrontDesk | PTC | Senior | Financial | Specialist |
|--------|---------|-------------|------|--------|-----------|-----|--------|-----------|------------|
| View own case | ✓ | Limited | - | - | - | - | - | - | - |
| Complete TODOs | ✓ | - | - | - | - | - | - | - | - |
| Upload patient docs | ✓ | - | - | - | - | - | - | - | - |
| Submit referral | - | - | ✓ | ✓ | - | - | - | - | - |
| Upload clinic docs | - | - | ✓ | ✓ | - | - | - | - | - |
| View clinic cases | - | - | ✓ | ✓ | - | - | - | - | - |
| View all center cases | - | - | - | - | ✓ | ✓ | ✓ | ✓ | - |
| Validate documents | - | - | - | - | ✓ | - | - | - | - |
| Route screening | - | - | - | - | ✓ | - | - | - | - |
| Assign PTC | - | - | - | - | - | - | ✓ | - | - |
| Take patient | - | - | - | - | - | ✓ | - | - | - |
| Financial decision | - | - | - | - | - | - | - | ✓ | - |
| Specialist review | - | - | - | - | - | - | - | - | ✓ |
| Final decision | - | - | - | - | - | - | ✓ | - | - |
| End referral | - | - | - | - | - | - | ✓ | ✓ | ✓ |
| Configure system | - | - | - | - | - | - | ✓ | - | - |

### 5.3 Session Handling

```typescript
// JWT payload structure
interface JWTPayload {
  sub: string;        // user id
  email: string;
  role: UserRole;
  portalAccess: string[];
  clinicId?: string;  // For clinic staff
  caseId?: string;    // For patients (their case)
  iat: number;
  exp: number;
}

// Middleware checks
function requireRole(allowedRoles: UserRole[]) {
  return (req, res, next) => {
    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

---

## 6. Workflow Engine

### 6.1 Stage Transition Rules

The workflow engine enforces these transitions:

```typescript
const STAGE_TRANSITIONS: Record<CaseStage, {
  nextStages: CaseStage[];
  conditions: string[];
}> = {
  'new-referral': {
    nextStages: ['patient-onboarding'],
    conditions: ['Case created, patient notified']
  },
  'patient-onboarding': {
    nextStages: ['initial-todos'],
    conditions: ['ROI signed (both forms)']
  },
  'initial-todos': {
    nextStages: ['follow-through'],
    conditions: ['I/E form submitted (partial or complete)', 'Gov ID uploaded', 'Insurance uploaded']
  },
  'follow-through': {
    nextStages: ['intermediary-step', 'initial-screening'],
    conditions: [
      'ieConfirmReviewComplete === true (HARD GATE)',
      'If missing I/E fields → intermediary-step',
      'If complete → initial-screening'
    ]
  },
  'intermediary-step': {
    nextStages: ['initial-screening'],
    conditions: ['All missing I/E values collected']
  },
  'initial-screening': {
    nextStages: ['financial-screening', 'medical-records-review'],
    conditions: [
      'Front Desk routes: financial OR senior override',
      'If routed to senior and approved → financial',
      'If routed to senior and not approved → ended'
    ]
  },
  'financial-screening': {
    nextStages: ['records-collection', 'ended'],
    conditions: [
      'Financial status = cleared → records-collection',
      'Financial status = not-cleared → ended'
    ]
  },
  'records-collection': {
    nextStages: ['medical-records-review', 'ended'],
    conditions: [
      '2728 received (hard-block cleared) → medical-records-review',
      'Senior override for missing hard-block → medical-records-review',
      'Senior decides end → ended'
    ]
  },
  'medical-records-review': {
    nextStages: ['specialist-review', 'ended'],
    conditions: [
      'Senior approves → specialist-review',
      'Senior ends → ended'
    ]
  },
  'specialist-review': {
    nextStages: ['final-decision'],
    conditions: ['All 3 baseline reviews completed (dietitian, SW, nephrology)']
  },
  'final-decision': {
    nextStages: ['education', 'ended'],
    conditions: [
      'Senior approves → education',
      'Senior does not approve → ended'
    ]
  },
  'education': {
    nextStages: ['scheduling'],
    conditions: ['All education items complete (video, form, guidance)']
  },
  'scheduling': {
    nextStages: ['scheduled'],
    conditions: ['Surginet confirmation logged (EXTERNAL STEP complete)']
  },
  'scheduled': {
    nextStages: [], // Terminal state (active appointment)
    conditions: []
  },
  'ended': {
    nextStages: ['re-referral-review'], // Via "Start Re-Referral" action
    conditions: []
  },
  're-referral-review': {
    nextStages: ['financial-screening', 'medical-records-review', 'ended'],
    conditions: [
      'Return requirements met + financial reverification needed → financial-screening',
      'Return requirements met + no reverification → medical-records-review',
      'Requirements not met → ended'
    ]
  }
};
```

### 6.2 Auto-Advancement Logic

```typescript
function maybeAdvanceCase(caseData: Case, tasks: Task[], documents: Document[]): CaseStage | null {
  const currentStage = caseData.stage;
  
  switch (currentStage) {
    case 'patient-onboarding':
      if (caseData.consent.roiSigned) {
        return 'initial-todos';
      }
      break;
      
    case 'initial-todos':
      const { inclusionExclusion, governmentId, insuranceCard } = caseData.initialTodosComplete;
      if (inclusionExclusion && governmentId && insuranceCard) {
        return 'follow-through';
      }
      break;
      
    case 'follow-through':
      if (!caseData.ieConfirmReviewComplete) {
        return null; // HARD GATE - cannot advance
      }
      // Check if I/E has missing fields
      const hasMissingIE = caseData.ieData?.missingFields?.length > 0;
      return hasMissingIE ? 'intermediary-step' : 'initial-screening';
      
    case 'records-collection':
      // Check 2728 hard-block
      const hardBlockDoc = documents.find(d => d.type === 'medicare-2728' && d.isHardBlock);
      if (hardBlockDoc?.status !== 'validated') {
        // Check for hard-block override decision
        const override = decisions.find(d => 
          d.type === 'hard-block-override' && d.status === 'completed'
        );
        if (!override) return null; // Cannot advance
      }
      return 'medical-records-review';
      
    case 'specialist-review':
      const specialistTasks = tasks.filter(t => t.type === 'specialist-review');
      const allComplete = specialistTasks.length >= 3 && 
        specialistTasks.every(t => t.status === 'completed');
      if (allComplete) {
        return 'final-decision';
      }
      break;
      
    case 'education':
      const { videoWatched, confirmationFormComplete, healthcareGuidanceReviewed } = 
        caseData.educationProgress || {};
      if (videoWatched && confirmationFormComplete && healthcareGuidanceReviewed) {
        return 'scheduling';
      }
      break;
      
    case 'scheduling':
      if (caseData.appointmentConfirmed) {
        return 'scheduled';
      }
      break;
  }
  
  return null;
}
```

### 6.3 SLA Calculation

```typescript
function calculateSLAStatus(stageEnteredAt: Date, slaDays: number): SLAStatus {
  const now = new Date();
  const elapsed = differenceInBusinessDays(now, stageEnteredAt);
  const dueDate = addBusinessDays(stageEnteredAt, slaDays);
  
  if (now > dueDate) {
    return 'overdue';
  } else if (elapsed >= slaDays - 1) {
    return 'at-risk';
  } else {
    return 'on-track';
  }
}

// Run daily or on case access
function updateCaseSLAs() {
  const cases = db.cases.findMany({ 
    where: { stage: { notIn: ['ended', 'scheduled'] } }
  });
  
  for (const c of cases) {
    const stageDef = stageDefinitions.find(s => s.id === c.stage);
    const newStatus = calculateSLAStatus(c.stageEnteredAt, stageDef.slaDays);
    
    if (newStatus !== c.slaStatus) {
      db.cases.update({
        where: { id: c.id },
        data: { 
          slaStatus: newStatus,
          daysInStage: differenceInDays(new Date(), c.stageEnteredAt)
        }
      });
      
      // Create escalation task if overdue
      if (newStatus === 'overdue' && c.assignedPTC) {
        createTask({
          caseId: c.id,
          type: 'sla-escalation',
          title: `Case SLA Overdue: ${stageDef.name}`,
          assignedToRole: 'senior-coordinator',
          priority: 'urgent'
        });
      }
    }
  }
}
```

### 6.4 Contact Attempt Escalation

```typescript
function syncContactAttemptEscalation(caseData: Case): {
  updatedFlags: string[];
  createDecision?: Decision;
  createTask?: Task;
} {
  const attemptFlags = ['No Response x1', 'No Response x2', 'No Response x3'];
  let flags = caseData.flags.filter(f => !attemptFlags.includes(f));
  
  if (caseData.contactAttempts === 1) {
    flags.push('No Response x1');
  } else if (caseData.contactAttempts === 2) {
    flags.push('No Response x2');
  } else if (caseData.contactAttempts >= 3) {
    flags.push('No Response x3');
    
    // Check if decision already exists
    const existingDecision = db.decisions.findFirst({
      where: {
        caseId: caseData.id,
        type: 'no-response-3x',
        status: 'pending'
      }
    });
    
    if (!existingDecision) {
      return {
        updatedFlags: flags,
        createDecision: {
          caseId: caseData.id,
          type: 'no-response-3x',
          title: 'No Response After 3 Attempts',
          options: [
            'Continue outreach (reset counter)',
            'End referral (No Response)'
          ],
          status: 'pending'
        },
        createTask: {
          caseId: caseData.id,
          type: 'final-decision',
          title: 'Decision Required: No Response After 3 Attempts',
          assignedToRole: 'senior-coordinator',
          priority: 'urgent'
        }
      };
    }
  }
  
  return { updatedFlags: flags };
}
```


---

## 7. Patient Portal Specification

### 7.1 Overview

The Patient Portal is a **mobile-first progressive web app** designed for patients undergoing transplant evaluation. The existing prototype has excellent UI/UX that should be preserved.

**Key Characteristics:**
- Mobile-first responsive design
- Simplified, guided experience
- Progress-focused navigation
- AI assistant (Amelia) for guidance
- Care Partner access with limited permissions

### 7.2 User Flows

#### 7.2.1 Onboarding Flow

```
1. Patient receives secure link via SMS/email (no PHI in message)
   └── Link contains unique token, not case data

2. Registration Screen
   ├── Enter first name, last name
   ├── Verify email (pre-filled from referral)
   ├── Set notification preferences (SMS consent, email consent)
   └── Select preferred language (English/Spanish)

3. ROI Consent Flow (TWO forms required)
   ├── Screen 1: Medical Records ROI
   │   ├── Expandable consent text sections
   │   ├── Checkboxes for key acknowledgments
   │   └── "I Agree" button (disabled until all checked)
   │
   └── Screen 2: HIPAA Authorization
       ├── Similar expandable sections
       ├── Required checkboxes
       └── "I Agree and Continue" button

4. Care Partner Prompt
   ├── Option A: Invite Care Partner Now
   │   ├── Enter name, email, phone
   │   ├── Consent checkbox for notifications
   │   └── Consent checkbox for status viewing
   │
   └── Option B: Skip for Now
       └── Added to TODO list for later

5. Coordinator Introduction Overlay
   ├── Meet "Amelia" virtual assistant
   └── "Let's Get Started" button → Home screen
```

#### 7.2.2 Home Screen (Dashboard)

```
┌─────────────────────────────────────────────────┐
│  Welcome, [FirstName]!                           │
│  ───────────────────────────                     │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  YOUR NEXT STEP                          │    │
│  │  ─────────────────                       │    │
│  │  [Icon] Upload Government ID             │    │
│  │                                          │    │
│  │  Complete this step to keep your         │    │
│  │  transplant evaluation moving.           │    │
│  │                                          │    │
│  │  [████████████ START ████████████]       │    │
│  │                                          │    │
│  │  Takes about 5 minutes                   │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  YOUR PROGRESS                           │    │
│  │  ─────────────                           │    │
│  │  [═══════════════════░░░░░░░░░] 50%      │    │
│  │  Step 3 of 6                             │    │
│  │                                          │    │
│  │  ✅ Signed release forms                 │    │
│  │  ✅ Health questionnaire                 │    │
│  │  ⏳ Upload ID                   [Open]   │    │
│  │  ⏳ Upload insurance card       [Open]   │    │
│  │  ⏳ Watch education video       [Open]   │    │
│  │  ⏳ Schedule appointment        [Open]   │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  MESSAGES                                │    │
│  │  ─────────                               │    │
│  │  2 new messages                 [View →] │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘

Bottom Navigation:
[🏠 Home] [💬 Care Team] [👤 Profile] [❓ Help]
```

### 7.3 Key Screens

#### 7.3.1 Inclusion/Exclusion Form (Health Questionnaire)

Multi-step form with progress indicator:

**Step 1: Basic Health Info**
- On dialysis? (Yes/No)
- If yes: When started? (Month/Year dropdowns)
- If yes: Type? (Hemodialysis/Peritoneal)
- Height (Feet + Inches dropdowns)
- Weight (number input)

**Step 2: Medical History**
- Previous transplant? (Yes/No/Not sure)
- Active cancer? (Yes/No/Not sure)
- Heart conditions? (Yes/No/Not sure)
- Lung conditions? (Yes/No/Not sure)
- Liver conditions? (Yes/No/Not sure)
- HIV positive? (Yes/No/Not sure)
- Hepatitis B? (Yes/No/Not sure)
- Hepatitis C? (Yes/No/Not sure)
- Tobacco use? (Yes/No/Prefer not to answer)
- Alcohol use? (Yes/No/Prefer not to answer)
- Other substance use? (Yes/No/Prefer not to answer)

**Step 3: Support System**
- Support person identified? (Yes/No)
- If yes: Details (text field)

**Behavior:**
- "Not sure" answers create flag for Front Desk review
- Partial submission allowed (creates intermediary-step if missing required)
- Auto-save as user progresses

#### 7.3.2 Document Upload

```
┌─────────────────────────────────────────────────┐
│  Upload Government ID                            │
│  ─────────────────────                           │
│                                                  │
│  Upload a clear photo of the FRONT side only.    │
│  Accepted: Driver's license, State ID, Passport  │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │                                          │    │
│  │     📷 [Tap to take photo]               │    │
│  │        or                                │    │
│  │     📁 [Choose from files]               │    │
│  │                                          │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Tips for a clear photo:                         │
│  • Make sure all text is readable                │
│  • Avoid glare and shadows                       │
│  • Include all four corners                      │
│                                                  │
│  [Previous uploads for this document]            │
│  ┌─────────────────────────────────────────┐    │
│  │  id_front_20260308.jpg    ✓ Validated    │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### 7.3.3 Care Team / Message Center

Two tabs:
1. **Virtual Assistant (Amelia)** - AI chat for guidance, FAQ
2. **Message Center** - Threads with care team staff

```
Message Thread View:
┌─────────────────────────────────────────────────┐
│  ← Sarah Johnson                                 │
│  Dialysis Social Worker                          │
│  ─────────────────────────────────────────────── │
│                                                  │
│  [Avatar] Sarah Johnson              8:41 AM     │
│  Hi Jeremy, I reviewed your chart this morning.  │
│                                                  │
│  [You]                               8:45 AM     │
│  Thanks. Can you confirm what labs are still     │
│  outstanding for transplant workup?              │
│                                                  │
│  [Avatar] Sarah Johnson              8:49 AM     │
│  Yes. You still need repeat HLA and updated      │
│  hepatitis panel. I can send two nearby lab      │
│  options and available hours.                    │
│                                                  │
│  ─────────────────────────────────────────────── │
│  [Message input]                    [📎] [Send]  │
└─────────────────────────────────────────────────┘
```

#### 7.3.4 Education

Three TODO items with visual completion tracking:

1. **Watch Transplant Education Video** (~80 min)
   - Embedded video player
   - Prompt to watch with support person
   - Tracks completion (must reach end)

2. **Complete Education Confirmation Form**
   - Confirmation of video completion
   - Support person details
   - Current medications/allergies/pharmacy
   - Doctor contact information

3. **Review Healthcare Guidance**
   - Informational checklist (age-appropriate)
   - Dental clearance, PCP visit, screening tests
   - Checkbox acknowledgment

#### 7.3.5 Scheduling

Shows after education complete:

```
┌─────────────────────────────────────────────────┐
│  Select Appointment Time                         │
│  ─────────────────────────                       │
│                                                  │
│  Your care team has provided these available     │
│  windows. Please select your preferred time.     │
│                                                  │
│  ⚠️ Your care partner must attend this          │
│     appointment with you.                        │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  ○ Tuesday, March 15                     │    │
│  │    9:00 AM - 11:00 AM                    │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │  ○ Wednesday, March 16                   │    │
│  │    1:00 PM - 3:00 PM                     │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │  ● Thursday, March 17                    │    │
│  │    10:00 AM - 12:00 PM                   │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  □ I confirm my care partner can attend          │
│                                                  │
│  [████████ CONFIRM SELECTION ████████]           │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 7.4 Technical Notes

**Preserve from existing prototype:**
- Mobile phone frame wrapper (for demo/presentation)
- Blue primary color (#3399e6)
- Card-based UI with shadows
- Gradient accents on CTAs
- Clean typography hierarchy
- Bottom navigation pattern

**Functionality to implement:**
- Real API calls instead of local state
- File upload to Supabase Storage
- Push notifications (PWA)
- Offline capability for forms
- Real-time message sync

---

## 8. Dialysis Clinic Portal Specification

### 8.1 Overview

The Clinic Portal is a **desktop web application** for dialysis clinic staff to submit referrals and manage documentation.

**Two roles with distinct responsibilities:**
1. **DUSW (Dialysis Unit Social Worker)** - Primary referral submitter, owns DUSW documents
2. **Nephrologist** - Can submit referrals, owns nephrologist documents

### 8.2 Navigation Structure

```
clinic.transplant.app
│
├── /login
│
├── /dashboard              Clinic home with summary stats
│
├── /new-referral           Submit new referral form
│
├── /patients               List of referred patients
│   └── /patients/:id       Patient case detail view
│       ├── ?tab=status     Case progress overview
│       ├── ?tab=documents  Document checklist + upload
│       └── ?tab=messages   Messages from transplant center
│
├── /tasks                  Pending tasks (record requests)
│
└── /settings               Clinic configuration
```

### 8.3 Key Screens

#### 8.3.1 New Referral Form

```
┌─────────────────────────────────────────────────────────────────────┐
│  New Transplant Referral                                            │
│  ═══════════════════════                                            │
│                                                                     │
│  PATIENT INFORMATION                                                │
│  ─────────────────────                                              │
│  First Name *        [________________]                             │
│  Last Name *         [________________]                             │
│  Email *             [________________]                             │
│  Phone *             [________________]                             │
│  Date of Birth       [__/__/____]                                   │
│  Preferred Language  [English ▼]                                    │
│                                                                     │
│  CLINIC CONTACTS FOR THIS PATIENT                                   │
│  ────────────────────────────────                                   │
│  You are submitting as: DUSW                                        │
│                                                                     │
│  DUSW Contact *                                                     │
│  Name    [Sarah Johnson_____] (you)                                 │
│  Email   [sjohnson@clinic.org]                                      │
│                                                                     │
│  Nephrologist Contact *                                             │
│  Name    [________________]                                         │
│  Email   [________________]                                         │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  After submission:                                          │    │
│  │  • Patient receives secure portal link (no PHI in message)  │    │
│  │  • Patient must sign ROI before documents can be uploaded   │    │
│  │  • You will see required documents in patient's record      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  [Cancel]                               [Submit Referral →]         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 8.3.2 Patient List (Dashboard)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Referred Patients                                        [+ New]   │
│  ═══════════════════                                                │
│                                                                     │
│  Filter: [All ▼]  [Search patient name...]                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  PATIENT         STAGE              DOCS     LAST UPDATED     │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │  Garcia, Maria   Records Collection  4/7     2 hours ago      │ │
│  │  🟡 Needs docs                               [View →]         │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │  Thompson, James Initial Screening   3/3     1 day ago        │ │
│  │  ✅ Complete                                 [View →]         │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │  Williams, Sarah Patient Onboarding  0/3     3 days ago       │ │
│  │  ⏳ Awaiting ROI                             [View →]         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 8.3.3 Patient Documents Tab

The document checklist shows ownership and allows uploads:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Documents - Garcia, Maria                                          │
│  ═══════════════════════════                                        │
│                                                                     │
│  Case: TC-2026-0042  |  Stage: Records Collection                   │
│                                                                     │
│  YOUR DOCUMENTS (DUSW)                                              │
│  ─────────────────────                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⬛ Medicare 2728 Form           REQUIRED • HARD BLOCK        │   │
│  │   Status: Not uploaded                                       │   │
│  │   [Upload Document]                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ✅ Dialysis Treatment Summary    REQUIRED                    │   │
│  │   Status: Validated                                          │   │
│  │   Uploaded: Mar 5, 2026                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  NEPHROLOGIST DOCUMENTS                                             │
│  ──────────────────────                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⏳ Lab Results (last 3 mo)       REQUIRED                    │   │
│  │   Status: Needs upload                                       │   │
│  │   [Request from Dr. Smith]                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SHARED DOCUMENTS (DUSW or Nephrologist)                            │
│  ──────────────────────────────────────                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ○ Cardiology Clearance           OPTIONAL                    │   │
│  │   Status: Not required yet                                   │   │
│  │   [Upload if available]                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.4 Document Ownership Rules

| Document | Default Owner | Can Upload |
|----------|---------------|------------|
| Medicare 2728 | DUSW | DUSW only |
| Dialysis Summary | DUSW | DUSW only |
| Lab Results | Nephrologist | Nephrologist only |
| Hepatitis Panel | Nephrologist | Nephrologist only |
| Cardiology Clearance | Shared | Either |
| Outside Records | Shared | Either |
| PCP Records | Shared | Either |

**Delegation:** If a document owner cannot upload, they can "Request from colleague" which sends a notification to the other role.

### 8.5 Task Handling

When Transplant Center requests records:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Record Request from ChristianaCare                                 │
│  ══════════════════════════════════                                 │
│                                                                     │
│  Patient: Garcia, Maria (TC-2026-0042)                              │
│  Requested: March 8, 2026                                           │
│  Due: March 12, 2026                                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Requested Document: Hepatitis Panel                        │   │
│  │  ───────────────────────────────────────                     │   │
│  │  The transplant center needs updated hepatitis serology      │   │
│  │  from within the last 12 months.                             │   │
│  │                                                              │   │
│  │  Assigned to: Dr. Smith (Nephrologist)                       │   │
│  │                                                              │   │
│  │  [Upload Document]  [Reassign to DUSW]                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Transplant Center Portal Specification

### 9.1 Overview

The Center Portal is a **desktop web application** for transplant center staff to manage cases through the evaluation workflow.

**Seven primary roles:**
1. Front Desk / Navigator
2. Pre-Transplant Coordinator (PTC)
3. Senior Coordinator / Clinical Supervisor
4. Financial Coordinator
5. Dietitian
6. Social Worker
7. Nephrology (+ optional Pharmacist, Surgeon)

### 9.2 Navigation Structure

```
center.transplant.app
│
├── /login                          Role-based login
│
├── /dashboard                      Auto-redirects to role dashboard
│   ├── /dashboard/front-desk       Intake, validation, scheduling
│   ├── /dashboard/ptc              My cases, at-risk tracking
│   ├── /dashboard/senior           Decision queue, oversight
│   ├── /dashboard/financial        Insurance verification
│   └── /dashboard/specialist/:type Dietitian, SW, Nephro queues
│
├── /pipeline                       All cases table (filterable)
│
├── /cases/:id                      Case Cockpit (tabbed)
│   ├── ?tab=summary                Overview + next actions
│   ├── ?tab=tasks                  All tasks for case
│   ├── ?tab=documents              Document checklist
│   ├── ?tab=messages               Messaging threads
│   ├── ?tab=decisions              Decision history
│   ├── ?tab=scheduling             Scheduling workflow
│   ├── ?tab=end-referral           End referral flow
│   └── ?tab=audit                  Full audit trail
│
├── /inbox                          Cross-case message inbox
│
└── /admin                          Configuration (Senior + Admin)
    ├── /admin/stages               Stage SLAs
    ├── /admin/documents            Document catalog
    ├── /admin/end-reasons          End reason codes
    └── /admin/templates            Message templates
```

### 9.3 Role Dashboards

#### 9.3.1 Front Desk Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  Front Desk Dashboard                                               │
│  ═══════════════════                                                │
│                                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐                     │
│  │ Overdue  │ Due Today│ Upcoming │ Complete │                     │
│  │    3     │    5     │    12    │    47    │                     │
│  │   🔴     │    🟡    │    🟢    │    ⚪    │                     │
│  └──────────┴──────────┴──────────┴──────────┘                     │
│                                                                     │
│  Queue: [All] [Intake] [I/E Review] [Route Screening] [Docs] [...]  │
│                                                                     │
│  ─── OVERDUE ────────────────────────────────────────────────────── │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Garcia, Maria         TC-2026-0042    Initial Screening      │ │
│  │  🔴 3 days overdue     Route needed                           │ │
│  │                                            [Route Case →]      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ─── DUE TODAY ──────────────────────────────────────────────────── │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Thompson, James       TC-2026-0038    Follow Through         │ │
│  │  🟡 Due today          Confirm I/E Review                     │ │
│  │                                            [Confirm ✓]         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Queue Tabs:**
- All
- Intake/TODOs (initial-todos, follow-through stages)
- I/E Review (confirm-ie-review tasks)
- Route Screening (initial-screening with ieConfirmReviewComplete)
- Doc Review (documents needing validation)
- Missing Info (intermediary-step)
- Scheduling (scheduling stage tasks)
- End Letters (send-end-letter tasks)

#### 9.3.2 Senior Coordinator Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  Senior Coordinator Dashboard                                       │
│  ═════════════════════════════                                      │
│                                                                     │
│  DECISIONS REQUIRING ACTION                                         │
│  ──────────────────────────                                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  🔴 No Response 3x - Williams, Sarah (TC-2026-0051)           │ │
│  │     Patient unresponsive. Continue outreach or end referral?   │ │
│  │                                           [Make Decision →]    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  🟡 Screening Override - Chen, Wei (TC-2026-0049)             │ │
│  │     Front Desk flagged I/E responses for review               │ │
│  │                                           [Review Case →]      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  🟡 Final Decision - Martinez, Luis (TC-2026-0044)            │ │
│  │     All specialist reviews complete. Approve or not approve?   │ │
│  │                                           [Make Decision →]    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  PIPELINE OVERVIEW                                                  │
│  ─────────────────                                                  │
│  [Mini pipeline visualization showing case counts per stage]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 9.3.3 Specialist Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dietitian Review Queue                                             │
│  ══════════════════════                                             │
│                                                                     │
│  MY PENDING REVIEWS                                                 │
│  ─────────────────                                                  │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Garcia, Maria         TC-2026-0042                            │ │
│  │  Due: Mar 10 (2 days)  Stage: Specialist Review                │ │
│  │                                                                 │ │
│  │  Quick Actions:                                                 │ │
│  │  [Clear ✓] [Needs Clarification] [Escalate to Senior]          │ │
│  │                                                                 │ │
│  │  [Open Full Review →]                                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  AWAITING CLARIFICATION                                             │
│  ──────────────────────                                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Thompson, James       TC-2026-0038                            │ │
│  │  Waiting for: Additional dietary history from patient          │ │
│  │  Requested: 3 days ago                                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.4 Case Cockpit

The central work surface for any case:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Pipeline                                    [Actions ▼]  │
│                                                                     │
│  Garcia, Maria                           TC-2026-0042               │
│  DOB: 05/15/1965 | Riverside Dialysis    PTC: Dr. Sarah Johnson     │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                     │
│  Stage: Records Collection        SLA: 🟡 At Risk (2 days remain)   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [REF]→[ROI]→[TODO]→[FOLLOW]→[SCREEN]→[FIN]→[■REC■]→[MED]→... │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ⚠️ Flags: [Missing 2728] [No Response x1]                         │
│                                                                     │
│  [Summary] [Tasks] [Documents] [Messages] [Decisions] [Scheduling]  │
│  ═════════════════════════════════════════════════════════════════  │
│                                                                     │
│  SUMMARY TAB CONTENT                                                │
│  ────────────────────                                               │
│                                                                     │
│  Next Actions:                                                      │
│  • Medicare 2728 form required (hard-block)                         │
│  • Lab results pending from clinic                                  │
│                                                                     │
│  Recent Activity:                                                   │
│  • Mar 7: Message sent to clinic requesting 2728                    │
│  • Mar 5: Dialysis Summary validated by Front Desk                  │
│  • Mar 4: Case entered Records Collection stage                     │
│                                                                     │
│  Contact History:                                                   │
│  • 1 contact attempt (Mar 6 - phone, no answer)                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.5 Key Modals

#### 9.5.1 Screening Routing Modal

When Front Desk routes from Initial Screening:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Route Initial Screening                                     [X]    │
│  ═══════════════════════                                            │
│                                                                     │
│  Garcia, Maria (TC-2026-0042)                                       │
│  DOB: 05/15/1965 | Riverside Dialysis                               │
│                                                                     │
│  ✅ I/E Review Confirmed                                            │
│                                                                     │
│  ⚠️ System Flags Detected:                                          │
│  • Previous transplant - needs verification                         │
│                                                                     │
│  SELECT ROUTING DESTINATION                                         │
│  ──────────────────────────                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ○ Route to Financial Screening                               │   │
│  │   Proceed with insurance verification and financial review.  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ● Route to Senior Coordinator Review                         │   │
│  │   Use when responses are unclear or indicate concerns.       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Notes (required for Senior routing):                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Patient indicated previous transplant but details unclear.   │   │
│  │ Requesting Senior review before proceeding.                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Cancel]                              [Route to Senior →]          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 9.5.2 Decision Modal

For recording any decision with rationale:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Final Decision                                              [X]    │
│  ══════════════                                                     │
│                                                                     │
│  Martinez, Luis (TC-2026-0044)                                      │
│  ──────────────────────────────                                     │
│                                                                     │
│  All specialist reviews are complete:                               │
│  ✅ Dietitian: Cleared                                              │
│  ✅ Social Work: Cleared                                            │
│  ✅ Nephrology: Cleared                                             │
│                                                                     │
│  SELECT OUTCOME                                                     │
│  ──────────────                                                     │
│  ○ Approved - Continue to Education                                 │
│  ○ Needs More Info - Return to previous stage                       │
│  ● Not Approved - End referral                                      │
│                                                                     │
│  Rationale (required):                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Patient does not meet cardiac clearance requirements at      │   │
│  │ this time. Recommend re-evaluation after cardiology follow-  │   │
│  │ up in 6 months.                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Cancel]                              [Record Decision]            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 9.5.3 End Referral Modal

Triggers standardized end flow:

```
┌─────────────────────────────────────────────────────────────────────┐
│  End Referral                                                [X]    │
│  ════════════                                                       │
│                                                                     │
│  Patient: Williams, Sarah (TC-2026-0051)                            │
│                                                                     │
│  SELECT END REASON *                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [PAT-NORESP] No response after 3 attempts              ▼    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RATIONALE (required) *                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Multiple contact attempts via phone, email, and in-app      │   │
│  │ message over 14 days with no response from patient.         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LETTER PREVIEW                                                     │
│  ──────────────                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Dear Ms. Williams,                                           │   │
│  │                                                              │   │
│  │ We regret to inform you that your referral to the            │   │
│  │ ChristianaCare Kidney Transplant Program has been ended.     │   │
│  │                                                              │   │
│  │ Reason: No response after 3 attempts.                        │   │
│  │                                                              │   │
│  │ To be re-referred in the future, you will need to:           │   │
│  │ • Patient direct contact and consent confirmation            │   │
│  │                                                              │   │
│  │ If you have questions, please contact us at (302) 555-0100.  │   │
│  │                                                              │   │
│  │ Sincerely,                                                   │   │
│  │ ChristianaCare Transplant Team                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  [Edit Letter]                                                      │
│                                                                     │
│  [Cancel]                    [Approve Letter & End Referral]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.6 UI/UX Improvements Needed

Based on prototype analysis, these areas need improvement:

1. **Dashboard Clarity**
   - Add visual hierarchy to distinguish urgency levels
   - Include inline actions to reduce clicks
   - Show more context in queue items

2. **Case Cockpit Density**
   - Balance information density with readability
   - Use progressive disclosure for details
   - Ensure critical info (flags, SLA) always visible

3. **Decision Workflows**
   - Make decision options visually distinct
   - Require rationale before proceeding
   - Show consequences of each option

4. **Navigation**
   - Persistent breadcrumbs
   - Quick case search
   - Role-appropriate shortcuts


---

## 10. API Design

### 10.1 API Structure

Using Next.js App Router API routes:

```
/api
├── /auth
│   ├── POST /login                 Email/password or magic link
│   ├── POST /logout                Clear session
│   ├── GET  /me                    Current user info
│   └── POST /magic-link            Send magic link email
│
├── /cases
│   ├── GET  /                      List cases (filtered by role)
│   ├── POST /                      Create case (referral)
│   ├── GET  /:id                   Get case details
│   ├── PATCH /:id                  Update case
│   ├── POST /:id/advance-stage     Trigger stage advancement
│   ├── POST /:id/end               End referral
│   └── POST /:id/re-referral       Start re-referral
│
├── /tasks
│   ├── GET  /                      List tasks (by role/case)
│   ├── POST /                      Create task
│   ├── PATCH /:id                  Update task status
│   └── POST /:id/complete          Complete task with notes
│
├── /decisions
│   ├── GET  /                      List pending decisions
│   ├── POST /                      Create decision
│   └── POST /:id/record            Record decision outcome
│
├── /documents
│   ├── GET  /case/:caseId          List documents for case
│   ├── POST /                      Create document record
│   ├── POST /:id/upload            Upload file
│   ├── PATCH /:id/status           Update status
│   └── POST /:id/validate          Validate document
│
├── /messages
│   ├── GET  /case/:caseId          Messages for case
│   ├── GET  /inbox                 User's inbox
│   ├── POST /                      Send message
│   └── PATCH /:id/read             Mark as read
│
├── /specialists
│   ├── GET  /reviews/:caseId       Specialist reviews for case
│   └── POST /:id/complete          Complete specialist review
│
└── /config
    ├── GET  /stages                Stage definitions
    ├── GET  /documents             Document catalog
    ├── GET  /end-reasons           End reason codes
    └── GET  /templates             Message templates
```

### 10.2 Key API Patterns

#### 10.2.1 Case Creation (Referral Submission)

```typescript
// POST /api/cases
interface CreateCaseRequest {
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    preferredLanguage?: 'en' | 'es';
  };
  clinicContacts: {
    dusw: { name: string; email: string };
    nephrologist: { name: string; email: string };
  };
  submittedBy: 'dusw' | 'nephrologist';
}

interface CreateCaseResponse {
  case: Case;
  patientInviteUrl: string; // Secure link for patient
}

// Implementation
async function createCase(req: CreateCaseRequest): Promise<CreateCaseResponse> {
  // 1. Generate case number
  const caseNumber = await generateCaseNumber(); // TC-2026-0001
  
  // 2. Create patient user (if not exists)
  const patient = await upsertPatient(req.patient);
  
  // 3. Create case record
  const newCase = await db.cases.create({
    caseNumber,
    patientId: patient.id,
    ...req.patient,
    clinicId: currentUser.clinicId,
    stage: 'new-referral',
    // ... initialize all fields
  });
  
  // 4. Initialize required documents
  await initializeDocumentChecklist(newCase.id);
  
  // 5. Generate secure patient invite link
  const inviteToken = await generatePatientToken(patient.id, newCase.id);
  const inviteUrl = `${PATIENT_PORTAL_URL}/register?token=${inviteToken}`;
  
  // 6. Send notification (no PHI in message)
  await sendPatientInvite(patient.email, patient.phone, inviteUrl);
  
  // 7. Create audit event
  await createAuditEvent(newCase.id, 'CASE_CREATED', 'Referral submitted');
  
  return { case: newCase, patientInviteUrl: inviteUrl };
}
```

#### 10.2.2 Task Completion with Side Effects

```typescript
// POST /api/tasks/:id/complete
interface CompleteTaskRequest {
  notes?: string;
  outcome?: string; // For decisions
  markAsContactAttempt?: boolean;
}

async function completeTask(taskId: string, req: CompleteTaskRequest) {
  const task = await db.tasks.findById(taskId);
  const caseData = await db.cases.findById(task.caseId);
  
  // 1. Update task
  await db.tasks.update(taskId, {
    status: 'completed',
    completedAt: new Date(),
    completedBy: currentUser.id,
    completionNotes: req.notes
  });
  
  // 2. Handle task-type-specific side effects
  switch (task.type) {
    case 'confirm-ie-review':
      // Set the hard gate flag
      await db.cases.update(caseData.id, {
        ieConfirmReviewComplete: true
      });
      // Remove pending flag
      await removeCaseFlag(caseData.id, 'I/E Review Pending');
      break;
      
    case 'specialist-review':
      // Check if all specialists complete
      await checkSpecialistConflicts(caseData.id);
      break;
      
    case 'confirm-surginet':
      // Mark appointment confirmed
      await db.cases.update(caseData.id, {
        appointmentConfirmed: true,
        stage: 'scheduled'
      });
      break;
  }
  
  // 3. Handle contact attempt tracking
  if (req.markAsContactAttempt) {
    const newCount = caseData.contactAttempts + 1;
    await db.cases.update(caseData.id, {
      contactAttempts: newCount,
      lastContactAttempt: new Date()
    });
    
    // Check for 3x escalation
    if (newCount >= 3) {
      await createNoResponse3xDecision(caseData.id);
    }
  }
  
  // 4. Check for auto-advancement
  await maybeAdvanceCase(caseData.id);
  
  // 5. Audit
  await createAuditEvent(caseData.id, 'TASK_COMPLETED', task.title);
}
```

#### 10.2.3 Decision Recording

```typescript
// POST /api/decisions/:id/record
interface RecordDecisionRequest {
  selectedOption: string;
  rationale: string;
  letterDraft?: string; // For end referral
}

async function recordDecision(decisionId: string, req: RecordDecisionRequest) {
  const decision = await db.decisions.findById(decisionId);
  
  // 1. Update decision
  await db.decisions.update(decisionId, {
    selectedOption: req.selectedOption,
    rationale: req.rationale,
    decidedBy: currentUser.id,
    decidedAt: new Date(),
    status: 'completed',
    letterDraft: req.letterDraft
  });
  
  // 2. Handle decision-type-specific routing
  switch (decision.type) {
    case 'screening-routing':
      if (req.selectedOption.includes('Financial')) {
        await advanceCaseTo(decision.caseId, 'financial-screening');
        await createPTCAssignmentTask(decision.caseId);
      } else {
        await addCaseFlag(decision.caseId, 'Needs Senior Review');
        await createSeniorReviewTask(decision.caseId);
      }
      break;
      
    case 'no-response-3x':
      if (req.selectedOption.includes('Continue')) {
        // Reset counter
        await db.cases.update(decision.caseId, { contactAttempts: 0 });
        await removeCaseFlag(decision.caseId, 'No Response x3');
      } else {
        // End referral
        await triggerEndReferral(decision.caseId, 'PAT-NORESP', req.rationale);
      }
      break;
      
    case 'final-decision':
      if (req.selectedOption.includes('Approved')) {
        await advanceCaseTo(decision.caseId, 'education');
        await createEducationTasks(decision.caseId);
      } else if (req.selectedOption.includes('Not Approved')) {
        await triggerEndReferral(decision.caseId, null, req.rationale);
      }
      break;
  }
  
  // 3. Audit
  await createAuditEvent(
    decision.caseId, 
    'DECISION_RECORDED',
    `${decision.title}: ${req.selectedOption}`
  );
}
```

### 10.3 Real-Time Updates

Use Supabase Realtime for live updates:

```typescript
// Client-side subscription
const supabase = createClient();

// Subscribe to case updates
const caseSubscription = supabase
  .channel('case-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'cases',
    filter: `id=eq.${caseId}`
  }, (payload) => {
    updateCaseState(payload.new);
  })
  .subscribe();

// Subscribe to new tasks for role
const taskSubscription = supabase
  .channel('task-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'tasks',
    filter: `assigned_to_role=eq.${userRole}`
  }, (payload) => {
    addTaskToQueue(payload.new);
  })
  .subscribe();
```

---

## 11. Implementation Priorities

### 11.1 Phase 1: Foundation (Week 1-2)

**Goal:** Basic infrastructure and data model

```
[ ] Project setup
    [ ] Next.js 14 with App Router
    [ ] TypeScript configuration
    [ ] Tailwind + shadcn/ui setup
    [ ] Supabase project creation
    
[ ] Database
    [ ] Run schema migrations
    [ ] Seed configuration data
    [ ] Set up RLS policies
    
[ ] Authentication
    [ ] Supabase Auth integration
    [ ] Role-based middleware
    [ ] Magic link for patients
    [ ] Standard auth for staff
    
[ ] Shared components
    [ ] Port shadcn/ui components from prototype
    [ ] Create layout components
    [ ] Build common UI patterns
```

### 11.2 Phase 2: Patient Portal (Week 2-3)

**Goal:** Functional patient experience

```
[ ] Patient flows
    [ ] Registration + magic link
    [ ] ROI consent forms (2 forms)
    [ ] Care partner invitation
    
[ ] Patient TODOs
    [ ] I/E form (multi-step)
    [ ] Document upload (Gov ID, Insurance)
    [ ] Progress tracking
    
[ ] Patient dashboard
    [ ] Next step display
    [ ] Checklist view
    [ ] Message center
    
[ ] Patient messaging
    [ ] Thread view
    [ ] Send/receive messages
    [ ] Notification preferences
```

### 11.3 Phase 3: Transplant Center Core (Week 3-4)

**Goal:** Case management backbone

```
[ ] Case CRUD
    [ ] Create from referral
    [ ] Read with all relations
    [ ] Update stage/status
    [ ] Document checklist
    
[ ] Task system
    [ ] Task creation
    [ ] Assignment by role
    [ ] Completion with notes
    [ ] SLA calculation
    
[ ] Decision system
    [ ] Decision creation
    [ ] Recording with rationale
    [ ] Side effect triggers
    
[ ] Case Cockpit
    [ ] Summary tab
    [ ] Tasks tab
    [ ] Documents tab
    [ ] Audit tab
```

### 11.4 Phase 4: Workflow Logic (Week 4-5)

**Goal:** Full workflow automation

```
[ ] Stage transitions
    [ ] Auto-advancement rules
    [ ] Hard-block enforcement
    [ ] SLA tracking + alerts
    
[ ] Screening flow
    [ ] I/E confirm review gate
    [ ] Routing decision
    [ ] Financial screening
    
[ ] Specialist reviews
    [ ] Parallel task creation
    [ ] Outcome recording
    [ ] Conflict detection
    
[ ] End referral flow
    [ ] Standard end reasons
    [ ] Letter generation
    [ ] Re-referral linkage
```

### 11.5 Phase 5: Dialysis Clinic Portal (Week 5-6)

**Goal:** Clinic referral and document management

```
[ ] Clinic auth
    [ ] Staff login
    [ ] Clinic association
    
[ ] Referral submission
    [ ] New referral form
    [ ] Patient invite trigger
    
[ ] Document management
    [ ] Ownership display
    [ ] Upload by role
    [ ] Delegation requests
    
[ ] Case visibility
    [ ] Limited case view
    [ ] Record requests
    [ ] Message handling
```

### 11.6 Phase 6: Polish & Demo (Week 6-7)

**Goal:** Demo-ready product

```
[ ] Role dashboards
    [ ] Front Desk dashboard
    [ ] Senior Coordinator dashboard
    [ ] PTC dashboard
    [ ] Financial dashboard
    [ ] Specialist dashboards
    
[ ] Pipeline view
    [ ] Full case table
    [ ] Filters and search
    [ ] Bulk actions
    
[ ] Admin configuration
    [ ] Stage SLA editing
    [ ] Document catalog
    [ ] End reason management
    
[ ] Demo features
    [ ] Reset demo data
    [ ] Role switcher
    [ ] Sample data seeding
```

---

## 12. UI/UX Guidelines

### 12.1 Design System

**Colors:**
```css
/* Primary */
--primary: #3399e6;
--primary-dark: #1a66cc;
--primary-light: #eaf4fc;

/* Status */
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;

/* Neutrals */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-500: #64748b;
--slate-700: #334155;
--slate-900: #0f172a;
```

**Typography:**
```css
/* Use system fonts for performance */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Scale */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
```

**Spacing:**
```css
/* Use 4px base unit */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

### 12.2 Component Patterns

**Cards:**
```tsx
<Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg font-semibold">Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Status Badges:**
```tsx
// SLA Status
<Badge variant={slaStatus === 'overdue' ? 'destructive' : 
               slaStatus === 'at-risk' ? 'warning' : 'success'}>
  {slaStatus}
</Badge>

// Case Flags
<Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
  {flag}
</Badge>
```

**Buttons:**
```tsx
// Primary action
<Button>Submit</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive action
<Button variant="destructive">End Referral</Button>

// Ghost/link style
<Button variant="ghost">View Details</Button>
```

### 12.3 Mobile Patterns (Patient Portal)

**Bottom Navigation:**
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
  <div className="flex justify-around py-2">
    <NavItem icon={Home} label="Home" active />
    <NavItem icon={MessageCircle} label="Care Team" />
    <NavItem icon={User} label="Profile" />
    <NavItem icon={HelpCircle} label="Help" />
  </div>
</nav>
```

**Phone Frame Wrapper (for demos):**
```tsx
<div className="mx-auto max-w-[375px] min-h-screen bg-slate-100 
                rounded-[40px] border-8 border-slate-800 overflow-hidden">
  {/* App content */}
</div>
```

### 12.4 Accessibility

- All interactive elements must be keyboard accessible
- Color is never the only indicator of state
- Minimum contrast ratio 4.5:1 for text
- Focus indicators visible on all interactive elements
- Form inputs have associated labels
- Error messages linked to inputs

---

## 13. Configuration System

### 13.1 Center-Level Configuration

Each transplant center can customize:

```typescript
interface CenterConfiguration {
  // General
  centerName: string;
  centerCode: string;
  timezone: string;
  
  // SLA Settings (override stage defaults)
  stageSLAOverrides: {
    [stage: string]: number; // days
  };
  
  // PTC Assignment
  ptcClaimWindowHours: number; // Fallback escalation timer
  
  // Contact Attempts
  contactAttemptThreshold: number; // Default 3
  contactAttemptWindowDays: number; // Time window for counting
  
  // Document Requirements
  requiredDocuments: string[];
  hardBlockDocuments: string[];
  
  // Notifications
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  
  // Features
  carePartnerRequired: boolean;
  educationVideoUrl: string;
}
```

### 13.2 Admin UI

Senior Coordinators can modify:

```
/admin/stages
├── View all stages with SLAs
├── Edit SLA days per stage
└── View stage transition rules (read-only)

/admin/documents
├── View document catalog
├── Mark documents as required/optional
├── Set hard-block status
└── Configure max age days

/admin/end-reasons
├── View all end reason codes
├── Edit re-referral requirements
└── Configure letter templates

/admin/templates
├── Manage message templates
├── Configure variables
└── Preview with sample data
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

```typescript
// Example: SLA calculation
describe('calculateSLAStatus', () => {
  it('returns on-track for new cases', () => {
    const entered = new Date();
    expect(calculateSLAStatus(entered, 5)).toBe('on-track');
  });
  
  it('returns at-risk when 1 day remaining', () => {
    const entered = subDays(new Date(), 4);
    expect(calculateSLAStatus(entered, 5)).toBe('at-risk');
  });
  
  it('returns overdue when past due', () => {
    const entered = subDays(new Date(), 6);
    expect(calculateSLAStatus(entered, 5)).toBe('overdue');
  });
});
```

### 14.2 Integration Tests

```typescript
// Example: Case workflow
describe('Case Workflow', () => {
  it('creates case and sends patient invite', async () => {
    const response = await createCase({
      patient: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      // ...
    });
    
    expect(response.case.stage).toBe('new-referral');
    expect(response.patientInviteUrl).toBeDefined();
  });
  
  it('advances to initial-todos after ROI signed', async () => {
    const caseData = await signROI(caseId);
    expect(caseData.stage).toBe('initial-todos');
  });
  
  it('blocks advancement without I/E confirm review', async () => {
    await completeAllTodos(caseId);
    const caseData = await getCaseById(caseId);
    expect(caseData.stage).not.toBe('initial-screening');
  });
});
```

### 14.3 E2E Tests (Playwright)

```typescript
// Example: Patient onboarding flow
test('patient completes onboarding', async ({ page }) => {
  // Navigate to invite link
  await page.goto('/register?token=xxx');
  
  // Fill registration
  await page.fill('[name="firstName"]', 'Jane');
  await page.fill('[name="lastName"]', 'Smith');
  await page.click('text=Continue');
  
  // Sign ROI forms
  await page.click('[data-testid="consent-checkbox-1"]');
  await page.click('[data-testid="consent-checkbox-2"]');
  await page.click('text=I Agree');
  
  // Complete second ROI
  await page.click('[data-testid="consent-checkbox-1"]');
  await page.click('text=I Agree and Continue');
  
  // Verify dashboard
  await expect(page).toHaveURL('/patient/dashboard');
  await expect(page.locator('h1')).toContainText('Your Next Step');
});
```

### 14.4 Demo Scenarios

Create seed data for these scenarios:

1. **Happy Path:** Case moving through all stages smoothly
2. **Missing 2728:** Case blocked at records collection
3. **3x No Response:** Case escalated to Senior Coordinator
4. **Specialist Conflict:** Dietitian cleared, Nephro escalated
5. **Re-Referral:** Previously ended case being re-referred
6. **Multiple Cases:** Pipeline view with 20+ cases at various stages

---

## 15. AI Agent Context Management

This section provides guidance for AI coding agents (Claude Code, Codex CLI, etc.) on managing context across sessions. Critical for multi-week projects with limited context windows.

### 15.1 The Problem

AI agents have finite context windows (e.g., 256K tokens for Codex). On a multi-week project:
- Reading this full document consumes ~25-30K tokens
- Conversation history grows continuously
- Architectural decisions made in Session 3 are forgotten by Session 10
- Patterns established early get re-invented or contradicted later

### 15.2 Document Reading Strategy

**Never read this entire document at once.** Use targeted reads:

| When You Need | Read These Sections |
|---------------|---------------------|
| Project overview | Section 1 (System Overview) |
| Understanding workflow | Section 2 (Core Concepts) + Section 6 (Workflow Engine) |
| Implementing database | Section 3 (Data Model) + Section 4 (Database Schema) |
| Building patient portal | Section 7 (Patient Portal Spec) |
| Building clinic portal | Section 8 (Clinic Portal Spec) |
| Building center portal | Section 9 (Transplant Center Spec) |
| Designing APIs | Section 10 (API Design) |
| Checking hard gates | Section 6.3 (Hard Gate Enforcement) |
| Understanding stages | Section 6.1 (Stage Definitions) |

**Token Budget Estimates:**
- Full document: ~25-30K tokens
- Single section: ~2-5K tokens
- Quick reference (Appendix B): ~1K tokens

### 15.3 Living Documentation System

Create and maintain these files alongside your code:

```
docs/
├── HANDOFF.md              # This document (read-only reference)
├── WORKFLOW_SPEC.md        # Original stakeholder requirements (read-only)
├── LEARNINGS.md            # Living doc - patterns discovered during dev
├── SESSION_LOG.md          # Running log of session summaries
└── decisions/              # Architecture Decision Records
    ├── ADR-001-tech-stack.md
    ├── ADR-002-auth-strategy.md
    └── ...
```

### 15.4 LEARNINGS.md Template

This file gets **updated during development**. When you discover a pattern, fix a tricky bug, or make a decision, add it here so future sessions remember.

```markdown
# Project Learnings

Last updated: [DATE]

## Patterns Established

### API Routes
- [Pattern description]
- [Example]

### Component Patterns
- [Pattern description]
- [Example]

### Database Patterns
- [Pattern description]
- [Example]

## Bugs & Solutions

### [DATE]: [Bug Title]
- **Problem**: [What went wrong]
- **Cause**: [Root cause]
- **Fix**: [How it was resolved]
- **File(s)**: [Affected files]

## Decisions Made

- [DATE]: [Decision and brief rationale]

## Things That Don't Work

- [Approach that failed and why - prevents re-trying]
```

### 15.5 Architecture Decision Records (ADRs)

For significant decisions, create an ADR:

```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-YYY]

## Context
[Why this decision was needed]

## Decision
[What we decided]

## Consequences
[What this means going forward - both positive and negative]

## Alternatives Considered
[Other options and why they were rejected]
```

### 15.6 Session Management Protocol

#### Starting a New Session

1. Read `AGENTS.md` or project brief (automatic in most agents)
2. Read `docs/LEARNINGS.md` to restore established patterns
3. Check recent git history: `git log --oneline -20`
4. Check for in-progress work: `ls plans/` or check TODO comments
5. Ask: "What was I working on?" if resuming

#### During a Session

- After completing each feature, ask: "Should anything from this implementation be added to LEARNINGS.md?"
- Every ~2 hours of work, do a context checkpoint
- When you establish a new pattern, document it immediately

#### Before Ending a Session

1. **Update LEARNINGS.md** with:
   - Any new patterns established
   - Bugs fixed and how
   - Decisions made

2. **Create ADRs** for significant architectural decisions

3. **Commit documentation**:
   ```bash
   git add docs/
   git commit -m "docs: session learnings [DATE]"
   ```

4. **Summarize session** (for resume context):
   ```
   /compact  # or equivalent command
   ```

### 15.7 Context Window Management

#### Token Budget (256K window example)

| Content | Approximate Tokens |
|---------|-------------------|
| AGENTS.md | ~3-5K |
| LEARNINGS.md | ~2-5K (grows over time) |
| One section of HANDOFF.md | ~3-5K |
| Full source file (500 lines) | ~2-3K |
| Conversation history | Grows continuously |

#### Warning Signs - Time to Compact

- Agent starts forgetting earlier conversation
- Agent re-asks questions already answered
- Agent contradicts earlier decisions
- Responses getting slower

#### Compaction Strategy

1. **Before compacting**, always update LEARNINGS.md with anything important
2. Run compaction command
3. **After compacting**, re-read LEARNINGS.md to restore critical context

### 15.8 Multi-Agent Memory Responsibilities

If using multiple agents (planner, reviewer, tester, etc.):

| Agent | Memory Responsibility |
|-------|----------------------|
| Planner | Update `plans/` with implementation plans; note blockers in LEARNINGS.md |
| Reviewer | Suggest LEARNINGS.md updates when seeing recurring patterns |
| Tester | Document test patterns and fixtures in LEARNINGS.md |
| Database Architect | Create ADRs for schema decisions |

### 15.9 What NOT to Forget

These items should ALWAYS be in LEARNINGS.md or an ADR:

1. **Hard gate enforcement approach** - how you implemented the 4 hard gates
2. **Stage transition logic** - where it lives, how it's triggered
3. **RLS policy patterns** - what works, what broke
4. **Authentication flow** - magic link vs password, token handling
5. **File upload approach** - Supabase Storage patterns
6. **3x no-response implementation** - contact tracking and escalation
7. **Re-referral document reuse** - how eligibility is checked

### 15.10 Recovery from Context Loss

If you realize context has been lost:

1. **Stop coding immediately**
2. Read `docs/LEARNINGS.md` thoroughly
3. Read recent ADRs in `docs/decisions/`
4. Check `git log --oneline -20` and `git diff HEAD~5` to see recent changes
5. Grep for TODO/FIXME comments: `grep -r "TODO\|FIXME" src/`
6. Only then resume work

---

## Appendix A: Prototype File Mapping

### Transplant Center Prototype

Key files to reference:

| File | Purpose |
|------|---------|
| `types/index.ts` | Complete type definitions |
| `lib/context/CaseContext.tsx` | State management patterns |
| `lib/data/seed.ts` | Mock data structure |
| `lib/data/stages.ts` | Stage definitions |
| `lib/data/endReasons.ts` | End reason codes |
| `lib/data/documentCatalog.ts` | Document types |
| `lib/utils/stageTransitions.ts` | Advancement logic |
| `lib/utils/slaCalculations.ts` | SLA computation |
| `components/modals/ScreeningRoutingModal.tsx` | Decision modal pattern |
| `components/case-cockpit/*.tsx` | Cockpit tab patterns |
| `app/dashboard/front-desk/page.tsx` | Dashboard layout |

### Patient Portal Prototype

**IMPORTANT**: The patient portal prototype is a **single-file UI/UX demonstration only**. It does NOT contain separate types, context, or component folders. All architectural patterns should come from the Transplant Center prototype.

| File | Purpose |
|------|---------|
| `src/app/mobile/page.tsx` | Complete mobile UI (~3,933 lines) - single self-contained file |
| `src/app/page.tsx` | Root page (minimal) |
| `src/app/layout.tsx` | Layout wrapper |

**What this prototype provides:**
- Mobile-first UI/UX patterns and visual design
- Patient journey flow (onboarding → todos → education → scheduling)
- Component styling and interaction patterns

**What this prototype does NOT provide:**
- Type definitions (use Transplant Center's `types/index.ts`)
- State management patterns (use Transplant Center's `CaseContext.tsx`)
- Reusable component architecture (extract patterns, don't copy structure)

When implementing the patient portal, use this prototype as a **visual reference** while applying the architectural patterns from the Transplant Center prototype.

---

## Appendix B: Quick Reference

### Stage Order

```
1. new-referral
2. patient-onboarding
3. initial-todos
4. follow-through
5. intermediary-step (if needed)
6. initial-screening
7. financial-screening
8. records-collection
9. medical-records-review
10. specialist-review
11. final-decision
12. education
13. scheduling
14. scheduled (terminal)

Special: ended, re-referral-review
```

### Role Permissions Summary

| Role | Primary Actions |
|------|-----------------|
| Patient | Complete TODOs, sign ROI, upload docs, message |
| Care Partner | View limited status, receive notifications |
| Clinic DUSW | Submit referrals, upload DUSW docs |
| Clinic Nephro | Submit referrals, upload Nephro docs |
| Front Desk | Validate docs, confirm I/E, route, schedule |
| PTC | Manage assigned cases, message, escalate |
| Senior Coord | All decisions, oversight, configuration |
| Financial | Insurance verification, financial decisions |
| Specialists | Submit reviews, request clarification |

### Hard Gates

1. **ieConfirmReviewComplete** - Must be true before Initial Screening
2. **Medicare 2728** - Must be validated before Medical Records Review
3. **All 3 Specialist Reviews** - Must be complete before Final Decision
4. **All Education Items** - Must be complete before Scheduling

---

*Document Version: 1.0*
*Last Updated: March 2026*
*For Claude Code Agent Use*