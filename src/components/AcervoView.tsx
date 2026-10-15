import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FiltrosBar } from "@/components/FiltrosBar";
import { PatrimonioTable } from "@/components/PatrimonioTable";
import { PatrimonioForm } from "@/components/PatrimonioForm";
import { ConferenciaDialog } from "@/components/ConferenciaDialog";
import { DetalhesDialog } from "@/components/DetalhesDialog";
import { useAcervo, usePapeis } from "@/lib/data";
import { exportarExcel, exportarPdf } from "@/lib/export";
import { aplicarFiltros, descreverFiltros, FILTROS_VAZIOS, type Filtros, type PatrimonioView } from "@/lib/patrimonio";

export function useFiltrosAcervo() {
  const acervo = useAcervo();
  const [f, setF] = useState<Filtros>(FILTROS_VAZIOS);
  const filtrados = useMemo(() => aplicarFiltros(acervo.rows, f), [acervo.rows, f]);
  return { ...acervo, f, setF, filtrados };
}

export function AcervoView({ estado }: { estado: ReturnType<typeof useFiltrosAcervo> }) {
  const { setores, localizacoes, f, setF, filtrados, isLoading, error } = estado;
  const { data: papeis } = usePapeis();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<{ open: boolean; item: PatrimonioView | null }>({ open: false, item: null });
  const [ver, setVer] = useState<PatrimonioView | null>(null);
  const [conferir, setConferir] = useState<PatrimonioView | null>(null);
  const [exportando, setExportando] = useState(false);

  const selecionadosVisiveis = filtrados.filter((r) => sel.has(r.id));
  const alvo = selecionadosVisiveis.length ? selecionadosVisiveis : filtrados;
  const descr = [
    ...descreverFiltros(f, setores, localizacoes),
    ...(selecionadosVisiveis.length ? [`Somente ${selecionadosVisiveis.length} registro(s) selecionado(s)`] : []),
  ];

  async function exportar(tipo: "xlsx" | "pdf") {
    if (!alvo.length) { toast.error("Não há registros para exportar."); return; }
    setExportando(true);
    try {
      await (tipo === "xlsx" ? exportarExcel(alvo, descr) : exportarPdf(alvo, descr));
      toast.success(`Arquivo ${tipo === "xlsx" ? "Excel" : "PDF"} gerado com ${alvo.length} registro(s)`);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar o arquivo.");
    } finally {
      setExportando(false);
    }
  }

  if (error) return <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Não foi possível carregar os dados: {(error as Error).message}</p>;

  return (
    <div className="space-y-3">
      <FiltrosBar f={f} set={setF} setores={setores} localizacoes={localizacoes} />
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-muted-foreground">
          {isLoading ? "Carregando…" : `${filtrados.length} registro(s)`}
          {selecionadosVisiveis.length > 0 && ` · ${selecionadosVisiveis.length} selecionado(s)`}
        </p>
        <Button variant="outline" size="sm" disabled={exportando} onClick={() => exportar("xlsx")}>
          <FileSpreadsheet className="size-4" /> Excel{selecionadosVisiveis.length ? " (seleção)" : ""}
        </Button>
        <Button variant="outline" size="sm" disabled={exportando} onClick={() => exportar("pdf")}>
          <FileText className="size-4" /> PDF{selecionadosVisiveis.length ? " (seleção)" : ""}
        </Button>
        {papeis?.admin && (
          <Button size="sm" onClick={() => setForm({ open: true, item: null })} disabled={!setores.length || !localizacoes.length} title={!setores.length || !localizacoes.length ? "Cadastre setores e localizações na Administração" : undefined}>
            <Plus className="size-4" /> Novo patrimônio
          </Button>
        )}
      </div>
      {papeis?.admin && (!setores.length || !localizacoes.length) && !isLoading && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Antes de cadastrar patrimônios, adicione ao menos um setor e uma localização em Administração.
        </p>
      )}
      <PatrimonioTable
        rows={filtrados}
        selecionados={sel}
        setSelecionados={setSel}
        podeEditar={!!papeis?.admin}
        podeConferir={!!papeis?.conferente}
        onVer={setVer}
        onEditar={(item) => setForm({ open: true, item })}
        onConferir={setConferir}
      />
      <PatrimonioForm open={form.open} onOpenChange={(o) => setForm((s) => ({ ...s, open: o }))} editando={form.item} setores={setores} localizacoes={localizacoes} />
      <ConferenciaDialog item={conferir} onClose={() => setConferir(null)} localizacoes={localizacoes} />
      <DetalhesDialog item={ver ? (filtrados.find((r) => r.id === ver.id) ?? ver) : null} onClose={() => setVer(null)} />
    </div>
  );
}
