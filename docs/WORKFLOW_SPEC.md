**Proposed New Workflow:** 

1. **New Referral (Dialysis Clinic submits referral)**  
   1. On the Dialysis Clinic portal, a clinic employee starts a new referral by entering the patient’s **first name, last name, email, phone number, preferred language,** and *optionally* title..  
   2. The referrer must also provide **both clinic contacts** for this patient:  
      1. **DUSW contact** (name \+ email)  
      2. **Nephrologist contact** (name \+ email)  
         *(If the referrer is the DUSW, they enter the nephrologist contact. If the referrer is the nephrologist, they enter the DUSW contact.)*  
   3. Our system creates the case and automatically sends the patient a secure link to the Patient Portal (no PHI in the notification message).  
   4. Our system initializes the Dialysis Packet checklist (so the clinic can see what will be needed) with role-based ownership (DUSW-owned, Nephrologist-owned, and Shared/Either docs), so the clinic knows exactly what’s needed next.  
2. **Patient Onboarding \+ ROI (Patient Portal)**  
   1. Patient clicks the secure link, registers, and logs into the Patient Portal mobile first web app for the first time.  
   2. During registration, patient provides notification preferences (SMS consent, email consent) and preferred language.  
   3. Patient is required to sign **two ROI forms** before proceeding.  
   4. Once both ROIs are signed, our system automatically:  
      1. Marks “ROI complete” on the case (timestamped \+ auditable).  
      2. Adds the patient to the Dialysis Clinic portal “Assigned Patients” list (so the clinic can support follow-through).  
      3. Adds the patient to the Transplant Center portal intake workflow (Front Desk sees the case in their queue).  
   5. If ROI is not signed within X days, the system sends automated reminders (in-app \+ optional SMS/email if consented; no PHI in notification text).  
   6. **Optional: Invite Care Partner.** Patient may invite a care partner by providing their name, email, and phone number. If invited, patient must explicitly consent to the care partner receiving notifications and viewing limited case status. *(Care partner receives a separate secure link to a limited-access view.).* IF the patient does not invite a care partner at this point, it will be added to their todo list in their portal. They will be required to complete this **TBD STAGE.**  
3. **Patient Initial TODOs (can be completed in any order)**  
   1. After signing ROIs, the patient sees a TODO list with three required items:  
      1. Complete digitized **Inclusion/Exclusion Criteria** form  
      2. Upload **Government ID**  
      3. Upload **Insurance card**  
   2. When the patient clicks the Inclusion/Exclusion TODO, they are brought to the form and prompted to fill it out to the best of their ability.  
   3. When patient uploads ID/insurance:  
      1. Our system stores the files in the case record.  
      2. Our system routes each document to Front Desk to review \+ confirm the correct documentation was provided.  
4. **Follow-through \+ reminders (Dialysis Clinic \+ Front Desk), then handoff to Pre-Transplant Coordinator ownership**  
   1. It is the responsibility of **both the Dialysis Clinic and the Front Desk** to assist the patient and ensure these three TODOs get completed.  
   2. Our system supports follow-through by enabling:  
      1. In-app messaging to patient (and to care partner if patient consented).  
      2. Automated reminder SMS/email **only if patient consented** (notifications must contain no PHI).  
      3. Phone calls as **EXTERNAL STEP** (staff logs “attempt to contact” in the platform).  
   3. **Front Desk Inclusion/Exclusion review checkpoint (always required):**  
      1. As soon as the patient submits the Inclusion/Exclusion form (**partial or complete**), the case appears in a Front Desk queue: **“Review Inclusion/Exclusion Responses.”**  
      2. Front Desk reviews answers to ensure they are **not out of the ordinary, illogical, or clearly incorrect**, and clicks **“Confirm Review”** (notes optional).  
         1. Confirm Review may be completed even if the form is incomplete; it confirms the provided answers are not out of the ordinary/illogical.  
      3. The case may continue follow-through on the other TODOs, but it **cannot advance to Stage 5 or Stage 6** until **Confirm Review** is completed.  
   4. When all three TODOs are completed, the case automatically moves forward to the next step (Stage 5 — if applicable, otherwise Stage 6).  
   5. From this point forward, we start **stage-level SLA tracking for the transplant workflow stages** (Initial Screening onward).  
   6. Until a PTC claims the case, the Front Desk is the working owner responsible for follow-through; the Senior Coordinator is oversight only.  
   7. Pre-Transplant Coordinator ownership begins once assigned at **Stage 6: Initial Screening**. After assignment, the Pre-Transplant Coordinator becomes the operational case flow owner responsible for ensuring the case doesn’t stall:  
      1. The system auto-alerts the Pre-Transplant Coordinator when any stage exceeds expected duration (SLA).  
      2. The case appears in the Pre-Transplant Coordinator “At Risk” dashboard when overdue.  
   8. **PTC assignment method:** PTCs self-assign patients from a shared queue in Stage 6 (see Stage 6.4).  
