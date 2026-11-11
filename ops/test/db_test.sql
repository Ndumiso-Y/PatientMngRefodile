-- Database tests for the ops tracker. SYNTHETIC DATA ONLY: no real staff or patients.
\set ON_ERROR_STOP 1

-- helper: expect a statement to fail with a message fragment
create or replace function pg_temp.expect_error(stmt text, fragment text) returns void
language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if position(lower(fragment) in lower(sqlerrm)) = 0 then
      raise exception 'Expected error containing "%", got "%"', fragment, sqlerrm;
    end if;
    return;
  end;
  raise exception 'Expected failure ("%") but statement succeeded: %', fragment, stmt;
end $$;
grant execute on all functions in schema pg_temp to authenticated;

create or replace function pg_temp.assert(cond boolean, msg text) returns void
language plpgsql as $$ begin if not coalesce(cond,false) then raise exception 'ASSERT FAILED: %', msg; end if; end $$;

-- synthetic users
insert into auth.users(id, email) values
 ('00000000-0000-0000-0000-0000000000a1','admin@example.test'),
 ('00000000-0000-0000-0000-0000000000a2','assistant@example.test'),
 ('00000000-0000-0000-0000-0000000000a3','reception@example.test'),
 ('00000000-0000-0000-0000-0000000000a4','nobody@example.test');
insert into profiles(id, full_name, role) values
 ('00000000-0000-0000-0000-0000000000a1','Test Admin','Admin'),
 ('00000000-0000-0000-0000-0000000000a2','Test Assistant','Assistant'),
 ('00000000-0000-0000-0000-0000000000a3','Test Reception','Receptionist');

-- ===================== act as Admin =====================
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false);
select set_config('request.jwt.claim.role','authenticated',false);
set role authenticated;

insert into staff_members(id, user_id, display_name, job_title, ops_role) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','Staff A','Practice Manager','Manager'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000a2','Staff B','Dental Assistant','Assistant'),
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000000a3','Staff C','Receptionist','Receptionist');

insert into hr_responsibilities(area, owner_id, contributor_ids, escalation_id) values
 ('Lab jobs','10000000-0000-0000-0000-000000000002','{10000000-0000-0000-0000-000000000003}','10000000-0000-0000-0000-000000000001');

insert into dental_labs(id, name, typical_turnaround_days) values
 ('20000000-0000-0000-0000-000000000001','Synthetic Lab One', 5);

insert into stock_items(id, sku, name, unit, min_stock, reorder_qty) values
 ('30000000-0000-0000-0000-000000000001','GLV-M','Nitrile gloves (M)','box', 10, 20),
 ('30000000-0000-0000-0000-000000000002','ALG-1','Alginate impression material','bag', 4, 5);

-- ---------- STOCK ----------
insert into stock_movements(item_id, movement_type, quantity, note) values
 ('30000000-0000-0000-0000-000000000001','receive', 12, 'synthetic delivery'),
 ('30000000-0000-0000-0000-000000000002','receive', 5, 'synthetic delivery');
