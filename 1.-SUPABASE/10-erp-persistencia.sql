-- ═══════════════════════════════════════════════════════════════
-- 10. PERSISTENCIA DEL ERP (ventas, gastos, inventario, etc.)
-- Tabla genérica: cada fila es un documento JSON de una colección
-- del ERP, perteneciente a un usuario (empresario/equipo).
-- Ejecutar en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.erp_datos (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  coleccion  text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint erp_datos_pk primary key (usuario_id, coleccion, id)
);

create index if not exists erp_datos_usuario_idx on public.erp_datos (usuario_id);

alter table public.erp_datos enable row level security;

drop policy if exists erp_datos_owner_all on public.erp_datos;
create policy erp_datos_owner_all on public.erp_datos
  for all
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create or replace function public.update_erp_datos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists erp_datos_updated_at on public.erp_datos;
create trigger erp_datos_updated_at
  before update on public.erp_datos
  for each row execute function public.update_erp_datos_updated_at();