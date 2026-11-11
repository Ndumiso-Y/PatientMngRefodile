# Refodile Operations Tracker: HR, Lab Jobs, Materials

This is the back-end and rules layer for the operational tracker. It is meant to sit behind the
O.C.E. action-plan tracker. **It has no UI yet.** The UI/UX spec is still to come from the
project lead, so nothing visual was built.

## Scope decision
- **Medis keeps** patients, appointments, clinical notes, billing and claims.
- **This module adds** HR (staff, O.C.E. ownership, roster, leave), lab-job tracking and
  materials/stock with audit history.
- The patient-management "intelligence system" in `src/` is being discontinued. Nothing in it
  was changed. Its only HR-relevant part is `profiles.role` (Admin/Receptionist), and that is
  reused for access control.

## What was recovered
| Source | Finding |
|---|---|
| `DrTebeila_ActionPlan_Tracker.html` (local D: drive) | **Not reachable from the cloud session.** It is not in any repo or in Google Drive. The O.C.E. framework, goals, comments and statuses still need to be supplied. |
| `PatientMngRefodile` (this repo) | React/Vite prototype. Patients, appointments and treatments are hard-coded demo data. `supabase_schema.sql` holds `profiles` plus patient tables. It has no HR, lab or stock features. |
| `Dr.Tebeila--Dental--Studio` | A separate invoicing/quotation app with its own Supabase schema (owner/admin/staff roles, RLS). It is not the tracker, and it was not modified. |

## Data model (`supabase/001_ops_tracker.sql`, additive only)
| Area | Tables / views | Key rules (enforced in DB) |
|---|---|---|
| HR | `staff_members`, `hr_responsibilities` (O.C.E.: owner, contributors, escalation), `roster_shifts`, `leave_requests` | Stores work details only (no ID numbers, pay, addresses or medical info). Approved leave cannot overlap. Only Admin/Manager approve or decline. Status flow: pending → approved/declined/cancelled, approved → cancelled. |
| Lab jobs | `dental_labs`, `lab_jobs`, `lab_job_events`, view `lab_jobs_overdue` | requested → assigned → dispatched → received → completed, with `issue` loops for remakes. A job needs an assignee before it can be assigned and a lab before dispatch. An issue needs a note. Expected return defaults to the lab's turnaround time. Remakes are counted. Every step is logged. |
| Stock | `stock_items`, `stock_movements` (ledger), view `stock_status` | Quantity changes only through movements. Stock can't go negative. Levels are out / reorder / low / ok, with a suggested order quantity. Only managers can adjust or write off. Usage can be linked to a lab job. |
| Audit | `ops_audit_log` | Every insert, update and delete on the ops tables is captured with the actor. Append-only. Only managers can read it. |

**POPIA controls.** Lab jobs hold only an opaque `medis_patient_ref`. A 13-digit SA ID number is
rejected. Free-text notes have length limits. RLS is on for every table. Staff see only their
own leave, and a signed-in user without a profile sees nothing.

## Rules layer for the UI (`src/opsDomain.js`)
Pure functions that mirror the DB rules: valid next lab statuses, due/overdue state, board
summary, stock level, movement validation, usage forecast, SA public holidays and working-day
count, annual leave balance, leave clashes, roster problems (rostered while on leave,
understaffed days) and O.C.E. ownership gaps (owner on leave or inactive → escalation covers).

## Tests (synthetic data only)
```bash
npm run test:ops       # 10 unit tests, no network
npm run test:ops-db    # applies schema + migration to a throwaway local Postgres, 43 assertions incl. RLS per role
```

## Medis Connect overlap check
Public information is thin. The listing describes Medis Connect as a provider network for claims
tracking and electronic communication, with "other modules in development". **Confirm with the
practice's Medis contact** before building anything below in the "Do not build" column.

| Proposed feature | Medis likely covers? | Decision |
|---|---|---|
| Patient demographics, medical history, appointments, billing, claims | Yes | **Do not build.** Use the Medis reference only. |
| Staff roster, leave, O.C.E. ownership | Not advertised | Build here. |
| Lab job tracking | Not advertised | Build here. Confirm Medis has no lab module. |
| Materials/stock | Not advertised | Build here. Confirm no Medis stock module. |

## Roadmap
1. Receive the O.C.E. tracker HTML and the UI/UX spec. Map existing goals, owners and statuses into `hr_responsibilities` plus a tracker table.
2. Run the migration on a **staging** Supabase project and seed synthetic data.
3. Build the UI to the spec using `opsDomain.js`.
4. Import real staff (work details only) after sign-off. Never import patient data.

## Open items / approvals
- [ ] Tracker HTML from `D:\Digital Agency\Refodile Health Centre\DrTebeilaTracker`
- [ ] UI/UX implementation spec
- [ ] Which Supabase project and environment (staging first)
- [ ] Confirm leave entitlements (default 15 working days annual) and SA holiday list with HR
- [ ] Confirm with Medis that no lab or stock module exists
- [ ] Decide where the tracker lives long term (this repo vs a new repo)
