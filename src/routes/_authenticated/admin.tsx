import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Power, ShieldCheck, PackagePlus, FileSpreadsheet, Pencil, Check, X, Trash2, History, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePapeis, setoresQuery, localizacoesQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatrimonioForm } from "@/components/PatrimonioForm";
import { ImportarPatrimonios } from "@/components/ImportarPatrimonios";

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
  const [novoAberto, setNovoAberto] = useState(false);
  const [importacaoAberta, setImportacaoAberta] = useState(false);
  const [dataAlteracao, setDataAlteracao] = useState("");
  const { data: ultimasAlteracoes = [], isLoading: carregandoAlteracoes, error: erroAlteracoes } = useQuery({
    queryKey: ["admin-ultimas-alteracoes", dataAlteracao],
    queryFn: async () => {
      let consulta = supabase.from("patrimonios").select("id,numero,descricao,created_at,updated_at").order("updated_at", { ascending: false });
      if (dataAlteracao) {
        const inicio = new Date(`${dataAlteracao}T00:00:00`).toISOString();
        const fim = new Date(`${dataAlteracao}T23:59:59.999`).toISOString();
        consulta = consulta.gte("updated_at", inicio).lte("updated_at", fim);
      } else {
        consulta = consulta.limit(10);
      }
      const { data, error } = await consulta;
      if (error) throw error;
      return data;
    },
  });
  const { data: setores = [] } = useQuery(setoresQuery);
  const { data: localizacoes = [] } = useQuery(localizacoesQuery);
  const setoresAtivos = setores.filter((item) => item.ativo);
  const localizacoesAtivas = localizacoes.filter((item) => item.ativo);

  if (!papeis?.admin || papeis.email?.trim().toLocaleLowerCase("pt-BR") !== ADMIN_EMAIL) {
    return <p className="rounded-md border p-4 text-sm text-muted-foreground">Verificando suas permissões…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold">Área administrativa</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre patrimônios e gerencie os setores responsáveis pela carga e as localizações disponíveis no Controle Patrimonial da FAPDF.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <PackagePlus className="size-6" />
          </div>
          <div>
            <h2 className="font-semibold">Cadastro de patrimônios</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre um bem manualmente ou importe vários patrimônios de uma planilha Excel ou CSV.
            </p>
            {(!setoresAtivos.length || !localizacoesAtivas.length) && (
              <p className="mt-2 text-sm text-amber-700">
                Para cadastrar, primeiro adicione ao menos um setor e uma localização nas opções abaixo.
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportacaoAberta(true)} disabled={!setoresAtivos.length || !localizacoesAtivas.length}>
            <FileSpreadsheet className="size-4" /> Importar planilha
          </Button>
          <Button onClick={() => setNovoAberto(true)} disabled={!setoresAtivos.length || !localizacoesAtivas.length}>
            <Plus className="size-4" /> Novo patrimônio
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-3 text-primary"><History className="size-5" /></div>
          <div className="min-w-0 flex-1"><h2 className="font-semibold">Últimas alterações</h2><p className="mt-1 text-sm text-muted-foreground">Acompanhe as alterações recentes ou selecione uma data para consultar os registros modificados naquele dia.</p></div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"><div className="grid gap-1.5"><label htmlFor="data-alteracoes" className="text-sm font-medium">Consultar por data</label><Input id="data-alteracoes" type="date" value={dataAlteracao} onChange={(e) => setDataAlteracao(e.target.value)} className="w-full sm:w-56" /></div>{dataAlteracao && <Button type="button" variant="outline" onClick={() => setDataAlteracao("")}>Limpar data</Button>}</div>
        {dataAlteracao && <p className="mt-2 text-sm text-muted-foreground">Exibindo alterações do dia {dataAlteracao.split("-").reverse().join("/")}.</p>}
        {carregandoAlteracoes ? <p className="mt-4 text-sm text-muted-foreground">Carregando alterações…</p> : erroAlteracoes ? <p className="mt-4 text-sm text-destructive">Não foi possível carregar as últimas alterações.</p> : ultimasAlteracoes.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Ainda não há patrimônios cadastrados.</p> : (
          <ul className="mt-4 divide-y">{ultimasAlteracoes.map((item) => {
            const criado = item.created_at && item.updated_at && Math.abs(new Date(item.created_at).getTime() - new Date(item.updated_at).getTime()) < 5000;
            const data = item.updated_at || item.created_at;
            return <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"><div className="min-w-0"><p className="break-words text-sm font-medium">{item.numero} — {item.descricao}</p><p className="text-xs text-muted-foreground">{criado ? "Cadastro realizado" : "Patrimônio atualizado"}</p></div><p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" />{data ? new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Data indisponível"}</p></li>;
          })}</ul>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <CatalogoCard titulo="Setores da carga" tabela="setores" qc={qc} />
        <CatalogoCard titulo="Localizações atuais" tabela="localizacoes" qc={qc} />
      </div>

      <p className="text-xs text-muted-foreground">
        Área restrita à conta administradora autorizada. As operações também são protegidas pelas políticas do banco de dados.
      </p>

      <PatrimonioForm
        open={novoAberto}
        onOpenChange={setNovoAberto}
        setores={setoresAtivos}
        localizacoes={localizacoesAtivas}
      />

      <ImportarPatrimonios
        open={importacaoAberta}
        onOpenChange={setImportacaoAberta}
        setores={setoresAtivos}
        localizacoes={localizacoesAtivas}
      />
    </div>
  );
}

function CatalogoCard({ titulo, tabela, qc }: { titulo: string; tabela: Catalogo; qc: ReturnType<typeof useQueryClient> }) {
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
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

  function iniciarEdicao(item: Registro) {
    setEditandoId(item.id);
    setNomeEditado(item.nome);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setNomeEditado("");
  }

  async function salvarEdicao(item: Registro) {
    const valor = nomeEditado.trim();
    if (!valor) {
      toast.error("Informe um nome para a localização.");
      return;
    }
    const normalizar = (texto: string) => texto.trim().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\\s+/g, " ");
    if (data.some((registro) => registro.id !== item.id && normalizar(registro.nome) === normalizar(valor))) {
      toast.error("Já existe uma localização com esse nome.");
      return;
    }
    if (valor === item.nome) {
      cancelarEdicao();
      return;
    }

    setSalvandoEdicao(true);
    const { error } = await supabase.from(tabela).update({ nome: valor }).eq("id", item.id);
    setSalvandoEdicao(false);
    if (error) {
      toast.error(error.code === "42501" ? "Você não tem permissão para editar esta localização." : `Não foi possível salvar a alteração: ${error.message}`);
      return;
    }

    cancelarEdicao();
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin-catalogo", tabela] }),
      qc.invalidateQueries({ queryKey: [tabela] }),
      qc.invalidateQueries({ queryKey: ["patrimonios"] }),
    ]);
    toast.success("Nome da localização atualizado.");
  }

  async function excluir(item: Registro) {
    const tipo = tabela === "setores" ? "setor da carga" : "localização";
    const confirmado = window.confirm(`Deseja excluir definitivamente ${tipo} "${item.nome}"? Se estiver vinculado a patrimônios, o sistema poderá impedir a exclusão.`);
    if (!confirmado) return;

    const { error } = await supabase.from(tabela).delete().eq("id", item.id);
    if (error) {
      toast.error(
        error.code === "42501"
          ? "Você não tem permissão para excluir este registro."
          : "Não foi possível excluir. Verifique se este registro está vinculado a algum patrimônio."
      );
      return;
    }

    if (editandoId === item.id) cancelarEdicao();
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin-catalogo", tabela] }),
      qc.invalidateQueries({ queryKey: [tabela] }),
      qc.invalidateQueries({ queryKey: ["patrimonios"] }),
    ]);
    toast.success(`${tipo === "setor da carga" ? "Setor" : "Localização"} excluído(a).`);
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
              {tabela === "localizacoes" && editandoId === item.id ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onSubmit={(e) => { e.preventDefault(); void salvarEdicao(item); }}
                >
                  <Input
                    autoFocus
                    value={nomeEditado}
                    onChange={(e) => setNomeEditado(e.target.value)}
                    aria-label="Corrigir nome da localização"
                    maxLength={150}
                    disabled={salvandoEdicao}
                  />
                  <Button type="submit" size="sm" disabled={salvandoEdicao} aria-label="Salvar nome da localização">
                    <Check className="size-4" /> Salvar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={salvandoEdicao} onClick={cancelarEdicao} aria-label="Cancelar edição">
                    <X className="size-4" />
                  </Button>
                </form>
              ) : (
                <span className={`min-w-0 flex-1 break-words ${item.ativo ? "" : "text-muted-foreground line-through"}`}>
                  {item.nome}{!item.ativo && <span className="ml-2 text-xs no-underline">(inativo)</span>}
                </span>
              )}
              <div className="flex shrink-0 items-center gap-2">
                {tabela === "localizacoes" && editandoId !== item.id && (
                  <Button type="button" variant="outline" size="sm" onClick={() => iniciarEdicao(item)} aria-label={`Editar localização ${item.nome}`}>
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => alternar(item)} disabled={editandoId === item.id || salvandoEdicao}>
                  <Power className="size-3.5" /> {item.ativo ? "Desativar" : "Reativar"}
                </Button>
                <Button type="button" variant="destructive" size="icon" onClick={() => void excluir(item)} disabled={editandoId === item.id || salvandoEdicao} aria-label={`Excluir ${tabela === "setores" ? "setor" : "localização"} ${item.nome}`} title="Excluir definitivamente">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
          {!data.length && <li className="py-4 text-sm text-muted-foreground">Nenhum registro cadastrado.</li>}
        </ul>
      )}
    </section>
  );
}
