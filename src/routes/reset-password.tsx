import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo } from "@/components/campos";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Controle Patrimonial" },
      { name: "description", content: "Defina uma nova senha de acesso." },
      { property: "og:title", content: "Redefinir senha — Controle Patrimonial" },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return toast.error("A senha deve ter ao menos 8 caracteres");
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada");
    navigate({ to: "/painel" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={salvar} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6">
        <h1 className="text-xl font-semibold">Nova senha</h1>
        <Campo label="Senha" htmlFor="ns"><Input id="ns" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></Campo>
        <Button className="w-full" disabled={salvando}>{salvando ? "Salvando…" : "Salvar senha"}</Button>
      </form>
    </div>
  );
}
