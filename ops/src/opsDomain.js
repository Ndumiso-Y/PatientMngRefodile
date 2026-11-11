/**
 * Refodile Operations Tracker: domain rules (UI-agnostic, no network, no PII).
 *
 * These mirror the database rules in ops/supabase/001_ops_tracker.sql so the
 * UI can show only valid actions and warnings before anything is saved.
 * The database stays the source of truth and rejects anything invalid.
 */

// ------------------------------------------------------------------ Lab jobs
export const LAB_STATUSES = ['requested', 'assigned', 'dispatched', 'received', 'issue', 'completed', 'cancelled'];

export const LAB_TRANSITIONS = {
  requested: ['assigned', 'cancelled'],
  assigned: ['dispatched', 'cancelled'],
  dispatched: ['received', 'issue'],
  received: ['completed', 'issue'],
  issue: ['dispatched', 'received', 'cancelled'],
  completed: [],
  cancelled: [],
};

const SA_ID_PATTERN = /^[0-9]{13}$/;

/** Validate a Medis reference: opaque, short, never an SA ID number. */
export function validateMedisRef(ref) {
  if (!ref || !String(ref).trim()) return 'A Medis reference is required';
  if (SA_ID_PATTERN.test(String(ref).trim())) return 'Use the Medis file reference, not an ID number';
  if (String(ref).length > 32) return 'Medis reference is too long';
  return null;
}

/** Returns the list of statuses a job may move to next. */
export function nextLabStatuses(status) {
  return LAB_TRANSITIONS[status] ?? [];
}

/**
 * Check whether a transition is allowed, including the field requirements
 * the database enforces. Returns null when OK, otherwise an error message.
 */
export function checkLabTransition(job, toStatus) {
  if (!nextLabStatuses(job.status).includes(toStatus)) {
    return `Cannot move a ${job.status} job to ${toStatus}`;
  }
  if (toStatus === 'assigned' && !job.assigned_to) return 'Assign a staff member first';
  if (toStatus === 'dispatched' && !job.lab_id) return 'Choose a lab first';
  if (toStatus === 'issue' && !String(job.issue_note ?? '').trim()) return 'Describe the issue first';
  return null;
}

/** Whole days between two dates (date-only, timezone safe). */
export function daysBetween(fromISO, toISO) {
  const a = Date.UTC(...ymd(fromISO));
  const b = Date.UTC(...ymd(toISO));
  return Math.round((b - a) / 86400000);
}

/**
 * Due-state for a lab job relative to `todayISO`.
 * Returns { state: 'overdue'|'due_today'|'due_soon'|'on_track'|'n/a', days }
 */
export function labJobDueState(job, todayISO, soonDays = 2) {
  if (!['dispatched', 'issue'].includes(job.status) || !job.expected_return) {
    return { state: 'n/a', days: null };
  }
  const d = daysBetween(todayISO, job.expected_return);
  if (d < 0) return { state: 'overdue', days: -d };
  if (d === 0) return { state: 'due_today', days: 0 };
  if (d <= soonDays) return { state: 'due_soon', days: d };
  return { state: 'on_track', days: d };
}

/** Summary counts for a lab board header. */
export function summariseLabJobs(jobs, todayISO) {
  const out = { open: 0, overdue: 0, issues: 0, awaitingDispatch: 0, readyToComplete: 0 };
  for (const j of jobs) {
    if (['completed', 'cancelled'].includes(j.status)) continue;
    out.open++;
    if (j.status === 'issue') out.issues++;
    if (['requested', 'assigned'].includes(j.status)) out.awaitingDispatch++;
    if (j.status === 'received') out.readyToComplete++;
    if (labJobDueState(j, todayISO).state === 'overdue') out.overdue++;
  }
  return out;
}

// --------------------------------------------------------------------- Stock
/** Same thresholds as the stock_status view. */
export function stockLevel(item) {
  const q = Number(item.quantity_on_hand);
  const min = Number(item.min_stock);
  if (q <= 0) return 'out';
  if (q <= min) return 'reorder';
  if (q <= min * 1.25) return 'low';
  return 'ok';
}

export function suggestedOrderQty(item) {
  return Math.max(Number(item.reorder_qty), Number(item.min_stock) - Number(item.quantity_on_hand));
}

/**
 * Validate a stock movement before sending it. Quantity is signed:
 * receive/return > 0, use/write_off < 0, adjust either way (managers only).
 */
export function checkStockMovement(item, movement, role) {
  const q = Number(movement.quantity);
  if (!Number.isFinite(q) || q === 0) return 'Enter a quantity';
  const t = movement.movement_type;
  if (['receive', 'return'].includes(t) && q < 0) return 'Received quantities must be positive';
  if (['use', 'write_off'].includes(t) && q > 0) return 'Usage must be recorded as a negative quantity';
  if (['adjust', 'write_off'].includes(t) && !['Admin', 'Manager'].includes(role)) {
    return 'Only a manager can adjust or write off stock';
  }
  if (Number(item.quantity_on_hand) + q < 0) {
    return `Insufficient stock: only ${item.quantity_on_hand} ${item.unit ?? ''} on hand`.trim();
  }
  return null;
}

/** Average daily usage over the last `windowDays`, and days of cover left. */
export function usageForecast(item, movements, todayISO, windowDays = 30) {
  const used = movements
    .filter((m) => m.item_id === item.id && m.movement_type === 'use')
    .filter((m) => {
      const age = daysBetween(m.at.slice(0, 10), todayISO);
      return age >= 0 && age < windowDays;
    })
    .reduce((sum, m) => sum + -Number(m.quantity), 0);
  const perDay = used / windowDays;
  const daysOfCover = perDay > 0 ? Math.floor(Number(item.quantity_on_hand) / perDay) : null;
  return { usedInWindow: used, perDay, daysOfCover };
}