5. **Intermediary Step (if applicable) — Missing required values from Inclusion/Exclusion**  
   1. If the patient submitted the Inclusion/Exclusion form but left required fields missing, our system:  
      1. Flags the missing required values.  
      2. Routes the case to the Front Desk queue with a clear “Missing Info” checklist.  
   2. Front Desk attempts to obtain the missing information using:  
      1. In-app message to the patient (preferred).  
      2. Phone call as EXTERNAL STEP (log attempt \+ outcome).  
   3. If the patient confirms they do not have the missing values, Front Desk must retrieve the information externally from the appropriate outside medical source (EXTERNAL STEP) and document how it was obtained.  
   4. Once Front Desk obtains the missing values, they enter them into the site and submit.  
   5. The case then moves forward to **Stage 6: Initial Screening** automatically.  
6.  **Initial Screening (Front Desk) → Routing to Financial or Senior coordinator**  
   1. **Entry condition:** The case enters Stage 6 only after:  
      1. All three TODOs are complete (Stage 4).  
      2. Inclusion/Exclusion has been Front Desk confirmed reviewed (Stage 4).  
      3. If missing required values existed, Stage 5 has been completed.  
   2. **Deterministic rules support check (not a decision):**  
      1. The system automatically runs deterministic checks on the patient’s Inclusion/Exclusion answers and flags items that may not meet ChristianaCare requirements.  
   3. **Front Desk routing decision:**  
      1. Front Desk uses the deterministic flags \+ their judgment and routes the case into one of two paths:  
         1. **Eligible / no major concerns** → route to **Financial Screening**  
         2. **Unclear / illogical / concerning responses** → route to **Senior Coordinator review** (with Front Desk notes \+ flagged items)  
   4. **PTC self-assignment:**  
      1. When Front Desk routes the case to **Financial Screening**, the case also appears in a shared PTC queue: **“Patients that need to be assigned.”**  
      2. Any PTC can open a case from that list and click **“Take patient”** to become the assigned PTC. Ownership begins the moment a PTC clicks “Take patient.”  
      3. Only one PTC can take the case; once taken it disappears from the shared list for everyone else.  
      4. **Fallback so cases don’t rot:** If a case is not claimed within **X business hours/days (**value configured by Senior coordinator), it is escalated to the **Senior Coordinator** to ensure accountability.  
      5. Until claimed, at-risk alerts continue routing to **Front Desk \+ Senior Coordinator** (per Stage 4).  
   5. **Initial Screening outcome routing (based on Front Desk decision)**  
      1. If routed to **Financial Screening**:  
         1. Case is routed to the Financial Coordinator.   
         2. Financial Coordinator reviews insurance card \+ insurance information.  
         3. Financial outcome:  
            1. If cleared → move to Dialysis Clinic Document Request Stage (Stage 7\)  
            2. If needs clarification / missing info → send in-app message to patient (and care partner if consented) \+ keep in Financial stage with SLA timer  
            3. If not cleared → Stages 14-15 with end reason \+ letter  
      2. If routed to **Senior Coordinator review**:  
         1. Case is routed to the Senior Coordinator.   
         2. Senior coordinator options:  
            1. Override initial screening concern (allow to proceed) → route back to **Financial Screening stage (**step 6.5.1 above)  
               1. If Senior overrides and routes to Financial, the case also appears in the PTC ‘Patients that need to be assigned’ queue.  
            2. Request clarification → send in-app message to patient (and care partner if consented).  
            3. If patient not appropriate for evaluation → route into the standardized Ending Referral path (Stages 14–15):  
               1. select standardized end reason \+ required rationale  
               2. generate letter draft (human review required)  
               3. send patient/referrer communications (track EXTERNAL STEP if needed)  
      3. Once the patient is cleared past Initial Screening / Financial (or otherwise routed forward), the case moves into **Records Packet Collection (Dialysis Clinic Packet) stage**  
