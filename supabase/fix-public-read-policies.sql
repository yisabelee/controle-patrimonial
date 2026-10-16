-- Correção da consulta pública do Controle Patrimonial.
-- Execute uma vez no SQL Editor do Supabase/Lovable Cloud do projeto correto.
-- Permite somente leitura para visitantes; não concede INSERT, UPDATE ou DELETE.
-- Não altera nem apaga nenhum registro.

grant select on table public.patrimonios, public.setores, public.localizacoes to anon, authenticated;

drop policy if exists "public_read_patrimonios" on public.patrimonios;
create policy "public_read_patrimonios"
  on public.patrimonios
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_setores" on public.setores;
create policy "public_read_setores"
  on public.setores
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_localizacoes" on public.localizacoes;
create policy "public_read_localizacoes"
  on public.localizacoes
  for select
  to anon, authenticated
  using (true);
