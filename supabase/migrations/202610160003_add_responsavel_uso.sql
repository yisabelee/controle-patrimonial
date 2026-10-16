alter table public.patrimonios add column if not exists responsavel_uso text;
comment on column public.patrimonios.responsavel_uso is 'Pessoa que utiliza atualmente o bem patrimonial.';
