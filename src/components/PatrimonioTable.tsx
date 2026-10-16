import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ClipboardCheck, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidarAcervo } from "@/lib/data";
import { formatarData, mensagemErro, ordenar, type PatrimonioView, type SortKey } from "@/lib/patrimonio";

const COLS: { key: SortKey; label: string; className?: string }[] = [
  { key: "numero", label: "Número" },
  { key: "descricao", label: "Descrição do bem" },
  { key: "setor", label: "Setor da carga" },
  { key: "localizacao", label: "Localização atual" },
  { key: "responsavel_uso", label: "Quem utiliza" },
  { key: "ultima_conferencia", label: "Últ. conferência" },
  { key: "status", label: "Status" },
  { key: "observacoes", label: "Observações" },
];

const PAGINA = 50;

export function PatrimonioTable({
  rows, selecionados, setSelecionados, podeEditar, podeConferir, onVer, onEditar, onConferir,
}: {
  rows: PatrimonioView[];
  selecionados: Set<string>;
  setSelecionados: (s: Set<string>) => void;
  podeEditar: boolean;
  podeConferir: boolean;
  onVer: (r: PatrimonioView) => void;
  onEditar: (r: PatrimonioView) => void;
  onConferir: (r: PatrimonioView) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "numero", dir: "asc" });
  const [limite, setLimite] = useState(PAGINA);
  const [excluir, setExcluir] = useState<PatrimonioView | null>(null);
  const invalidar = useInvalidarAcervo();
  const ordenados = useMemo(() => ordenar(rows, sort.key, sort.dir), [rows, sort]);
  const visiveis = ordenados.slice(0, limite);
  const todosSel = rows.length > 0 && rows.every((r) => selecionados.has(r.id));

  function alternarSort(key: SortKey) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    const { error } = await supabase.from("patrimonios").delete().eq("id", excluir.id);
    if (error) { toast.error(mensagemErro(error)); return; }
    await invalidar();
    const s = new Set(selecionados);
    s.delete(excluir.id);
    setSelecionados(s);
    toast.success(`Patrimônio ${excluir.numero} excluído`);
    setExcluir(null);
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-8 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Selecionar todos"
                  checked={todosSel}
                  onChange={(e) => setSelecionados(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                />
              </th>
              {COLS.map((c) => (
                <th key={c.key} className="px-3 py-2 font-medium">
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => alternarSort(c.key)}>
                    {c.label}
                    {sort.key === c.key ? (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">Nenhum patrimônio encontrado.</td></tr>
            )}
            {visiveis.map((r) => (
              <tr key={r.id} className="border-b align-top last:border-0 hover:bg-muted/40">
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${r.numero}`}
                    checked={selecionados.has(r.id)}
                    onChange={(e) => {
                      const s = new Set(selecionados);
                      if (e.target.checked) s.add(r.id); else s.delete(r.id);
                      setSelecionados(s);
                    }}
                  />
                </td>
                <td className="num-tag whitespace-nowrap px-3 py-2.5 font-medium">
                  {r.numero}
                  {r.is_teste && <span className="ml-1 rounded bg-muted px-1 text-[10px] text-muted-foreground">teste</span>}
                </td>
                <td className="px-3 py-2.5">{r.descricao}</td>
                <td className="px-3 py-2.5">{r.setor}</td>
                <td className="px-3 py-2.5">{r.localizacao}</td>
                <td className="px-3 py-2.5">{r.responsavel_uso || "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{formatarData(r.ultima_conferencia)}</td>
                <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                <td className="max-w-64 px-3 py-2.5 text-muted-foreground">
                  <span className="line-clamp-2" title={r.observacoes ?? ""}>{r.observacoes || "—"}</span>
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right">
                  <Button size="icon" variant="ghost" aria-label="Ver detalhes" onClick={() => onVer(r)}><Eye className="size-4" /></Button>
                  {podeConferir && <Button size="icon" variant="ghost" aria-label="Registrar conferência" onClick={() => onConferir(r)}><ClipboardCheck className="size-4" /></Button>}
                  {podeEditar && <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => onEditar(r)}><Pencil className="size-4" /></Button>}
                  {podeEditar && <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => setExcluir(r)}><Trash2 className="size-4 text-destructive" /></Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ordenados.length > limite && (
        <div className="border-t p-2 text-center">
          <Button variant="ghost" size="sm" onClick={() => setLimite((l) => l + PAGINA * 2)}>
            Mostrar mais ({ordenados.length - limite} restantes)
          </Button>
        </div>
      )}
      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir patrimônio {excluir?.numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{excluir?.descricao}” e todo o seu histórico de conferências serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmarExclusao(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
