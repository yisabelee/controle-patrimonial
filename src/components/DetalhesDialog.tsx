import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { historicoQuery } from "@/lib/data";
import { formatarData, type PatrimonioView, type Status } from "@/lib/patrimonio";

export function DetalhesDialog({ item, onClose }: { item: PatrimonioView | null; onClose: () => void }) {
  const hist = useQuery({ ...historicoQuery(item?.id ?? ""), enabled: !!item });
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <span className="num-tag">{item.numero}</span>
                <StatusBadge status={item.status} />
                {item.is_teste && <span className="text-xs text-muted-foreground">(teste)</span>}
              </DialogTitle>
            </DialogHeader>
            <p className="text-base font-medium">{item.descricao}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Setor da carga</dt><dd>{item.setor}</dd></div>
              <div><dt className="text-muted-foreground">Localização atual</dt><dd>{item.localizacao}</dd></div>
              <div><dt className="text-muted-foreground">Quem utiliza</dt><dd>{item.responsavel_uso || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Última conferência</dt><dd>{formatarData(item.ultima_conferencia)}</dd></div>
              <div><dt className="text-muted-foreground">Atualizado em</dt><dd>{new Date(item.updated_at).toLocaleString("pt-BR")}</dd></div>
            </dl>
            <div>
              <h3 className="text-sm text-muted-foreground">Observações</h3>
              <p className="whitespace-pre-wrap text-sm">{item.observacoes || "—"}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Histórico de conferências</h3>
              {hist.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : !hist.data?.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma conferência registrada pelo sistema.</p>
              ) : (
                <ol className="space-y-2 border-l pl-4">
                  {hist.data.map((h) => (
                    <li key={h.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatarData(h.data_conferencia)}</span>
                        <StatusBadge status={h.status as Status} />
                      </div>
                      <div className="text-muted-foreground">{h.localizacao_nome ?? "—"}</div>
                      {h.observacoes && <div className="whitespace-pre-wrap">{h.observacoes}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
