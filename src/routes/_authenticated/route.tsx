import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  // Esta rota agrupa telas de consulta pública. A rota /admin faz sua própria
  // verificação de autenticação e autorização antes de mostrar ferramentas administrativas.
  ssr: false,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
