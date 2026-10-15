-- Controle de acesso do inventário.
-- IMPORTANTE: este script substitui as políticas RLS atuais das tabelas listadas.
-- Faça backup/revisão do ambiente antes de executar em produção.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in ('patrimonios', 'setores', 'localizacoes', 'conferencias', 'user_roles', 'profiles')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end
$$;

alter table public.patrimonios enable row level security;
alter table public.setores enable row level security;
alter table public.localizacoes enable row level security;
alter table public.conferencias enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;

-- Papéis são atribuídos por procedimento administrativo/SQL, não pela interface.
create policy user_roles_select_self_or_admin
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role('admin'::public.app_role, auth.uid()));

-- Dados do inventário: leitura para contas autorizadas.
create policy patrimonios_read_authorized
  on public.patrimonios for select to authenticated
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy patrimonios_insert_admin
  on public.patrimonios for insert to authenticated
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy patrimonios_update_admin
  on public.patrimonios for update to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy patrimonios_delete_admin
  on public.patrimonios for delete to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()));

-- Setores e localizações: leitura por usuários autorizados, escrita apenas pela administração.
create policy setores_read_authorized
  on public.setores for select to authenticated
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy setores_insert_admin
  on public.setores for insert to authenticated
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy setores_update_admin
  on public.setores for update to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy setores_delete_admin
  on public.setores for delete to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()));

create policy localizacoes_read_authorized
  on public.localizacoes for select to authenticated
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy localizacoes_insert_admin
  on public.localizacoes for insert to authenticated
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy localizacoes_update_admin
  on public.localizacoes for update to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy localizacoes_delete_admin
  on public.localizacoes for delete to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()));

-- Histórico visível aos autorizados; gravação direta limitada aos conferentes/admin.
-- A RPC registrar_conferencia deve manter sua própria validação de papel.
create policy conferencias_read_authorized
  on public.conferencias for select to authenticated
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy conferencias_insert_conferente
  on public.conferencias for insert to authenticated
  with check (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
  );

-- Perfis: cada usuário lê e atualiza apenas seu próprio perfil.
create policy profiles_read_self
  on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_insert_self
  on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update_self
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
