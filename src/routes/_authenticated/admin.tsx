import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Power, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePapeis } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_EMAIL = "lopesyasmin690@gmail.com";

type Catalogo = "setores" | "localizacoes";
type Registro = { id: string; nome: string; ativo: boolean };

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });

    const email = (auth.user.email ?? "").trim().toLocaleLowerCase("pt-BR");
    if (email !== ADMIN_EMAIL) throw redirect({ to: "/painel" });

    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);
    if (error || !roles?.some((r) => r.role === "admin")) throw redirect({ to: "/painel" });
  },
  component: Administracao,
});

function Administracao() {
  const { data: papeis } = usePapeis();
  const qc = useQueryClient();

  if (!papeis?.admin || papeis.email?.trim().toLocaleLowerCase("pt-BR") !== ADMIN_EMAIL) {
    return <p className="rounded-md border p-4 text-sm text-muted-foreground">Verificando suas permissões…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold">Administração</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie os setores de carga e as localizações disponíveis no Controle Patrimonial da FAPDF.
          Os registros são desativados, e não apagados, para preservar o histórico dos bens.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <CatalogoCard titulo="Setores da carga" tabela="setores" qc={qc} />
        <CatalogoCard titulo="Localizações atuais" tabela="localizacoes" qc={qc} />
      </div>
      <p className="text-xs text-muted-foreground">
        Área restrita à conta administradora autorizada. As operações também são protegidas pelas políticas do banco de dados.
      </p>
    </div>
  );
}

function CatalogoCard({ titulo, tabela, qc }: { titulo: string; tabela: Catalogo; qc: ReturnType<typeof useQueryClient> }) {
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-catalogo", tabela],
    queryFn: async (): Promise<Registro[]> => {
      const { data, error } = await supabase.from(tabela).select("id,nome,ativo").order("nome");
      if (error) throw error;
      return data;
    },
  });

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const valor = nome.trim();
    if (!valor) { toast.error("Informe um nome."); return; }
    if (data.some((item) => item.nome.toLocaleLowerCase("pt-BR") === valor.toLocaleLowerCase("pt-BR"))) {
      toast.error("Já existe um registro com esse nome.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from(tabela).insert({ nome: valor, ativo: true });
    setSalvando(false);
    if (error) { toast.error(error.code === "42501" ? "Você não tem permissão para esta operação." : error.message); return; }
    setNome("");
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin-catalogo", tabela] }),
      qc.invalidateQueries({ queryKey: [tabela] }),
    ]);
    toast.success("Registro adicionado.");
  }

  async function alternar(item: Registro) {
    const { error } = await supabase.from(tabela).update({ ativo: !item.ativo }).eq("id", item.id);
    if (error) { toast.error(error.code === "42501" ? "Você não tem permissão para esta operação." : error.message); return; }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin-catalogo", tabela] }),
      qc.invalidateQueries({ queryKey: [tabela] }),
    ]);
    toast.success(item.ativo ? "Registro desativado." : "Registro reativado.");
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="font-semibold">{titulo}</h2>
      <form onSubmit={adicionar} className="mt-3 flex gap-2">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={tabela === "setores" ? "Nome do setor" : "Nome da localização"} maxLength={150} />
        <Button type="submit" disabled={salvando}><Plus className="size-4" /> Adicionar</Button>
      </form>
      {error && <p className="mt-3 text-sm text-destructive">Não foi possível carregar os registros.</p>}
      {isLoading ? <p className="mt-3 text-sm text-muted-foreground">Carregando…</p> : (
        <ul className="mt-4 divide-y">
          {data.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <span className={item.ativo ? "" : "text-muted-foreground line-through"}>{item.nome}{!item.ativo && <span className="ml-2 text-xs no-underline">(inativo)</span>}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => alternar(item)}>
                <Power className="size-3.5" /> {item.ativo ? "Desativar" : "Reativar"}
              </Button>
            </li>
          ))}
          {!data.length && <li className="py-4 text-sm text-muted-foreground">Nenhum registro cadastrado.</li>}
        </ul>
      )}
    </section>
  );
}
