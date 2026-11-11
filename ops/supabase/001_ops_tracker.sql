-- =====================================================================
-- Refodile Health Centre: Operations Tracker foundation
-- HR (staff, roster, leave) + Lab jobs + Materials/stock + audit history
--
-- Scope: operational tracking only. Patient records, appointments,
-- clinical notes and billing stay in Medis. Lab jobs store only an
-- opaque Medis reference, never patient names, ID numbers or clinical
-- detail (POPIA minimisation).
--
-- Depends on the existing `profiles` table (id -> auth.users, role).
-- Additive only: no existing table is altered or dropped.
-- =====================================================================

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Role helper. Reads the existing profiles.role column.
-- Ops roles: Admin, Manager, Clinician, Assistant, Receptionist
-- ---------------------------------------------------------------------
create or replace function public.ops_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'none');
$$;

create or replace function public.ops_is_manager() returns boolean
language sql stable as $$ select public.ops_role() in ('Admin','Manager'); $$;

-- ---------------------------------------------------------------------
-- Audit history (append-only)
-- ---------------------------------------------------------------------
create table if not exists public.ops_audit_log (
  id          bigint generated always as identity primary key,
  table_name  text not null,
  row_id      uuid,
  action      text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  actor       uuid default auth.uid(),
  at          timestamptz not null default now()
);