// ---------------------------------------------------------------- HR / leave
/**
 * Default South African public holidays (fixed-date ones plus 2026–2027
 * Easter dates). Sunday holidays roll to Monday per the Public Holidays Act.
 * Confirm annually; pass your own list to override.
 */
const FIXED_HOLIDAYS = ['01-01', '03-21', '04-27', '05-01', '06-16', '08-09', '09-24', '12-16', '12-25', '12-26'];
const EASTER_HOLIDAYS = {
  2026: ['2026-04-03', '2026-04-06'],
  2027: ['2027-03-26', '2027-03-29'],
};

export function saPublicHolidays(year) {
  const base = [...FIXED_HOLIDAYS.map((md) => `${year}-${md}`), ...(EASTER_HOLIDAYS[year] ?? [])];
  const out = new Set(base);
  for (const d of base) {
    if (weekday(d) === 0) out.add(addDays(d, 1)); // Sunday -> Monday
  }
  return out;
}

/** Working days (Mon–Fri, excluding public holidays) in an inclusive range. */
export function countWorkingDays(startISO, endISO, holidays = null) {
  if (daysBetween(startISO, endISO) < 0) return 0;
  let n = 0;
  for (let d = startISO; daysBetween(d, endISO) >= 0; d = addDays(d, 1)) {
    const wd = weekday(d);
    const hol = holidays ?? saPublicHolidays(Number(d.slice(0, 4)));
    if (wd !== 0 && wd !== 6 && !hol.has(d)) n++;
  }
  return n;
}

/** Remaining annual leave for one staff member in a given year. */
export function annualLeaveBalance(staff, leaveRequests, year) {
  const taken = leaveRequests
    .filter((l) => l.staff_id === staff.id && l.leave_type === 'annual' && l.status === 'approved')
    .filter((l) => l.start_date.startsWith(String(year)))
    .reduce((sum, l) => sum + Number(l.working_days), 0);
  const pending = leaveRequests
    .filter((l) => l.staff_id === staff.id && l.leave_type === 'annual' && l.status === 'pending')
    .filter((l) => l.start_date.startsWith(String(year)))
    .reduce((sum, l) => sum + Number(l.working_days), 0);
  const entitlement = Number(staff.annual_leave_days);
  return { entitlement, taken, pending, remaining: entitlement - taken, remainingIfApproved: entitlement - taken - pending };
}

function overlaps(a1, a2, b1, b2) {
  return daysBetween(a1, b2) >= 0 && daysBetween(b1, a2) >= 0;
}

/** Leave requests that overlap another approved leave for the same person. */
export function findLeaveClashes(request, leaveRequests) {
  return leaveRequests.filter(
    (l) =>
      l.id !== request.id &&
      l.staff_id === request.staff_id &&
      l.status === 'approved' &&
      overlaps(request.start_date, request.end_date, l.start_date, l.end_date),
  );
}

/**
 * Roster problems for a date range:
 *  - 'on_leave': someone rostered on a day they have approved leave
 *  - 'understaffed': fewer than minPerDay people rostered on a working day
 */
export function rosterProblems(shifts, leaveRequests, startISO, endISO, minPerDay = 2, holidays = null) {
  const problems = [];
  const approved = leaveRequests.filter((l) => l.status === 'approved');
  for (const s of shifts) {
    const clash = approved.find(
      (l) => l.staff_id === s.staff_id && overlaps(s.shift_date, s.shift_date, l.start_date, l.end_date),
    );
    if (clash) problems.push({ type: 'on_leave', date: s.shift_date, staff_id: s.staff_id, shift_id: s.id });
  }
  for (let d = startISO; daysBetween(d, endISO) >= 0; d = addDays(d, 1)) {
    if (countWorkingDays(d, d, holidays) === 0) continue;
    const onDuty = new Set(
      shifts
        .filter((s) => s.shift_date === d)
        .filter((s) => !approved.some((l) => l.staff_id === s.staff_id && overlaps(d, d, l.start_date, l.end_date)))
        .map((s) => s.staff_id),
    );
    if (onDuty.size < minPerDay) problems.push({ type: 'understaffed', date: d, onDuty: onDuty.size, required: minPerDay });
  }
  return problems;
}

/**
 * O.C.E. ownership board gaps: areas with no active owner, or whose owner
 * is on approved leave on `todayISO` (so the escalation contact should cover).
 */
export function ownershipGaps(responsibilities, staff, leaveRequests, todayISO) {
  const activeIds = new Set(staff.filter((s) => s.active).map((s) => s.id));
  const onLeave = new Set(
    leaveRequests
      .filter((l) => l.status === 'approved' && overlaps(todayISO, todayISO, l.start_date, l.end_date))
      .map((l) => l.staff_id),
  );
  const gaps = [];
  for (const r of responsibilities) {
    if (!activeIds.has(r.owner_id)) gaps.push({ area: r.area, reason: 'owner_inactive', cover: r.escalation_id ?? null });
    else if (onLeave.has(r.owner_id)) gaps.push({ area: r.area, reason: 'owner_on_leave', cover: r.escalation_id ?? null });
  }
  return gaps;
}

// ------------------------------------------------------------------- helpers
function ymd(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return [y, m - 1, d];
}
function weekday(iso) {
  return new Date(Date.UTC(...ymd(iso))).getUTCDay();
}
export function addDays(iso, n) {
  const t = new Date(Date.UTC(...ymd(iso)) + n * 86400000);
  return t.toISOString().slice(0, 10);
}
