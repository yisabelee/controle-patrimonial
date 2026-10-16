DROP POLICY IF EXISTS "perfis visiveis a autenticados" ON public.profiles;
CREATE POLICY "ver proprio perfil ou admin" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));