// Unit tests for ops domain rules. SYNTHETIC DATA ONLY.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/opsDomain.js';

const TODAY = '2026-11-11';

test('lab: valid transitions mirror the database', () => {
  assert.deepEqual(D.nextLabStatuses('requested'), ['assigned', 'cancelled']);
  assert.deepEqual(D.nextLabStatuses('completed'), []);
  assert.match(D.checkLabTransition({ status: 'requested' }, 'dispatched'), /Cannot move/);
  assert.match(D.checkLabTransition({ status: 'requested' }, 'assigned'), /Assign a staff member/);
  assert.equal(D.checkLabTransition({ status: 'requested', assigned_to: 's1' }, 'assigned'), null);
  assert.match(D.checkLabTransition({ status: 'assigned', assigned_to: 's1' }, 'dispatched'), /Choose a lab/);
  assert.match(D.checkLabTransition({ status: 'dispatched' }, 'issue'), /Describe the issue/);
  assert.equal(D.checkLabTransition({ status: 'issue', lab_id: 'l1' }, 'dispatched'), null);
});

test('lab: Medis reference guard blocks SA ID numbers', () => {
  assert.match(D.validateMedisRef('8001015009087'), /not an ID number/);
  assert.match(D.validateMedisRef(''), /required/);
  assert.equal(D.validateMedisRef('MEDIS-REF-TEST-1'), null);
});

test('lab: due state and board summary', () => {
  const jobs = [
    { status: 'dispatched', expected_return: '2026-11-08' },
    { status: 'dispatched', expected_return: '2026-11-11' },
    { status: 'issue', expected_return: '2026-11-12' },
    { status: 'dispatched', expected_return: '2026-11-20' },
    { status: 'requested' },
    { status: 'received' },
    { status: 'completed', expected_return: '2026-01-01' },
  ];
  assert.deepEqual(D.labJobDueState(jobs[0], TODAY), { state: 'overdue', days: 3 });
  assert.equal(D.labJobDueState(jobs[1], TODAY).state, 'due_today');
  assert.equal(D.labJobDueState(jobs[2], TODAY).state, 'due_soon');
  assert.equal(D.labJobDueState(jobs[3], TODAY).state, 'on_track');
  assert.equal(D.labJobDueState(jobs[6], TODAY).state, 'n/a');
  assert.deepEqual(D.summariseLabJobs(jobs, TODAY), { open: 6, overdue: 1, issues: 1, awaitingDispatch: 1, readyToComplete: 1 });
});

test('stock: levels and reorder suggestion match the stock_status view', () => {
  assert.equal(D.stockLevel({ quantity_on_hand: 0, min_stock: 5 }), 'out');
  assert.equal(D.stockLevel({ quantity_on_hand: 5, min_stock: 5 }), 'reorder');
  assert.equal(D.stockLevel({ quantity_on_hand: 6, min_stock: 5 }), 'low');
  assert.equal(D.stockLevel({ quantity_on_hand: 7, min_stock: 5 }), 'ok');
  assert.equal(D.suggestedOrderQty({ quantity_on_hand: 2, min_stock: 10, reorder_qty: 5 }), 8);
  assert.equal(D.suggestedOrderQty({ quantity_on_hand: 9, min_stock: 10, reorder_qty: 20 }), 20);
});

test('stock: movement validation', () => {
  const item = { quantity_on_hand: 4, unit: 'box' };
  assert.match(D.checkStockMovement(item, { movement_type: 'use', quantity: -5 }, 'Assistant'), /only 4 box/);
  assert.match(D.checkStockMovement(item, { movement_type: 'use', quantity: 2 }, 'Assistant'), /negative/);
  assert.match(D.checkStockMovement(item, { movement_type: 'adjust', quantity: 2 }, 'Assistant'), /manager/);
  assert.equal(D.checkStockMovement(item, { movement_type: 'adjust', quantity: -1 }, 'Manager'), null);
  assert.equal(D.checkStockMovement(item, { movement_type: 'receive', quantity: 10 }, 'Receptionist'), null);
});