7. **Records Packet Collection (Dialysis Clinic Packet)**  
   1. Our system automatically activates the **Dialysis Packet checklist** as an actionable TODO list with due dates and assignments **(***required documents are determined by Christiana Car*e**)** in the Dialysis Clinic portal with three sections:  
      1. **DUSW-owned documents** (assigned to the DUSW contact by default)  
      2. **Nephrologist-owned documents** (assigned to the nephrologist contact by default)  
      3. **Shared / Either-role documents** (assigned to the referral submitter by default, but can be reassigned)  
   2. Minimum required item:  
      1. The system requires the **Medicare 2728 form** and flags the case as **blocked** until it is received and validated by human.  
   3. Delegation support (prevents stalls when only one clinic person is active):  
      1. If the submitter cannot provide a document owned by the other role, they click **“Request from colleague,”** which notifies the other contact and assigns them that document task.  
   4. When the dialysis clinic uploads documents, our system automatically:  
      1. Stores the document in the case record.  
      2. Auto-labels the document type (confidence score) and routes any “Needs Review” items to the appropriate transplant-center queue. (CONSIDER FOR PILOT)  
   5. Reminders \+ stall prevention:  
      1. If required documents are not uploaded within **X days** (configurable), the system sends reminders to the responsible clinic contact(s).  
      2. If required documents are still missing after the expected duration:  
         1. The system alerts the **Pre-Transplant Coordinator** and flags the case **“At Risk / Stalled.”**  
         2. The system creates an **“Escalation: Packet Stalled”** decision task assigned to the **Senior Coordinator** (with the Pre-Transplant Coordinator notified).  
         3. **The case stays in Stage 7** until the Senior Coordinator records a decision (so “blocked” cases don’t silently advance).  
   6. Exit condition (move to Stage 8):  
      1. **“Minimum packet met”** (2728 \+ core dialysis packet items received/validated), **OR**  
      2. **“Proceed with partial dialysis records”** decision exists **with required rationale** (only allowed if program policy permits proceeding without any missing “hard-block” items), **OR**  
      3. If a “hard-block” item is missing (ex: 2728), the Senior Coordinator must explicitly choose one of the following (with rationale):  
         1. **Extend wait** (keep in Stage 7 with revised due date / expectation), or  
         2. **End referral (incomplete packet)** → route to Ending Referral path, or  
         3. **Override missing hard-block** (rare; requires rationale \+ audit log) → then the case may advance to Stage 8\.  
8. **Senior coordinator Medical Records Review**  
   1. The case routes to the Senior Coordinator queue once Stage 7 exits via any approved exit condition (minimum packet met, 'proceed with partial' decision recorded, or hard-block override).  
   2. Senior coordinator reviews **all records available in the platform** (patient-submitted docs, dialysis clinic docs, inclusion/exclusion responses, outside records gathered so far)  
   3. If the Senior coordinator needs additional documentation:  
      1. Senior coordinator creates a structured **“Request Records”** task rather than a vague message.  
      2. The request routes to:  
         1. **Front Desk** (**EXTERNAL STEP** if it requires phone calls / outside record retrieval), or  
         2. **Dialysis Clinic portal** (if it is dialysis-owned; assigned using the doc catalog rules to DUSW vs nephrologist vs either).	  
      3. The system adds the request to the correct queue, starts the SLA timer, and alerts the **Pre-Transplant Coordinator** if it runs long  
   4. Partial packet decision (stall prevention):  
      1. If some documents are missing but Senior coordinator  can reasonably proceed, they select **“Proceed with partial external records.”**  
      2. A short rationale is required and is logged in the audit trail.  
   5. System support (safe automation):  
      1. The system generates a “Missing Items \+ What’s Pending” summary from platform data (no medical decisions).  
      2. The system highlights which tasks/docs are overdue relative to configured expected durations.  
   6. After review, Senior coordinator selects one of the following outcomes:  
      1. **Proceed to specialist reviews (Stage 9\)**, or  
      2. **Request clarification** from the patient via in-app message (and optional care-partner assist if consented), or  
      3. **Not appropriate for evaluation at this time** → route into **Steps 14–15 (If not approved \+ Ending Referral)**.  
