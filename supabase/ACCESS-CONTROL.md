# Configuração de acesso — Controle Patrimonial FAPDF

## Antes de liberar o sistema

1. Confirme em **Supabase → Authentication → Users** que a conta `lopesyasmin690@gmail.com` existe e está confirmada.
2. Aplique as migrações nesta ordem:
   - `supabase/migrations/202610150001_add_viewer_role.sql`
   - `supabase/migrations/202610150002_access_policies.sql`
   - `supabase/migrations/202610160001_restrict_admin_to_owner_email.sql`
3. Confira as políticas RLS no painel do Supabase. A terceira migração adiciona uma restrição extra para que operações administrativas de escrita só sejam aceitas quando a conta autenticada for `lopesyasmin690@gmail.com` e tiver o papel `admin`.
4. No **SQL Editor** do projeto, execute `supabase/setup-admin.sql` para definir a conta informada como única administradora. Esse script rebaixa outros papéis `admin` para `viewer` e preserva usuários e patrimônios.
5. Em **Authentication → Providers / User Signups**, desative a criação pública de contas. Contas novas não devem receber acesso automaticamente.
6. Para cada usuário autorizado, crie/confirme a conta em **Authentication → Users** e atribua em `public.user_roles` o papel apropriado:
   - `viewer`: consulta e relatórios, sem conferência nem edição;
   - `conferente`: consulta e registro de conferência física;
   - `admin`: administração do sistema. Deve ficar somente na conta informada.
7. Faça testes com três perfis: viewer (não altera nada), conferente (registra conferências, sem editar patrimônio) e admin (administra patrimônios, setores e localizações).

## Variáveis de ambiente

Mantenha o arquivo `.env` fora do Git. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e as variáveis `VITE_*` correspondentes no ambiente de desenvolvimento/publicação. A chave publicável pode ser usada no cliente, mas nunca exponha `service_role` ou `sb_secret_*` no frontend, no repositório ou em variáveis `VITE_*`.

## Observações

- O código da interface não substitui as políticas RLS do banco.
- As alterações no repositório não executam automaticamente as migrações no projeto Supabase. Aplique as três migrações e execute `setup-admin.sql` no projeto Supabase conectado ao app antes de considerar a segurança concluída.
- Não publique até validar as migrações, as permissões e o build no ambiente real do projeto Supabase.
- A tela de login não oferece cadastro público; OAuth pode autenticar uma conta nova se o provedor permitir, mas o sistema só libera acesso a contas com papel atribuído em `user_roles`.
