# Configuração de acesso — Controle Patrimonial FAPDF

1. Confirme que a conta `lopesyasmin690@gmail.com` existe em **Supabase → Authentication → Users**.
2. No **SQL Editor** do mesmo projeto, execute o conteúdo de `setup-admin.sql`.
3. Em **Authentication → Providers / User Signups**, desative inscrições públicas se somente contas previamente autorizadas devem acessar o sistema. Crie as contas autorizadas pelo painel do Supabase.
4. Antes de considerar o sistema protegido, revise em **Database → Tables → Policies** as políticas RLS das tabelas `patrimonios`, `setores`, `localizacoes`, `conferencias` e `user_roles`. O frontend esconde ações administrativas, mas isso não substitui RLS no banco. As políticas existentes não estão versionadas neste repositório, então não devem ser substituídas sem inspeção.
5. Mantenha variáveis de ambiente fora do Git. A chave publicável do Supabase pode estar no cliente, mas nunca coloque uma chave `service_role` ou `sb_secret_` no frontend, no repositório ou em variáveis `VITE_*`.

O script preserva os dados e não exclui contas; apenas define a conta informada como administradora única e rebaixa outros papéis `admin` para `conferente`.
