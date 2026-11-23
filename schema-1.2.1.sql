-- v1.2.1: per-lead history (members may read history rows that belong to a lead)
create index if not exists audit_lead on public.audit_log(lead_id, created_at desc);
drop policy if exists audit_lead_sel on public.audit_log;
create policy audit_lead_sel on public.audit_log for select
  using (public.is_member(org_id) and lead_id is not null);

-- needed if not run before (v1.2 / v1.1)
alter table public.orgs add column if not exists msg text;
alter table public.orgs add column if not exists heat jsonb default '{"hot":14,"warm":30}';
