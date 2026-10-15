import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw redirect({ to: "/auth" });

    // Ter uma sessão não basta: somente contas explicitamente autorizadas
    // com papel no banco podem consultar o inventário.
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);

    if (rolesError) {
      throw redirect({ to: "/auth" });
    }

    if (!roles?.some((item) => ["admin", "conferente", "viewer"].includes(item.role))) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