9. **Specialist Review(s) (parallel)**  
   1. By default, our system automatically creates and assigns three baseline review tasks (with due dates/SLA timers):  
      1. **Dietitian Review** task → routed to Dietitian queue  
      2. **Social Work Review** task → routed to Social Worker queue  
      3. **Transplant Nephrology Review** task → routed to Nephrology queue  
   2.  For each baseline task, our system automatically  
      1. Places the case in the specialist’s queue  
      2. Auto-populates: what needs review, what outcome/update is needed, and the relevant documents already in the platform  
      3. Starts an SLA timer and keeps the case visible to the Pre-Transplant Coordinator as “At Risk” if overdue.  
   3. **Additional specialist reviews (optional, added by Senior Coordinator):** If needed, the Senior Coordinator can click **“Add Specialist Review”** to create extra review tasks (examples: **Pharmacist**, additional focused questions for Nephrology beyond the baseline scope, or other transplant specialists). These are tracked the same way (owner, due date, SLA)  
   4. **Baseline reviews (what each specialist does):**  
      1. **Dietitian Screening:** Dietitian reviews records and submits a structured outcome (**Clear / Needs clarification / Concern → escalate to senior coordinator**). If needed, they message the patient and/or trigger record requests (Dialysis Clinic task or Front Desk **EXTERNAL STEP**)  
      2. **Social Work Screening:** Social Worker reviews records, contacts patient as needed, and submits a structured outcome (**Clear / Needs clarification / Concern → escalate to senior coordinator**). Non-response follows the same logged attempt-to-contact behavior (and escalates if repeated).   
      3. **Transplant Nephrology \+ Pharmacist \+ (Optional Surgeon):**  
         1. Nephrology completes the primary review and owns the “proceed vs turndown” recommendation.  
         2. **Pharmacist input (if requested):** Pharmacist submits recommendations **to Nephrology** (not a final decision).  
         3. **Optional Surgeon review (only if needed):** If surgical concerns exist, Nephrology clicks **“Request Surgeon Review,”**and the surgeon submits recommendations **to Nephrology**.  
         4. Nephrology sends a structured screening note to the **Senior Coordinator** (and notifies **Front Desk \+ Pre-Transplant Coordinator**) indicating **approved / not approved**, including the reason if not approved.  
   5. If clarification or more records are needed at any point:  
      1. Specialist can message the patient in-app (and care partner if consented), or request staff to do it.  
      2. Any outside record collection is tracked as a task (Front Desk \= **EXTERNAL STEP**; Dialysis Clinic \= portal task).  
   6. If specialist outcomes conflict (e.g., one clears while another escalates a concern), the system flags the case for Senior Coordinator attention. Senior Coordinator reviews all specialist notes and makes the final routing decision before the case can proceed to Stage 10\.  
