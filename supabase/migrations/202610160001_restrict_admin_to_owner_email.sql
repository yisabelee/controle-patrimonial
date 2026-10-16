-- Camada adicional de segurança: mesmo que outra conta receba acidentalmente
-- o papel admin, ela não poderá executar operações administrativas.
-- Políticas RESTRICTIVE são combinadas com as políticas existentes por AND.
-- Não altera nem apaga dados existentes.

create policy cp_owner_only_patrimonios_insert
  on public.patrimonios as restrictive for insert to public
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_patrimonios_update
  on public.patrimonios as restrictive for update to public
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_patrimonios_delete
  on public.patrimonios as restrictive for delete to public
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_setores_insert
  on public.setores as restrictive for insert to public
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_setores_update
  on public.setores as restrictive for update to public
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_setores_delete
  on public.setores as restrictive for delete to public
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_localizacoes_insert
  on public.localizacoes as restrictive for insert to public
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_localizacoes_update
  on public.localizacoes as restrictive for update to public
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_localizacoes_delete
  on public.localizacoes as restrictive for delete to public
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_conferencias_update
  on public.conferencias as restrictive for update to public
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );

create policy cp_owner_only_conferencias_delete
  on public.conferencias as restrictive for delete to public
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopesyasmin690@gmail.com'
    and public.has_role('admin'::public.app_role, auth.uid())
  );