test('stock: usage forecast', () => {
  const item = { id: 'i1', quantity_on_hand: 30 };
  const moves = [
    { item_id: 'i1', movement_type: 'use', quantity: -10, at: '2026-11-01T09:00:00Z' },
    { item_id: 'i1', movement_type: 'use', quantity: -5, at: '2026-10-25T09:00:00Z' },
    { item_id: 'i1', movement_type: 'use', quantity: -99, at: '2026-09-01T09:00:00Z' }, // outside window
    { item_id: 'i1', movement_type: 'receive', quantity: 50, at: '2026-11-02T09:00:00Z' },
  ];
  const f = D.usageForecast(item, moves, TODAY, 30);
  assert.equal(f.usedInWindow, 15);
  assert.equal(f.daysOfCover, 60);
});

test('leave: SA public holidays incl. Sunday roll-over', () => {
  const h = D.saPublicHolidays(2026);
  assert.ok(h.has('2026-08-10'), '9 Aug 2026 is a Sunday so Monday is off');
  assert.ok(h.has('2026-04-03') && h.has('2026-04-06'), 'Easter 2026');
  assert.equal(D.countWorkingDays('2026-12-14', '2026-12-18'), 4, 'Day of Reconciliation excluded');
  assert.equal(D.countWorkingDays('2026-12-01', '2026-12-05'), 4, 'Saturday excluded');
  assert.equal(D.countWorkingDays('2026-12-05', '2026-12-01'), 0);
});

test('leave: balance and clashes', () => {
  const staff = { id: 's1', annual_leave_days: 15 };
  const leave = [
    { id: 'a', staff_id: 's1', leave_type: 'annual', status: 'approved', start_date: '2026-03-02', end_date: '2026-03-06', working_days: 5 },
    { id: 'b', staff_id: 's1', leave_type: 'annual', status: 'pending', start_date: '2026-12-21', end_date: '2026-12-23', working_days: 3 },
    { id: 'c', staff_id: 's1', leave_type: 'sick', status: 'approved', start_date: '2026-05-04', end_date: '2026-05-04', working_days: 1 },
    { id: 'd', staff_id: 's1', leave_type: 'annual', status: 'approved', start_date: '2025-12-01', end_date: '2025-12-05', working_days: 5 },
  ];
  assert.deepEqual(D.annualLeaveBalance(staff, leave, 2026), { entitlement: 15, taken: 5, pending: 3, remaining: 10, remainingIfApproved: 7 });
  const req = { id: 'x', staff_id: 's1', start_date: '2026-03-05', end_date: '2026-03-10' };
  assert.deepEqual(D.findLeaveClashes(req, leave).map((l) => l.id), ['a']);
  assert.deepEqual(D.findLeaveClashes({ ...req, staff_id: 's2' }, leave), []);
});

test('roster: flags staff on leave and understaffed days', () => {
  const shifts = [
    { id: 1, staff_id: 's1', shift_date: '2026-11-16' },
    { id: 2, staff_id: 's2', shift_date: '2026-11-16' },
    { id: 3, staff_id: 's1', shift_date: '2026-11-17' },
    { id: 4, staff_id: 's3', shift_date: '2026-11-17' },
  ];
  const leave = [{ staff_id: 's3', status: 'approved', start_date: '2026-11-17', end_date: '2026-11-17' }];
  const p = D.rosterProblems(shifts, leave, '2026-11-16', '2026-11-17', 2);
  assert.deepEqual(p, [
    { type: 'on_leave', date: '2026-11-17', staff_id: 's3', shift_id: 4 },
    { type: 'understaffed', date: '2026-11-17', onDuty: 1, required: 2 },
  ]);
});

test('O.C.E. board: owner gaps fall back to escalation contact', () => {
  const staff = [{ id: 's1', active: true }, { id: 's2', active: false }, { id: 's3', active: true }];
  const resp = [
    { area: 'Lab jobs', owner_id: 's1', escalation_id: 's3' },
    { area: 'Stock ordering', owner_id: 's2', escalation_id: 's3' },
    { area: 'Sterilisation', owner_id: 's3', escalation_id: null },
  ];
  const leave = [{ staff_id: 's1', status: 'approved', start_date: '2026-11-10', end_date: '2026-11-12' }];
  assert.deepEqual(D.ownershipGaps(resp, staff, leave, TODAY), [
    { area: 'Lab jobs', reason: 'owner_on_leave', cover: 's3' },
    { area: 'Stock ordering', reason: 'owner_inactive', cover: 's3' },
  ]);
});
