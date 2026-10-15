import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Boxes, ClipboardCheck, FileBarChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Controle Patrimonial — cadastro, conferência e relatórios" },
      { name: "description", content: "Sistema para cadastrar, localizar, conferir e emitir relatórios dos bens patrimoniais." },
      { property: "og:title", content: "Controle Patrimonial" },
      { property: "og:description", content: "Cadastro, conferência física e relatórios em PDF e Excel dos bens patrimoniais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-sidebar text-sidebar-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-2 px-6 py-6 font-display font-semibold">
        <span className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Boxes className="size-5" /></span>
        Controle Patrimonial
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-16">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Cada bem no seu lugar — e cada conferência registrada.
        </h1>
        <p className="mt-4 max-w-xl text-sidebar-foreground/75">
          Cadastre patrimônios, separe carga e localização física, registre conferências e emita relatórios oficiais.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
            <Link to="/auth">Entrar no sistema</Link>
          </Button>
        </div>
        <ul className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { i: ClipboardCheck, t: "Conferência física", d: "Status, local e data com histórico preservado." },
            { i: FileBarChart, t: "Relatórios", d: "PDF A4 e Excel respeitando os filtros." },
            { i: ShieldCheck, t: "Acesso protegido", d: "Somente usuários autorizados alteram dados." },
          ].map((x) => (
            <li key={x.t} className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-4">
              <x.i className="size-5 text-sidebar-primary" />
              <div className="mt-2 font-medium">{x.t}</div>
              <div className="text-sm text-sidebar-foreground/70">{x.d}</div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