select pg_temp.assert((select quantity_on_hand from stock_items where sku='GLV-M') = 12, 'receive updates on-hand');
insert into stock_movements(item_id, movement_type, quantity) values ('30000000-0000-0000-0000-000000000001','use', -3);
select pg_temp.assert((select quantity_on_hand from stock_items where sku='GLV-M') = 9, 'use decrements on-hand');
select pg_temp.assert((select quantity_after from stock_movements order by id desc limit 1) = 9, 'ledger records balance after');
select pg_temp.assert((select stock_level from stock_status where sku='GLV-M') = 'reorder', 'at/below min => reorder');
select pg_temp.assert((select suggested_order_qty from stock_status where sku='GLV-M') = 20, 'suggested order qty');
select pg_temp.assert((select stock_level from stock_status where sku='ALG-1') = 'low', 'within 25% of min => low');
select pg_temp.expect_error($$insert into stock_movements(item_id, movement_type, quantity) values ('30000000-0000-0000-0000-000000000001','use', -50)$$, 'Insufficient stock');
select pg_temp.expect_error($$insert into stock_movements(item_id, movement_type, quantity) values ('30000000-0000-0000-0000-000000000001','use', 5)$$, 'check constraint');
select pg_temp.expect_error($$update stock_items set quantity_on_hand = 100 where sku='GLV-M'$$, 'stock movement');
update stock_movements set quantity = 1;   -- RLS: no update policy, so 0 rows touched
delete from stock_movements;               -- RLS: no delete policy, so 0 rows touched
select pg_temp.assert((select count(*) from stock_movements) = 3 and (select min(quantity) from stock_movements) = -3, 'RLS blocks ledger edits for app users');
update stock_items set min_stock = 5 where sku = 'GLV-M';  -- non-quantity edits allowed
select pg_temp.assert((select stock_level from stock_status where sku='GLV-M') = 'ok', 'min change re-evaluates level');

