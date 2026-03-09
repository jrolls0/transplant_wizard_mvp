# Stage Configuration

| Stage ID | Stage Name | Order | SLA Days | Owner Role | Auto-Advance Condition |
|----------|------------|-------|----------|------------|----------------------|
| new-referral | New Referral | 1 | null | clinic | Patient clicks invite link |
| patient-onboarding | Patient Onboarding | 2 | null | patient | Both ROIs signed |
| initial-todos | Initial TODOs | 3 | null | patient/front-desk | All 3 TODOs + I/E confirm |
| follow-through | Follow Through | 4 | 5 | front-desk | All docs uploaded |
| intermediary-step | Intermediary Step | 5 | 3 | front-desk | Missing I/E collected |
| initial-screening | Initial Screening | 6 | 2 | front-desk | Routing decision made |
| financial-screening | Financial Screening | 7 | 5 | financial | Financial decision made |
| records-collection | Records Collection | 8 | 10 | front-desk/clinic | 2728 + all required docs |
| medical-records-review | Medical Records Review | 9 | 3 | senior-coord | Senior decision made |
| specialist-review | Specialist Review | 10 | 7 | specialists | All 3 reviews done |
| final-decision | Final Decision | 11 | 2 | senior-coord | Approval decision made |
| education | Education | 12 | 5 | patient | All education items done |
| scheduling | Scheduling | 13 | 3 | front-desk | Surginet confirmed |
| scheduled | Scheduled | 14 | null | - | Terminal state |
| ended | Ended | - | null | - | Terminal state |
| re-referral-review | Re-Referral Review | - | 2 | senior-coord | Senior approves re-referral |