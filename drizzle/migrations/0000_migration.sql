
create type public.app_role as enum ('admin', 'conferente');
create type public.status_conferencia as enum ('pendente', 'encontrado', 'nao_encontrado');

-- Perfis
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- Papéis
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.pode_conferir(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','conferente'))
$$;

create policy "perfis visiveis a autenticados" on public.profiles for select to authenticated using (true);
create policy "atualiza proprio perfil" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "ver proprio papel ou admin" on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admin concede papel" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin remove papel" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') and user_id <> auth.uid());

-- Novo usuário: cria perfil; primeiro usuário vira admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Setores e localizações
create table public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint setores_nome_len check (char_length(trim(nome)) between 1 and 150)
);
create unique index setores_nome_unq on public.setores (lower(trim(nome)));

create table public.localizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint localizacoes_nome_len check (char_length(trim(nome)) between 1 and 150)
);
create unique index localizacoes_nome_unq on public.localizacoes (lower(trim(nome)));

grant select, insert, update, delete on public.setores, public.localizacoes to authenticated;
grant all on public.setores, public.localizacoes to service_role;
alter table public.setores enable row level security;
alter table public.localizacoes enable row level security;

create policy "ler setores" on public.setores for select to authenticated using (true);
create policy "admin insere setores" on public.setores for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin altera setores" on public.setores for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin exclui setores" on public.setores for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "ler localizacoes" on public.localizacoes for select to authenticated using (true);
create policy "admin insere localizacoes" on public.localizacoes for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin altera localizacoes" on public.localizacoes for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin exclui localizacoes" on public.localizacoes for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Patrimônios
create table public.patrimonios (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  descricao text not null,
  setor_id uuid not null references public.setores(id) on delete restrict,
  localizacao_id uuid not null references public.localizacoes(id) on delete restrict,
  ultima_conferencia date,
  status public.status_conferencia not null default 'pendente',
  observacoes text,
  is_teste boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patrimonios_numero_len check (char_length(trim(numero)) between 1 and 50),
  constraint patrimonios_desc_len check (char_length(trim(descricao)) between 1 and 300),
  constraint patrimonios_obs_len check (observacoes is null or char_length(observacoes) <= 2000)
);
create unique index patrimonios_numero_unq on public.patrimonios (lower(trim(numero)));
grant select, insert, update, delete on public.patrimonios to authenticated;
grant all on public.patrimonios to service_role;
alter table public.patrimonios enable row level security;
create policy "ler patrimonios" on public.patrimonios for select to authenticated using (true);
create policy "admin insere patrimonios" on public.patrimonios for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin altera patrimonios" on public.patrimonios for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin exclui patrimonios" on public.patrimonios for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Histórico de conferências
create table public.conferencias (
  id uuid primary key default gen_random_uuid(),
  patrimonio_id uuid not null references public.patrimonios(id) on delete cascade,
  data_conferencia date not null,
  status public.status_conferencia not null,
  localizacao_id uuid references public.localizacoes(id) on delete set null,
  localizacao_nome text,
  observacoes text,
  registrado_por uuid,
  created_at timestamptz not null default now()
);
grant select on public.conferencias to authenticated;
grant all on public.conferencias to service_role;
alter table public.conferencias enable row level security;
create policy "ler conferencias" on public.conferencias for select to authenticated using (true);

-- Protege a data/status de conferência contra edição comum
create or replace function public.patrimonios_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and coalesce(current_setting('app.registrando_conferencia', true), '') <> '1' then
    new.ultima_conferencia := old.ultima_conferencia;
    new.status := old.status;
  end if;
  if new.ultima_conferencia is not null and new.ultima_conferencia > current_date then
    raise exception 'A data da conferência não pode ser futura';
  end if;
  return new;
end $$;
create trigger patrimonios_guard_trg before insert or update on public.patrimonios
  for each row execute function public.patrimonios_guard();

-- Registro de conferência física
create or replace function public.registrar_conferencia(
  _patrimonio_id uuid, _data date, _status public.status_conferencia,
  _localizacao_id uuid, _observacoes text
) returns void language plpgsql security definer set search_path = public as $$
declare _loc text;
begin
  if not public.pode_conferir(auth.uid()) then
    raise exception 'Sem permissão para registrar conferência';
  end if;
  if _status = 'pendente' then raise exception 'Informe Encontrado ou Não encontrado'; end if;
  if _data is null or _data > current_date then raise exception 'Data de conferência inválida'; end if;
  if _observacoes is not null and char_length(_observacoes) > 2000 then raise exception 'Observação muito longa'; end if;
  if not exists (select 1 from public.patrimonios where id = _patrimonio_id) then
    raise exception 'Patrimônio não encontrado';
  end if;
  select nome into _loc from public.localizacoes where id = _localizacao_id;
  if _loc is null then raise exception 'Localização inválida'; end if;

  insert into public.conferencias (patrimonio_id, data_conferencia, status, localizacao_id, localizacao_nome, observacoes, registrado_por)
  values (_patrimonio_id, _data, _status, _localizacao_id, _loc, nullif(trim(_observacoes),''), auth.uid());

  perform set_config('app.registrando_conferencia', '1', true);
  update public.patrimonios set
    status = _status,
    ultima_conferencia = greatest(coalesce(ultima_conferencia, _data), _data),
    localizacao_id = _localizacao_id,
    observacoes = nullif(trim(_observacoes),'')
  where id = _patrimonio_id;
  perform set_config('app.registrando_conferencia', '', true);
end $$;
revoke execute on function public.registrar_conferencia(uuid, date, public.status_conferencia, uuid, text) from public, anon;
grant execute on function public.registrar_conferencia(uuid, date, public.status_conferencia, uuid, text) to authenticated;

alter publication supabase_realtime add table public.patrimonios;
alter publication supabase_realtime add table public.setores;
alter publication supabase_realtime add table public.localizacoes;
alter publication supabase_realtime add table public.conferencias;
