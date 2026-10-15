import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo } from "@/components/campos";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Controle Patrimonial" },
      { name: "description", content: "Acesse o sistema de controle patrimonial." },
      { property: "og:title", content: "Entrar — Controle Patrimonial" },
      { property: "og:description", content: "Acesso ao sistema de controle patrimonial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  senha: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastrar" | "recuperar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/painel", replace: true }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && navigate({ to: "/painel", replace: true }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    if (modo === "recuperar") {
      const r = z.string().trim().email().safeParse(email);
      if (!r.success) return toast.error("Informe um e-mail válido");
      setCarregando(true);
      const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
      setCarregando(false);
      if (error) return toast.error(error.message);
      return setAviso("Se o e-mail existir, enviaremos um link para redefinir a senha.");
    }
    const r = schema.safeParse({ email, senha });
    if (!r.success) return toast.error(r.error.issues[0].message);
    setCarregando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email: r.data.email, password: r.data.senha });
      setCarregando(false);
      if (error) return toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: r.data.email, password: r.data.senha, options: { emailRedirectTo: window.location.origin },
      });
      setCarregando(false);
      if (error) return toast.error(error.message);
      setAviso("Conta criada. Confirme pelo link enviado ao seu e-mail para entrar.");
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com Google");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><Boxes className="size-4" /></span>
          Controle Patrimonial
        </Link>
        <h1 className="text-xl font-semibold">
          {modo === "entrar" ? "Entrar" : modo === "cadastrar" ? "Criar conta" : "Recuperar senha"}
        </h1>
        <form onSubmit={enviar} className="space-y-3" noValidate>
          <Campo label="E-mail" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          {modo !== "recuperar" && (
            <Campo label="Senha" htmlFor="senha">
              <Input id="senha" type="password" autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} />
            </Campo>
          )}
          {aviso && <p className="rounded-md bg-muted p-2 text-sm">{aviso}</p>}
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : modo === "cadastrar" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>
        {modo !== "recuperar" && (
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
            <Button variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
          </>
        )}
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button className="text-primary underline-offset-4 hover:underline" onClick={() => { setModo(modo === "entrar" ? "cadastrar" : "entrar"); setAviso(""); }}>
            {modo === "entrar" ? "Criar uma conta" : "Já tenho conta"}
          </button>
          {modo === "entrar" && (
            <button className="text-muted-foreground hover:underline" onClick={() => { setModo("recuperar"); setAviso(""); }}>Esqueci a senha</button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Novas contas têm acesso somente de leitura até um administrador conceder permissões.
        </p>
      </div>
    </div>
  );
}
