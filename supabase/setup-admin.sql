-- Execute este script no SQL Editor do projeto Supabase depois de criar/confirmar
-- a conta lopesyasmin690@gmail.com em Authentication > Users.
-- O script torna essa conta a única com papel admin e rebaixa os demais admins
-- existentes para consulta, sem conceder permissão de conferência. Não apaga usuários nem dados patrimoniais.
do $$
declare
  v_admin_id uuid;
begin
  select id
    into v_admin_id
    from auth.users
   where lower(email) = lower('lopesyasmin690@gmail.com')
   limit 1;

  if v_admin_id is null then
    raise exception 'A conta lopesyasmin690@gmail.com ainda não existe em Authentication > Users.';
  end if;

  update public.user_roles
     set role = 'viewer'::public.app_role
   where role = 'admin'::public.app_role
     and user_id <> v_admin_id;

  if not exists (
    select 1
      from public.user_roles
     where user_id = v_admin_id
       and role = 'admin'::public.app_role
  ) then
    insert into public.user_roles (user_id, role)
    values (v_admin_id, 'admin'::public.app_role);
  end if;
end
$$;