10. **Senior coordinator Final Decision → Front Desk**  
    1. Once required specialist reviews are complete (or deemed not needed), the case routes back to the **Senior coordinator** for final decision.  
    2. Our system auto-generates a “Case Summary” from platform data (no medical decisions):  
       1. Current stage \+ time in stage  
       2. Completed reviews \+ outstanding reviews  
       3. Missing documents \+ which are overdue  
       4. Escalations / concerns raised (from **any** prior stage)  
    3. Senior coordinator reviews the full case record and selects one of the following outcomes (with required rationale when applicable):  
       1. **Approved to continue** → move case to **Education Stage (Step 11\)** and notify Front Desk \+ Pre-Transplant Coordinator.  
       2. **Needs more info** → create structured requests (patient message \+ tasks) and return the case to Stage 8 (records review) or Stage 9 (specialist review) depending on what’s missing.  
       3. **Not approved** → route into Steps 14–15 (If not approved \+ Ending Referral).  
    4. Senior Coordinator clicks **“Send Final Decision Note to Front Desk”** in the portal, indicating **Approved / Not Approved** (and reason if not approved).  
       1. This creates an in-app “decision note” for the Front Desk queue and logs it in the audit trail.  
    5. Stall prevention:  
       1. If the case is waiting on missing items beyond expected duration, the system prompts the Senior coordinator to choose “Proceed with partial records” vs “Wait/End,” with required rationale (so cases don’t sit indefinitely).  
    6. Timers/SLA:  
       1. Approval stage has an expected duration (configurable).  
       2. If overdue, the system auto-alerts the **Pre-Transplant Coordinator** and flags the case “At Risk.”  
11. **Education Stage**  
    1. Our system automatically assigns the patient their required education TODO list, which includes:  
       1. **Watch Transplant Education Video** (\~80 minutes, UNOS requirement). The system prompts the patient to watch with their support person.  
       2. **Complete Education Confirmation & Information Form** (collects: confirmation of video completion, support person details, current medications/allergies/pharmacy, and contact information for current and past doctors).  
       3. **Review Age-Appropriate Healthcare Guidance** (informational checklist—e.g., dental clearance, PCP visit, screening tests based on age/sex—presented as "begin working on" items, not hard blockers).  
    2. Education is “tracked” inside our platform without relying on any hospital internal integrations:  
       1. Patient clicks to watch the video (hosted somewhere TBD that is HIPAA complaint).  
       2. Patient completes the confirmation form directly in-app (replaces the current Microsoft Forms link).  
       3. Patient acknowledges reviewing the healthcare guidance (checkbox \+ timestamp).  
    3. Our system automatically sends reminder messages (in-app \+ email/SMS if patient consented) when education is not completed within X days (configurable).  
    4. Care partner support:  
       1. If patient has invited a care partner and consented, the care partner also gets reminders and can help them complete education tasks.  
    5. If patient is non-responsive during education:  
       1. Use the standard “attempt to contact” escalation logic (see Ending Referral).  
    6. Once education is complete, the system:   
       1. Notifies Front Desk, Pre-Transplant Coordinator, and Senior Coordinator that the patient is ready for scheduling review  
       2. Creates a 'Scheduling Planning Meeting' task   
       3. The case enters 'Awaiting Scheduling Decision' status."  
