-- Consulta patrimonial pública: visitantes anônimos podem apenas ler os dados
-- necessários para consultar bens, setores, localizações e histórico de conferência.
-- Nenhuma permissão de INSERT, UPDATE ou DELETE é concedida ao papel anon.

grant select on table public.patrimonios to anon;
grant select on table public.setores to anon;
grant select on table public.localizacoes to anon;
grant select on table public.conferencias to anon;

-- As políticas RESTRICTIVE anteriores exigiam papel autenticado para leitura.
-- Atualiza somente a condição de leitura para permitir também visitantes anônimos.
drop policy if exists cp_access_patrimonios_read_limit on public.patrimonios;
create policy cp_access_patrimonios_read_limit
  on public.patrimonios as restrictive for select to public
  using (
    auth.role() = 'anon'
    or public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );

drop policy if exists cp_access_setores_read_limit on public.setores;
create policy cp_access_setores_read_limit
  on public.setores as restrictive for select to public
  using (
    auth.role() = 'anon'
    or public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );

drop policy if exists cp_access_localizacoes_read_limit on public.localizacoes;
create policy cp_access_localizacoes_read_limit
  on public.localizacoes as restrictive for select to public
  using (
    auth.role() = 'anon'
    or public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );

drop policy if exists cp_access_conferencias_read_limit on public.conferencias;
create policy cp_access_conferencias_read_limit
  on public.conferencias as restrictive for select to public
  using (
    auth.role() = 'anon'
    or public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );

-- Permissive policies explicitly grant SELECT to anon. The restrictive policies
-- above still apply alongside all other restrictive policies on these tables.
create policy cp_public_patrimonios_read
  on public.patrimonios as permissive for select to anon using (true);
create policy cp_public_setores_read
  on public.setores as permissive for select to anon using (true);
create policy cp_public_localizacoes_read
  on public.localizacoes as permissive for select to anon using (true);
create policy cp_public_conferencias_read
  on public.conferencias as permissive for select to anon using (true);
