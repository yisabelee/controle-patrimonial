-- Políticas adicionais de controle de acesso.
-- Não remove políticas preexistentes. As políticas RESTRICTIVE abaixo limitam
-- qualquer política permissiva existente, evitando que uma política ampla
-- permita a usuários comuns escreverem no inventário.
do $$
declare
  t text;
  p text;
begin
  for t in select unnest(array['patrimonios','setores','localizacoes','conferencias','user_roles','profiles'])
  loop
    for p in
      select policyname from pg_policies
       where schemaname = 'public' and tablename = t
         and policyname like 'cp_access_%'
    loop
      execute format('drop policy if exists %I on public.%I', p, t);
    end loop;
  end loop;
end
$$;

alter table public.patrimonios enable row level security;
alter table public.setores enable row level security;
alter table public.localizacoes enable row level security;
alter table public.conferencias enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;

-- Inventário: leitura para contas autorizadas; escrita somente para admin.
create policy cp_access_patrimonios_read
  on public.patrimonios as permissive for select to authenticated
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy cp_access_patrimonios_read_limit
  on public.patrimonios as restrictive for select to public
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy cp_access_patrimonios_insert
  on public.patrimonios as permissive for insert to authenticated
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_patrimonios_insert_limit
  on public.patrimonios as restrictive for insert to public
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_patrimonios_update
  on public.patrimonios as permissive for update to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_patrimonios_update_limit
  on public.patrimonios as restrictive for update to public
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_patrimonios_delete
  on public.patrimonios as permissive for delete to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_patrimonios_delete_limit
  on public.patrimonios as restrictive for delete to public
  using (public.has_role('admin'::public.app_role, auth.uid()));

-- Setores e localizações: todos os autorizados consultam; somente admin altera.
create policy cp_access_setores_read
  on public.setores as permissive for select to authenticated
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy cp_access_setores_read_limit
  on public.setores as restrictive for select to public
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy cp_access_setores_insert
  on public.setores as permissive for insert to authenticated
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_setores_insert_limit
  on public.setores as restrictive for insert to public
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_setores_update
  on public.setores as permissive for update to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_setores_update_limit
  on public.setores as restrictive for update to public
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_setores_delete
  on public.setores as permissive for delete to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_setores_delete_limit
  on public.setores as restrictive for delete to public
  using (public.has_role('admin'::public.app_role, auth.uid()));

create policy cp_access_localizacoes_read
  on public.localizacoes as permissive for select to authenticated
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy cp_access_localizacoes_read_limit
  on public.localizacoes as restrictive for select to public
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy cp_access_localizacoes_insert
  on public.localizacoes as permissive for insert to authenticated
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_localizacoes_insert_limit
  on public.localizacoes as restrictive for insert to public
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_localizacoes_update
  on public.localizacoes as permissive for update to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_localizacoes_update_limit
  on public.localizacoes as restrictive for update to public
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_localizacoes_delete
  on public.localizacoes as permissive for delete to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_localizacoes_delete_limit
  on public.localizacoes as restrictive for delete to public
  using (public.has_role('admin'::public.app_role, auth.uid()));

-- Histórico de conferência: leitura para todos autorizados; conferência para
-- admin/conferente. Alteração e exclusão direta ficam limitadas ao admin.
create policy cp_access_conferencias_read
  on public.conferencias as permissive for select to authenticated
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy cp_access_conferencias_read_limit
  on public.conferencias as restrictive for select to public
  using (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
    or public.has_role('viewer'::public.app_role, auth.uid())
  );
create policy cp_access_conferencias_insert
  on public.conferencias as permissive for insert to authenticated
  with check (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
  );
create policy cp_access_conferencias_insert_limit
  on public.conferencias as restrictive for insert to public
  with check (
    public.has_role('admin'::public.app_role, auth.uid())
    or public.has_role('conferente'::public.app_role, auth.uid())
  );
create policy cp_access_conferencias_update
  on public.conferencias as permissive for update to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_conferencias_update_limit
  on public.conferencias as restrictive for update to public
  using (public.has_role('admin'::public.app_role, auth.uid()))
  with check (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_conferencias_delete
  on public.conferencias as permissive for delete to authenticated
  using (public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_conferencias_delete_limit
  on public.conferencias as restrictive for delete to public
  using (public.has_role('admin'::public.app_role, auth.uid()));

-- Usuários só podem consultar seus próprios papéis. Papéis são administrados
-- no SQL Editor; nenhuma conta pode elevar a própria permissão pela API.
create policy cp_access_user_roles_read
  on public.user_roles as permissive for select to authenticated
  using (user_id = auth.uid() or public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_user_roles_read_limit
  on public.user_roles as restrictive for select to public
  using (user_id = auth.uid() or public.has_role('admin'::public.app_role, auth.uid()));
create policy cp_access_user_roles_insert_limit
  on public.user_roles as restrictive for insert to public
  with check (false);
create policy cp_access_user_roles_update_limit
  on public.user_roles as restrictive for update to public
  using (false) with check (false);
create policy cp_access_user_roles_delete_limit
  on public.user_roles as restrictive for delete to public
  using (false);

-- Perfis: cada usuário acessa apenas seu próprio perfil.
create policy cp_access_profiles_read
  on public.profiles as permissive for select to authenticated
  using (id = auth.uid());
create policy cp_access_profiles_read_limit
  on public.profiles as restrictive for select to public
  using (id = auth.uid());
create policy cp_access_profiles_insert
  on public.profiles as permissive for insert to authenticated
  with check (id = auth.uid());
create policy cp_access_profiles_insert_limit
  on public.profiles as restrictive for insert to public
  with check (id = auth.uid());
create policy cp_access_profiles_update
  on public.profiles as permissive for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
create policy cp_access_profiles_update_limit
  on public.profiles as restrictive for update to public
  using (id = auth.uid())
  with check (id = auth.uid());

create policy cp_access_profiles_delete_limit
  on public.profiles as restrictive for delete to public
  using (false);
