-- Arranca — Database Schema
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension (usually already enabled in Supabase)
create extension if not exists "uuid-ossp";

-- Companies
create table companies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('CA', 'SRL', 'FP', 'PYME')) not null,
  status text default 'draft' not null,
  domicilio text,
  objeto_social text,
  capital_social numeric default 0,
  ejercicio_fiscal text,
  tipo_negocio text,
  num_socios text,
  es_extranjero boolean default false,
  current_step integer default 0,
  wizard_data jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index companies_user_id_idx on companies(user_id);

-- Socios
create table socios (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  nombre text not null,
  cedula text,
  porcentaje numeric default 0,
  cargo text,
  orden integer default 0,
  created_at timestamptz default now() not null
);

create index socios_company_id_idx on socios(company_id);

-- Tareas (action items per phase)
create table tareas (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  fase integer not null,
  nombre text not null,
  descripcion text,
  completada boolean default false,
  completed_at timestamptz,
  link text,
  orden integer default 0,
  created_at timestamptz default now() not null
);

create index tareas_company_id_idx on tareas(company_id);
create index tareas_fase_idx on tareas(fase);

-- RLS policies
alter table companies enable row level security;
alter table socios enable row level security;
alter table tareas enable row level security;

create policy "Users own companies"
  on companies for all
  using (auth.uid() = user_id);

create policy "Users own socios"
  on socios for all
  using (
    exists (
      select 1 from companies
      where companies.id = socios.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users own tareas"
  on tareas for all
  using (
    exists (
      select 1 from companies
      where companies.id = tareas.company_id
      and companies.user_id = auth.uid()
    )
  );

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at
  before update on companies
  for each row execute function update_updated_at();