create or replace function public.ops_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.ops_audit_log(table_name, row_id, action, old_data, new_data)
  values (tg_table_name,
          coalesce((case when tg_op = 'DELETE' then old.id else new.id end), null),
          tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create or replace function public.ops_block_mutation() returns trigger
language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = 'P0001';
end $$;

create or replace function public.ops_touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------------
-- HR: staff members (work details only: no ID numbers, salaries,
-- addresses, banking or medical info)
-- ---------------------------------------------------------------------
create table if not exists public.staff_members (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique references auth.users(id) on delete set null,
  display_name     text not null,
  job_title        text not null,
  ops_role         text not null default 'Assistant'
                   check (ops_role in ('Admin','Manager','Clinician','Assistant','Receptionist')),
  practice_site    text not null default 'refodile-main',
  employment_type  text not null default 'permanent'
                   check (employment_type in ('permanent','contract','locum','intern')),
  start_date       date,
  annual_leave_days numeric(5,1) not null default 15 check (annual_leave_days >= 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- O.C.E. ownership: who Owns, who Contributes, who is kept informed (Escalation)
-- for each operational responsibility area.
create table if not exists public.hr_responsibilities (
  id            uuid primary key default gen_random_uuid(),
  area          text not null,           -- e.g. 'Lab jobs', 'Stock ordering', 'Sterilisation'
  description   text,
  owner_id      uuid not null references public.staff_members(id),
  contributor_ids uuid[] not null default '{}',
  escalation_id uuid references public.staff_members(id),
  review_cadence text not null default 'weekly'
                check (review_cadence in ('daily','weekly','monthly','quarterly')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (area)
);

create table if not exists public.roster_shifts (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references public.staff_members(id) on delete cascade,
  shift_date   date not null,
  start_time   time not null,
  end_time     time not null,
  practice_site text not null default 'refodile-main',
  duty         text,                         -- e.g. 'Chairside', 'Front desk', 'Sterilisation'
  created_at   timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists roster_shifts_date_idx on public.roster_shifts (shift_date);

create table if not exists public.leave_requests (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references public.staff_members(id) on delete cascade,
  leave_type   text not null check (leave_type in ('annual','sick','family_responsibility','study','unpaid','other')),
  start_date   date not null,
  end_date     date not null,
  working_days numeric(4,1) not null check (working_days > 0),
  status       text not null default 'pending'
               check (status in ('pending','approved','declined','cancelled')),
  reason_note  text check (char_length(reason_note) <= 280),  -- no medical detail
  decided_by   uuid references auth.users(id),
  decided_at   timestamptz,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_date >= start_date),
  -- one staff member cannot hold two overlapping approved leave periods
  constraint leave_no_overlap exclude using gist (
    staff_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status = 'approved')
);

-- Only managers may approve/decline; staff may only cancel their own pending request.
create or replace function public.leave_guard() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    -- allowed: pending -> approved|declined|cancelled, approved -> cancelled
    if not ((old.status = 'pending' and new.status in ('approved','declined','cancelled'))
         or (old.status = 'approved' and new.status = 'cancelled')) then
      raise exception 'Invalid leave status change % -> %', old.status, new.status;
    end if;
    if new.status in ('approved','declined') then
      if not public.ops_is_manager() then
        raise exception 'Only Admin/Manager can % leave', new.status;
      end if;
      new.decided_by := auth.uid();
      new.decided_at := now();
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Lab jobs
-- requested -> assigned -> dispatched -> received -> completed
--                              |  ^          |
--                              v  |          v
--                             issue  <-------+
-- ---------------------------------------------------------------------
create table if not exists public.dental_labs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  contact_note text,
  typical_turnaround_days int not null default 7 check (typical_turnaround_days > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.lab_jobs (
  id                uuid primary key default gen_random_uuid(),
  job_number        text not null unique,
  -- Opaque reference into Medis. Never a name or SA ID number.
  medis_patient_ref text not null
                    check (medis_patient_ref !~ '^[0-9]{13}$' and char_length(medis_patient_ref) <= 32),
  work_type         text not null,          -- e.g. 'Crown', 'Bridge', 'Denture', 'Night guard'
  lab_id            uuid references public.dental_labs(id),
  requested_by      uuid references public.staff_members(id),
  assigned_to       uuid references public.staff_members(id),
  status            text not null default 'requested'
                    check (status in ('requested','assigned','dispatched','received','issue','completed','cancelled')),
  requested_at      timestamptz not null default now(),
  dispatched_at     timestamptz,
  expected_return   date,
  received_at       timestamptz,
  completed_at      timestamptz,
  issue_note        text check (char_length(issue_note) <= 500),
  remake_count      int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists lab_jobs_status_idx on public.lab_jobs (status, expected_return);

create table if not exists public.lab_job_events (
  id          bigint generated always as identity primary key,
  lab_job_id  uuid not null references public.lab_jobs(id) on delete cascade,
  from_status text,
  to_status   text not null,
  note        text,
  actor       uuid default auth.uid(),
  at          timestamptz not null default now()
);

create or replace function public.lab_job_transition() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  allowed jsonb := '{
    "requested":  ["assigned","cancelled"],
    "assigned":   ["dispatched","cancelled"],
    "dispatched": ["received","issue"],
    "received":   ["completed","issue"],
    "issue":      ["dispatched","received","cancelled"],
    "completed":  [],
    "cancelled":  []
  }';
begin
  if tg_op = 'INSERT' then
    if new.status <> 'requested' then
      raise exception 'New lab jobs must start as requested';
    end if;
    insert into public.lab_job_events(lab_job_id, from_status, to_status) values (new.id, null, 'requested');
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (allowed -> old.status) ? new.status then
      raise exception 'Invalid lab job transition % -> %', old.status, new.status;
    end if;
    if new.status = 'assigned' and new.assigned_to is null then
      raise exception 'Assign a staff member before moving to assigned';
    end if;
    if new.status = 'dispatched' then
      if new.lab_id is null then raise exception 'Choose a lab before dispatch'; end if;
      new.dispatched_at := now();
      if old.status = 'issue' then
        -- remake / re-send: count it and reset the due date unless one was given
        new.remake_count := old.remake_count + 1;
        if new.expected_return is not distinct from old.expected_return then
          new.expected_return := null;
        end if;
      end if;
      new.expected_return := coalesce(new.expected_return,
        current_date + (select typical_turnaround_days from public.dental_labs where id = new.lab_id));
    end if;
    if new.status = 'issue' and coalesce(trim(new.issue_note),'') = '' then
      raise exception 'Describe the issue before flagging it';
    end if;
    if new.status = 'received' then new.received_at := now(); end if;
    if new.status = 'completed' then new.completed_at := now(); end if;
    insert into public.lab_job_events(lab_job_id, from_status, to_status, note)
    values (new.id, old.status, new.status, case when new.status = 'issue' then new.issue_note end);
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Materials / stock
-- quantity_on_hand is maintained ONLY by stock_movements (ledger).
-- ---------------------------------------------------------------------
create table if not exists public.stock_items (
  id               uuid primary key default gen_random_uuid(),
  sku              text unique,
  name             text not null,
  category         text not null default 'consumable',
  unit             text not null default 'unit',
  quantity_on_hand numeric(10,2) not null default 0 check (quantity_on_hand >= 0),
  min_stock        numeric(10,2) not null default 0 check (min_stock >= 0),
  reorder_qty      numeric(10,2) not null default 0 check (reorder_qty >= 0),
  supplier         text,
  storage_location text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id            bigint generated always as identity primary key,
  item_id       uuid not null references public.stock_items(id),
  movement_type text not null check (movement_type in ('receive','use','adjust','write_off','return')),
  quantity      numeric(10,2) not null check (quantity <> 0),  -- signed: + in, - out
  quantity_after numeric(10,2),
  lab_job_id    uuid references public.lab_jobs(id),
  note          text check (char_length(note) <= 280),
  performed_by  uuid default auth.uid(),
  at            timestamptz not null default now(),
  check ((movement_type in ('receive','return') and quantity > 0)
      or (movement_type in ('use','write_off') and quantity < 0)
      or movement_type = 'adjust')
);
create index if not exists stock_movements_item_idx on public.stock_movements (item_id, at desc);

create or replace function public.stock_apply_movement() returns trigger
language plpgsql security definer set search_path = public as $$
declare q numeric;
begin
  select quantity_on_hand + new.quantity into q
    from public.stock_items where id = new.item_id for update;
  if q is null then raise exception 'Unknown stock item'; end if;
  if q < 0 then
    raise exception 'Insufficient stock: only % on hand', q - new.quantity;
  end if;
  update public.stock_items
     set quantity_on_hand = q, updated_at = now()
   where id = new.item_id;
  new.quantity_after := q;
  return new;
end $$;

-- Prevent direct edits to quantity_on_hand except via the ledger trigger.
create or replace function public.stock_item_guard() returns trigger
language plpgsql as $$
begin
  if new.quantity_on_hand is distinct from old.quantity_on_hand
     and pg_trigger_depth() < 2 then
    raise exception 'Change stock levels by recording a stock movement';
  end if;
  return new;
end $$;

create or replace view public.stock_status
with (security_invoker = true) as
select i.*,
       case when i.quantity_on_hand <= 0 then 'out'
            when i.quantity_on_hand <= i.min_stock then 'reorder'
            when i.quantity_on_hand <= i.min_stock * 1.25 then 'low'
            else 'ok' end as stock_level,
       greatest(i.reorder_qty, i.min_stock - i.quantity_on_hand) as suggested_order_qty
  from public.stock_items i
 where i.active;

create or replace view public.lab_jobs_overdue
with (security_invoker = true) as
select j.*, current_date - j.expected_return as days_overdue
  from public.lab_jobs j
 where j.status in ('dispatched','issue') and j.expected_return < current_date;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['staff_members','hr_responsibilities','roster_shifts','leave_requests',
                           'dental_labs','lab_jobs','stock_items'] loop
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I
                    for each row execute function public.ops_audit()', t, t);
  end loop;
  foreach t in array array['staff_members','hr_responsibilities','leave_requests','lab_jobs','stock_items'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I
                    for each row execute function public.ops_touch_updated_at()', t, t);
  end loop;
end $$;

drop trigger if exists leave_requests_guard on public.leave_requests;
create trigger leave_requests_guard before update on public.leave_requests
  for each row execute function public.leave_guard();

drop trigger if exists lab_jobs_transition_ins on public.lab_jobs;
create trigger lab_jobs_transition_ins after insert on public.lab_jobs
  for each row execute function public.lab_job_transition();
drop trigger if exists lab_jobs_transition_upd on public.lab_jobs;
create trigger lab_jobs_transition_upd before update on public.lab_jobs
  for each row execute function public.lab_job_transition();

drop trigger if exists stock_movements_apply on public.stock_movements;
create trigger stock_movements_apply before insert on public.stock_movements
  for each row execute function public.stock_apply_movement();
drop trigger if exists stock_movements_immutable on public.stock_movements;
create trigger stock_movements_immutable before update or delete on public.stock_movements
  for each row execute function public.ops_block_mutation();
drop trigger if exists stock_items_guard on public.stock_items;
create trigger stock_items_guard before update on public.stock_items
  for each row execute function public.stock_item_guard();

drop trigger if exists ops_audit_log_immutable on public.ops_audit_log;
create trigger ops_audit_log_immutable before update or delete on public.ops_audit_log
  for each row execute function public.ops_block_mutation();
drop trigger if exists lab_job_events_immutable on public.lab_job_events;
create trigger lab_job_events_immutable before update or delete on public.lab_job_events
  for each row execute function public.ops_block_mutation();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.staff_members       enable row level security;
alter table public.hr_responsibilities enable row level security;
alter table public.roster_shifts       enable row level security;
alter table public.leave_requests      enable row level security;
alter table public.dental_labs         enable row level security;
alter table public.lab_jobs            enable row level security;
alter table public.lab_job_events      enable row level security;
alter table public.stock_items         enable row level security;
alter table public.stock_movements     enable row level security;
alter table public.ops_audit_log       enable row level security;

-- Staff directory, ownership board, roster: everyone signed in reads; managers write.
create policy staff_read   on public.staff_members       for select to authenticated using (true);
create policy staff_write  on public.staff_members       for all    to authenticated using (public.ops_is_manager()) with check (public.ops_is_manager());
create policy resp_read    on public.hr_responsibilities for select to authenticated using (true);
create policy resp_write   on public.hr_responsibilities for all    to authenticated using (public.ops_is_manager()) with check (public.ops_is_manager());
create policy roster_read  on public.roster_shifts       for select to authenticated using (true);
create policy roster_write on public.roster_shifts       for all    to authenticated using (public.ops_is_manager()) with check (public.ops_is_manager());

-- Leave: managers see all; staff see and request only their own.
create policy leave_read on public.leave_requests for select to authenticated using (
  public.ops_is_manager()
  or staff_id in (select id from public.staff_members where user_id = auth.uid()));
create policy leave_insert on public.leave_requests for insert to authenticated with check (
  status = 'pending' and (public.ops_is_manager()
  or staff_id in (select id from public.staff_members where user_id = auth.uid())));
create policy leave_update on public.leave_requests for update to authenticated using (
  public.ops_is_manager()
  or staff_id in (select id from public.staff_members where user_id = auth.uid()));

-- Lab jobs & stock: all clinical/admin roles operate; only managers delete/configure.
create policy labs_read   on public.dental_labs for select to authenticated using (true);
create policy labs_write  on public.dental_labs for all    to authenticated using (public.ops_is_manager()) with check (public.ops_is_manager());
create policy jobs_read   on public.lab_jobs for select to authenticated using (public.ops_role() <> 'none');
create policy jobs_insert on public.lab_jobs for insert to authenticated with check (public.ops_role() <> 'none');
create policy jobs_update on public.lab_jobs for update to authenticated using (public.ops_role() <> 'none');
create policy jobs_delete on public.lab_jobs for delete to authenticated using (public.ops_is_manager());
create policy job_events_read on public.lab_job_events for select to authenticated using (public.ops_role() <> 'none');

create policy items_read   on public.stock_items for select to authenticated using (public.ops_role() <> 'none');
create policy items_write  on public.stock_items for all    to authenticated using (public.ops_is_manager()) with check (public.ops_is_manager());
create policy moves_read   on public.stock_movements for select to authenticated using (public.ops_role() <> 'none');
create policy moves_insert on public.stock_movements for insert to authenticated with check (
  public.ops_role() <> 'none'
  and (movement_type in ('use','receive','return') or public.ops_is_manager()));  -- adjust/write-off: managers

create policy audit_read on public.ops_audit_log for select to authenticated using (public.ops_is_manager());