12. **Scheduling**   
    1. *IN PERSON* the Pre-Transplant Coordinator, Senior coordinator, and front desk will meet and decide on required testing vs direct evaluation   
    2. After that meeting, Front Desk initiates scheduling in our platform by recording a **“Scheduling Huddle Decision”**(timestamped \+ auditable) including:  
       1. “Direct evaluation” vs “testing first.”  
       2. Any required appointment types (configurable by center).  
       3. Whether “care partner must attend evaluation appointment” is required (default ON per your note).  
       4. Optional notes/rationale \+ who recorded the decision (for auditability).  
    3. Our system then automatically drafts an in-app scheduling message to the patient with “available time windows” in one of two realistic ways:  
       1. **No-integration default (recommended for pilot):** Front desk manually enters 3–8 time windows (ex: Tue 9–11, Wed 1–3). Patient replies with their preference inside the app.  
       2. **Optional HIPAA-appropriate calendar integration (only if feasible):** If the center uses a HIPAA-capable scheduling tool, we can generate a secure scheduling link for the patient to select a time. (Tradeoff: vendor risk \+ contracting/BAA \+ added complexity; keep optional.  
    4. Patient selects a time (and confirms care partner attendance if required). The system:  
       1. **If care partner attendance is required but patient indicates their care partner cannot attend:** Front Desk is notified to help the patient identify an alternative date, a different support person, or escalate to Senior Coordinator for override (with documented rationale).  
       2. Once scheduling is confirmed, the system:  
          1. Notifies Front Desk \+ Pre-Transplant Coordinator immediately.  
          2. Moves the case into “Scheduling Pending Confirmation.”  
          3. Creates a task for Front Desk: **EXTERNAL STEP: Confirm appointment in** Cerner **Surginet** (no internal integration).  
    5. Front Desk completes the external confirmation and marks the EXTERNAL STEP task complete in our platform (timestamped \+ auditable).  
    6. Automated follow-through:  
       1. System sends appointment reminders (in-app \+ optional email/SMS if consented) at configurable intervals (ex: 7 days, 72 hours, 24 hours).  
       2. If the patient doesn’t confirm within X days, the system alerts the Pre-Transplant Coordinator and flags the case as “At Risk.”  
    7. No-show / reschedule handling (pilot-safe):  
       1. Front Desk marks “No-show” or “Needs reschedule” in our platform (manual input).  
       2. The system automatically triggers a rescheduling message workflow and resets SLA timers.  
       3. If repeated no-shows occur, escalate to Pre-Transplant Coordinator → Senior coordinator decision (continue vs end referral with documented rationale).  
13. **RE-REFERRAL & RE-EVALUATION STAGE.**  
    1. **NOTE**: This stage applies only to previously ended cases and is not part of the linear progression from Stages 1-12.  
    2. Our platform treats re-referral as a **new case record** linked to the old case (so it’s clean \+ auditable), rather than reopening the old case.  
    3. A re-referral can be initiated by:  
       1. Dialysis clinic (referrer) submitting a new referral (normal entry point).  
       2. Transplant center staff clicking “Start Re-Referral” from an ended case.  
       3. Patient requesting re-referral in-app (then staff approves/initiates).  
    4. Our system automatically:  
       1. Copies forward safe baseline fields from the old case (name/email only, no stale clinical info).  
       2. Pulls in the old end reason and required “re-referral requirements” checklist (configurable).  
       3. Marks which documents can be reused vs must be re-collected (based on document type \+ age rules configured by Senior coordinator).  
    5. **Re-Referral Eligibility Review (Senior Coordinator must approve to proceed):**  
       1. System creates a task: **“Re-referral Return Requirements Review”** → assigned to **Senior Coordinator** (with due date/SLA).  
       2. Task auto-includes: prior end reason, return requirements checklist, and the “reused vs missing” doc status.  
       3. Senior coordinator selects one outcome (required):  
          1. **Return requirements met → proceed** and initiate a **Re-referral Prerequisite Check** (configurable) before routing:  
             1. System checks if ROI forms are expired (or if center policy requires re-signing). If so, patient must re-confirm key consents:  
                1. ROI re-signing is added to patient's TODO list as a prerequisite before routing forward.  
                2. Care partner consent is re-confirmed (or updated).  
             2. System verifies which required documents are still valid based on document type \+ age rules (reused vs re-collect).  
             3. System creates structured tasks for any expired/missing prerequisites (Patient TODOs where patient-provided; Dialysis Clinic portal task when dialysis-owned; Front Desk \= **EXTERNAL STEP** if outside retrieval).  
             4. System flags **Financial re-verification** if insurance has changed or if last financial verification is older than a configurable threshold (X months), and creates the required Financial Screening task(s).  
             5. Once prerequisites are satisfied, route the case to either:  
                1. **Stage 6.d.i.1: Financial Screening** (if financial re-verification is required and not yet completed), OR  
                2. **Stage 8: Senior Coordinator Medical Records Review** (if no financial re-verification is required or it has already been completed).  
          2. **Return requirements not met → end referral** and route into the standardized **Ending Referral** path (end reason \+ rationale \+ letter that clearly states what is still required for future re-referral).  
          3. **Missing items but potentially resolvable → request items** by creating structured tasks (Dialysis Clinic portal task when dialysis-owned; Front Desk \= **EXTERNAL STEP** if outside retrieval).  
    6. Re-evaluation (if it’s the same patient returning after time):  
       1. Pre-Transplant Coordinator owns keeping the case moving and is auto-alerted on stalled steps just like first-time referrals.  
14. **If patient is not approved for evaluation at any point:**  
    1. The team member who makes the “not approved” decision must select a standardized end reason code and write a short rationale in the site (required), **then trigger the GLOBAL STEP: Ending Referral (Appendix A: Ending Referral)** so the end flow is consistent and auditable.  
    2. Patient communication (**handled through Appendix A: Ending Referral’s standardized messaging \+ letter flow**):  
       1. Transplant nephrology, Senior coordinator, transplant dietitian, or transplant social worker will inform patient the referral is ended and what is needed to be referred back to the program. This will be done via **in-app message** (with human review).  
          1. If email/SMS is used, it must be **notification-only** (e.g., “You have a new message in the portal”) and contain no sensitive details.  
       2. If patient has a care partner and has consented, the care partner also receives a “support” version of the message (no extra sensitive details)  
    3. Front desk (**handled through Appendix A: Ending Referral’s standardized “Send End Referral Letter” task**):  
       1. End referral letter sent to patient and referring dialysis center/provider office including reasons for turndown.  
       2. If sending the letter requires external systems (fax/mail/EHR), label that step **EXTERNAL STEP** and track it as a task.  
    4. Escalate patient concerns (**see Appendix A, item 8**)  
       1. If patient replies with concerns/questions about turndown requirements, route the message back to the team member who ended the referral (and alert the Pre-Transplant Coordinator if unanswered \> X days).

**Appendix A: Ending Referral (Global Process)**

1. Any referral end must follow the same standardized flow so it’s consistent, auditable, and reduces risk.  
2. **The persona who triggers the end** (Financial, Senior Coordinator, Dietitian, Social Worker, Nephrology, etc.) must  
   1. Select the standardized end reason code \+ enter required rationale.  
   2. Review/edit the system-generated letter draft and click **“Approve Letter”** (this is the required “drafting” step and is logged).  
3. After approval, the system assigns **Front Desk** a “Send End Referral Letter” task to:  
   1. Send to patient via approved channel(s) (in-app delivery supported; if external mail/fax/etc. is required, track **EXTERNAL STEP**).  
   2. Send to referring dialysis center/provider office (track **EXTERNAL STEP** if needed).  
4. Case is marked **Ended / Inactive** and stores end reason code \+ rationale \+ approved letter version.  
   1. System closes/cancels open reminders and marks remaining tasks as “Not needed due to end” (audit logged).  
5. **No response x3 attempts** (must be standardized and time-based):    
   1. Our system tracks outreach attempts across channels (**in-app** \+ email/SMS **notification-only** if consented \+ phone call logged manually).  
   2. After each attempt, staff clicks “Log Attempt \#1 / \#2 / \#3” in the case.  
   3. If there is no response after attempt \#3 within the configured time window:  
      1. System auto-recommends end reason \= “No response after 3 attempts.”  
      2. System auto-generates an “attempt to contact” letter draft using the standardized template.  
      3. System routes the case to the Senior Coordinator for a required decision: “Continue outreach” vs “End referral (No Response 3x)” (with rationale required).  
      4. If Senior Coordinator selects “End referral,” the Front Desk completes EXTERNAL STEP if the program requires mailing/faxing a formal letter.  
6. Partial packet “stall prevention” rule:  
   1. If a case is stalled in document collection beyond expected duration, the system alerts Pre-Transplant Coordinator automatically and prompts Senior coordinator to choose:   
      1. “Proceed with partial records” vs “End referral due to incomplete packet” (requires rationale either way).  
7. Re-referral instructions:  
   1. Every end letter/message must include a short “what you need to do to be re-referred” section (generated from the end reason \+ configurable center rules).  
   2. System records these requirements on the case so a future re-referral can be handled consistently.  
8. Escalate patient concerns (post-end)  
   1. If the patient replies with concerns/questions about end requirements, route the message back to the **persona who triggered the end** (and alert the Pre-Transplant Coordinator if unanswered \> X days).