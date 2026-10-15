import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Boxes, FileBarChart, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePapeis, useRealtimeSync } from "@/lib/data";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/admin", label: "Administração", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useRealtimeSync();
  const { data: papeis } = usePapeis();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/painel" className="flex items-center gap-2 font-display text-base font-semibold">
            <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Boxes className="size-4" />
            </span>
            <span className="hidden sm:inline">Controle Patrimonial</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.filter((n) => n.to !== "/admin" || papeis?.admin).map((n) => (
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
          <span className="hidden max-w-48 truncate text-xs text-sidebar-foreground/70 lg:inline">
            {papeis?.email}
            {papeis?.admin ? " · admin" : papeis?.conferente ? " · conferente" : " · leitura"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={sair}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
