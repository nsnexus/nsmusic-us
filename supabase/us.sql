-- NEW US DATABASE ONLY. Apply schema.sql first, then this file. Never apply to the Brazil database.
begin;
create table if not exists public.us_checkout_sessions (
  id text primary key, order_id text not null references public.orders(id),
  sku text not null check (sku in ('audio_only','combo_carta','combo','combo_retrospectiva')),
  amount_cents integer not null, currency text not null default 'usd' check(currency='usd'),
  payment_intent text, paid_at timestamptz, revoked boolean not null default false,
  created_at timestamptz not null default now(),
  check(amount_cents = case sku when 'audio_only' then 499 when 'combo_carta' then 599 when 'combo' then 799 when 'combo_retrospectiva' then 999 end)
);
create index if not exists us_sessions_order on public.us_checkout_sessions(order_id);
create index if not exists us_sessions_intent on public.us_checkout_sessions(payment_intent);

create or replace function public.us_patch_order(p_id text, p_patch jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  update orders set
    extras=coalesce(extras,'{}'::jsonb)||coalesce(p_patch->'extras','{}'::jsonb),
    production_status=case when p_patch?'production_status' then p_patch->>'production_status' else production_status end,
    suno_task_id=case when p_patch?'suno_task_id' then p_patch->>'suno_task_id' else suno_task_id end,
    suno_provider=case when p_patch?'suno_provider' then p_patch->>'suno_provider' else suno_provider end,
    suno_requested_at=case when p_patch?'suno_requested_at' then (p_patch->>'suno_requested_at')::timestamptz else suno_requested_at end,
    suno_error=case when p_patch?'suno_error' then p_patch->>'suno_error' else suno_error end,
    audio_url=case when p_patch?'audio_url' then p_patch->>'audio_url' else audio_url end,
    audio_files=case when p_patch?'audio_files' then array(select jsonb_array_elements_text(p_patch->'audio_files')) else audio_files end,
    video_url=case when p_patch?'video_url' then p_patch->>'video_url' else video_url end,
    updated_at=now()
  where id=p_id and deleted_at is null and extras->'us'->>'market'='US';
  return found;
end $$;

create or replace function public.us_reserve_generation(p_id text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  update orders set production_status='GERANDO_AUDIO', suno_requested_at=now(), updated_at=now(), suno_generation_count=suno_generation_count+1
  where id=p_id and deleted_at is null and extras->'us'->>'market'='US'
    and payment_status in ('PAGO','PAGAMENTO_APROVADO') and suno_task_id is null
    and production_status in ('LETRA_CRIADA','ERRO_GERACAO');
  return found;
end $$;

create or replace function public.us_refresh_rights(p_id text) returns void
language plpgsql security definer set search_path=public as $$
declare tier integer; package_sku text; total_cents bigint;
begin
  perform 1 from orders where id=p_id for update;
  select coalesce(max(case sku when 'audio_only' then 1 when 'combo_carta' then 2 when 'combo' then 3 when 'combo_retrospectiva' then 4 end),0), coalesce(sum(amount_cents),0)
  into tier,total_cents from us_checkout_sessions where order_id=p_id and paid_at is not null and not revoked;
  package_sku=case tier when 1 then 'audio_only' when 2 then 'combo_carta' when 3 then 'combo' when 4 then 'combo_retrospectiva' else null end;
  update orders set payment_status=case when tier>0 then 'PAGAMENTO_APROVADO' else 'REEMBOLSADO' end,
    has_carta_access=tier>=2, has_video_access=tier>=3, has_retrospectiva_access=tier>=4,
    extras=extras||jsonb_build_object('usPackageSku',package_sku,'usPaidCents',total_cents,'currency','usd','total',total_cents/100.0), updated_at=now()
  where id=p_id;
end $$;

create or replace function public.us_fulfill_checkout(p_session_id text, p_payment_intent text) returns boolean
language plpgsql security definer set search_path=public as $$
declare s us_checkout_sessions%rowtype;
begin
  select * into s from us_checkout_sessions where id=p_session_id for update;
  if not found or s.revoked then return false; end if;
  perform 1 from orders where id=s.order_id and extras->'us'->>'market'='US' and deleted_at is null for update;
  if not found then return false; end if;
  if s.paid_at is null then
    update us_checkout_sessions set paid_at=now(),payment_intent=p_payment_intent where id=s.id;
    update orders set paid_at=coalesce(paid_at,now()), extras=extras||jsonb_build_object('paymentId',s.id,'paymentMethod','stripe') where id=s.order_id;
    insert into payments(order_id,txid,kind,sku,amount,paid_at) values(s.order_id,s.id,'musica',s.sku,s.amount_cents/100.0,now()) on conflict(txid,kind) do nothing;
  end if;
  perform us_refresh_rights(s.order_id);
  return true;
end $$;

create or replace function public.us_revoke_payment(p_payment_intent text) returns void
language plpgsql security definer set search_path=public as $$
declare changed record;
begin
  for changed in update us_checkout_sessions set revoked=true where payment_intent=p_payment_intent and not revoked returning order_id loop
    perform us_refresh_rights(changed.order_id);
  end loop;
end $$;

-- Customer browsers never talk to tables/RPCs directly. All ownership is checked server-side.
alter table orders enable row level security;
alter table payments enable row level security;
alter table suno_tasks enable row level security;
alter table us_checkout_sessions enable row level security;
-- Baseline report views use the owner's privileges; restrict them explicitly as well.
revoke all on vendas_por_dia,producao_por_dia,cota_por_cliente from public,anon,authenticated;
grant select on vendas_por_dia,producao_por_dia,cota_por_cliente to service_role;
revoke all on us_checkout_sessions from anon,authenticated;
revoke all on function us_patch_order(text,jsonb),us_reserve_generation(text),us_refresh_rights(text),us_fulfill_checkout(text,text),us_revoke_payment(text) from public,anon,authenticated;
grant execute on function us_patch_order(text,jsonb),us_reserve_generation(text),us_refresh_rights(text),us_fulfill_checkout(text,text),us_revoke_payment(text) to service_role;
grant all on us_checkout_sessions to service_role;
commit;
