import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Boxes, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo } from "@/components/campos";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "lopesyasmin690@gmail.com";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Área do administrador — Controle Patrimonial FAPDF" },
      { name: "description", content: "Acesso restrito à administração do Controle Patrimonial FAPDF." },
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
    let ativo = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo || !data.session) return;
      const usuarioEmail = (data.session.user.email ?? "").trim().toLowerCase();
      if (usuarioEmail === ADMIN_EMAIL) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
        if (ativo && roles?.some((r) => r.role === "admin")) navigate({ to: "/admin", replace: true });
        return;
      }
      await supabase.auth.signOut();
    });
    return () => { ativo = false; };
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    if (modo === "recuperar") {
      const r = z.string().trim().email("Informe um e-mail válido").safeParse(email);
      if (!r.success) { toast.error("Informe um e-mail válido"); return; }
      if (r.data.toLowerCase() !== ADMIN_EMAIL) {
        toast.error("A recuperação de senha é exclusiva da conta administradora.");
        return;
      }
      setCarregando(true);
      const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
      setCarregando(false);
      if (error) { toast.error("Não foi possível solicitar a recuperação de senha."); return; }
      setAviso("Se a conta administradora estiver cadastrada, enviaremos um link para redefinir a senha.");
      return;
    }

    const r = schema.safeParse({ email, senha });
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Dados inválidos"); return; }
    if (r.data.email.toLowerCase() !== ADMIN_EMAIL) {
      toast.error("Esta tela é exclusiva da conta administradora.");
      return;
    }

    setCarregando(true);
    const { data: login, error } = await supabase.auth.signInWithPassword({ email: r.data.email, password: r.data.senha });
    if (error || !login.user) {
      setCarregando(false);
      toast.error(error?.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : "Não foi possível entrar.");
      return;
    }

    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", login.user.id);
    if (roleError || !roles?.some((item) => item.role === "admin") || (login.user.email ?? "").toLowerCase() !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setCarregando(false);
      toast.error("Esta conta não tem autorização de administradora.");
      return;
    }

    setCarregando(false);
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <Link to="/painel" className="flex items-center gap-2 font-display font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><Boxes className="size-4" /></span>
          Controle Patrimonial FAPDF
        </Link>
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="size-5" />
          <h1 className="text-xl font-semibold">{modo === "entrar" ? "Área do administrador" : "Recuperar senha"}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          A consulta dos patrimônios é pública. Entre somente para administrar os cadastros do sistema.
        </p>
        <form onSubmit={enviar} className="space-y-3" noValidate>
          <Campo label="E-mail da administradora" htmlFor="email">
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Campo>
          {modo === "entrar" && (
            <Campo label="Senha" htmlFor="senha">
              <Input id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </Campo>
          )}
          {aviso && <p className="rounded-md bg-muted p-2 text-sm">{aviso}</p>}
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar na administração" : "Enviar link de recuperação"}
          </Button>
        </form>
        <div className="flex justify-between gap-3 text-sm">
          <Link to="/painel" className="text-muted-foreground hover:underline">Voltar à consulta pública</Link>
          {modo === "entrar" ? (
            <button type="button" className="text-muted-foreground hover:underline" onClick={() => { setModo("recuperar"); setAviso(""); }}>Esqueci a senha</button>
          ) : (
            <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => { setModo("entrar"); setAviso(""); }}>Voltar para entrar</button>
          )}
        </div>
      </div>
    </div>
  );
}