-- ---------- LAB JOBS ----------
insert into lab_jobs(id, job_number, medis_patient_ref, work_type, requested_by)
values ('40000000-0000-0000-0000-000000000001','LJ-0001','MEDIS-REF-TEST-1','Crown','10000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$insert into lab_jobs(job_number, medis_patient_ref, work_type) values ('LJ-X','8001015009087','Crown')$$, 'check constraint');
select pg_temp.expect_error($$insert into lab_jobs(job_number, medis_patient_ref, work_type, status) values ('LJ-Y','MEDIS-REF-2','Crown','dispatched')$$, 'must start as requested');
select pg_temp.expect_error($$update lab_jobs set status='dispatched' where job_number='LJ-0001'$$, 'Invalid lab job transition');
select pg_temp.expect_error($$update lab_jobs set status='assigned' where job_number='LJ-0001'$$, 'Assign a staff member');
update lab_jobs set status='assigned', assigned_to='10000000-0000-0000-0000-000000000002' where job_number='LJ-0001';
select pg_temp.expect_error($$update lab_jobs set status='dispatched' where job_number='LJ-0001'$$, 'Choose a lab');
update lab_jobs set status='dispatched', lab_id='20000000-0000-0000-0000-000000000001' where job_number='LJ-0001';
select pg_temp.assert((select expected_return from lab_jobs where job_number='LJ-0001') = current_date + 5, 'expected return defaults to lab turnaround');
select pg_temp.assert((select dispatched_at is not null from lab_jobs where job_number='LJ-0001'), 'dispatched_at stamped');
select pg_temp.expect_error($$update lab_jobs set status='issue' where job_number='LJ-0001'$$, 'Describe the issue');
update lab_jobs set status='issue', issue_note='Shade mismatch (synthetic)' where job_number='LJ-0001';
update lab_jobs set status='dispatched' where job_number='LJ-0001';
select pg_temp.assert((select remake_count from lab_jobs where job_number='LJ-0001') = 1, 'remake counted');
update lab_jobs set status='received' where job_number='LJ-0001';
update lab_jobs set status='completed' where job_number='LJ-0001';
select pg_temp.expect_error($$update lab_jobs set status='dispatched' where job_number='LJ-0001'$$, 'Invalid lab job transition');
select pg_temp.assert((select string_agg(to_status, '>' order by id) from lab_job_events where lab_job_id='40000000-0000-0000-0000-000000000001')
  = 'requested>assigned>dispatched>issue>dispatched>received>completed', 'full event trail recorded');
-- overdue view (synthetic back-dated job)
insert into lab_jobs(id, job_number, medis_patient_ref, work_type, assigned_to, lab_id)
values ('40000000-0000-0000-0000-000000000002','LJ-0002','MEDIS-REF-TEST-2','Denture','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001');
update lab_jobs set status='assigned' where job_number='LJ-0002';
update lab_jobs set status='dispatched', expected_return = current_date - 3 where job_number='LJ-0002';
select pg_temp.assert((select days_overdue from lab_jobs_overdue where job_number='LJ-0002') = 3, 'overdue days computed');
-- stock use linked to a lab job
insert into stock_movements(item_id, movement_type, quantity, lab_job_id) values ('30000000-0000-0000-0000-000000000002','use',-1,'40000000-0000-0000-0000-000000000002');

-- ---------- LEAVE ----------
insert into leave_requests(id, staff_id, leave_type, start_date, end_date, working_days) values
 ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','annual','2026-12-01','2026-12-05',5);
update leave_requests set status='approved' where id='50000000-0000-0000-0000-000000000001';
select pg_temp.assert((select decided_by from leave_requests where id='50000000-0000-0000-0000-000000000001') = '00000000-0000-0000-0000-0000000000a1', 'approver recorded');
insert into leave_requests(id, staff_id, leave_type, start_date, end_date, working_days) values
 ('50000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','annual','2026-12-04','2026-12-08',3);
select pg_temp.expect_error($$update leave_requests set status='approved' where id='50000000-0000-0000-0000-000000000002'$$, 'leave_no_overlap');
select pg_temp.expect_error($$update leave_requests set status='pending' where id='50000000-0000-0000-0000-000000000001'$$, 'Invalid leave status change');
reset role;

-- ===================== act as Assistant =====================
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2',false);
set role authenticated;
select pg_temp.assert((select count(*) from leave_requests) = 2, 'assistant sees own leave');
select pg_temp.expect_error($$update leave_requests set status='declined' where id='50000000-0000-0000-0000-000000000002'$$, 'Only Admin/Manager');
update leave_requests set status='cancelled' where id='50000000-0000-0000-0000-000000000002';
insert into stock_movements(item_id, movement_type, quantity) values ('30000000-0000-0000-0000-000000000001','use',-1);
select pg_temp.expect_error($$insert into stock_movements(item_id, movement_type, quantity) values ('30000000-0000-0000-0000-000000000001','adjust',5)$$, 'row-level security');
select pg_temp.expect_error($$insert into stock_items(name) values ('Rogue item')$$, 'row-level security');
select pg_temp.assert((select count(*) from ops_audit_log) = 0, 'assistant cannot read audit log');
select pg_temp.assert((select count(*) from lab_jobs) = 2, 'assistant can see lab jobs');
reset role;

-- ===================== act as Receptionist =====================
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a3',false);
set role authenticated;
select pg_temp.assert((select count(*) from leave_requests) = 0, 'receptionist cannot see colleague leave');
select pg_temp.expect_error($$insert into leave_requests(staff_id, leave_type, start_date, end_date, working_days) values ('10000000-0000-0000-0000-000000000002','sick','2026-12-10','2026-12-10',1)$$, 'row-level security');
insert into leave_requests(staff_id, leave_type, start_date, end_date, working_days) values ('10000000-0000-0000-0000-000000000003','family_responsibility','2026-12-10','2026-12-10',1);
reset role;

-- ===================== signed in, no profile =====================
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a4',false);
set role authenticated;
select pg_temp.assert((select count(*) from lab_jobs) = 0, 'no-profile user sees no lab jobs');
select pg_temp.assert((select count(*) from stock_items) = 0, 'no-profile user sees no stock');
reset role;

-- ===================== audit trail =====================
select pg_temp.assert((select count(*) from ops_audit_log where table_name='lab_jobs') >= 8, 'lab job changes audited');
select pg_temp.assert((select count(*) from ops_audit_log where table_name='leave_requests' and action='UPDATE') >= 2, 'leave decisions audited');
-- second layer: even privileged/service connections cannot rewrite history
select pg_temp.expect_error($$delete from ops_audit_log$$, 'append-only');
select pg_temp.expect_error($$update stock_movements set quantity = 1$$, 'append-only');
select pg_temp.expect_error($$delete from lab_job_events$$, 'append-only');
\echo db_test.sql: all assertions passed
