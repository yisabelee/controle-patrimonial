-- Adiciona o papel de consulta sem permissões de conferência.
-- Execute antes de 202610150002_access_policies.sql.
alter type public.app_role add value if not exists 'viewer';
