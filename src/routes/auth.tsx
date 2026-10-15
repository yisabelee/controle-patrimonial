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
  const [modo, setModo] = useState<"entrar" | "recuperar">("entrar");
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
      const r = z.string().trim().email("Informe um e-mail válido").safeParse(email);
      if (!r.success) { toast.error("Informe um e-mail válido"); return; }
      setCarregando(true);
      const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
      setCarregando(false);
      if (error) { toast.error(error.message); return; }
      setAviso("Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.");
      return;
    }
    const r = schema.safeParse({ email, senha });
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Dados inválidos"); return; }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: r.data.email, password: r.data.senha });
    setCarregando(false);
    if (error) { toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message); return; }
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
        <h1 className="text-xl font-semibold">{modo === "entrar" ? "Entrar" : "Recuperar senha"}</h1>
        <form onSubmit={enviar} className="space-y-3" noValidate>
          <Campo label="E-mail" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          {modo === "entrar" && (
            <Campo label="Senha" htmlFor="senha">
              <Input id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </Campo>
          )}
          {aviso && <p className="rounded-md bg-muted p-2 text-sm">{aviso}</p>}
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Enviar link"}
          </Button>
        </form>
        {modo === "entrar" && (
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
            <Button variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
          </>
        )}
        <div className="flex justify-end text-sm">
          {modo === "entrar" ? (
            <button className="text-muted-foreground hover:underline" onClick={() => { setModo("recuperar"); setAviso(""); }}>Esqueci a senha</button>
          ) : (
            <button className="text-primary underline-offset-4 hover:underline" onClick={() => { setModo("entrar"); setAviso(""); }}>Voltar para entrar</button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          O acesso é liberado apenas para contas autorizadas pela administração do sistema.
        </p>
      </div>
    </div>
  );
}
