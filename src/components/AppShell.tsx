import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Boxes, Home, LayoutDashboard, LogIn, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePapeis, useRealtimeSync } from "@/lib/data";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/painel", label: "Consulta patrimonial", icon: LayoutDashboard },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useRealtimeSync();
  const { data: papeis } = usePapeis();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const autenticada = Boolean(papeis?.userId);

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await qc.invalidateQueries({ queryKey: ["papeis"] });
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/painel" className="flex shrink-0 items-center gap-2 font-display text-base font-semibold">
            <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Boxes className="size-4" />
            </span>
            <span className="hidden sm:inline">Controle Patrimonial FAPDF</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              >
                <n.icon className="size-4" />
                <span className="hidden md:inline">{n.label}</span>
              </Link>
            ))}
          </nav>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            title="Voltar à página inicial"
          >
            <Home className="size-4" />
            <span className="hidden sm:inline">Voltar ao início</span>
            <span className="sm:hidden">Início</span>
          </Link>
          <Link
            to={papeis?.admin ? "/admin" : "/auth"}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            {papeis?.admin ? <ShieldCheck className="size-4" /> : <LogIn className="size-4" />}
            <span className="hidden sm:inline">{papeis?.admin ? "Área administrativa" : "Área do administrador"}</span>
            <span className="sm:hidden">{papeis?.admin ? "Admin" : "Login"}</span>
          </Link>
          {autenticada && (
            <Button size="sm" variant="ghost" onClick={sair} className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" title="Sair da conta administrativa">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
