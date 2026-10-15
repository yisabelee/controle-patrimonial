import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Campo, OpcoesSelect } from "@/components/campos";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidarAcervo } from "@/lib/data";
import { conferenciaSchema, hojeISO, mensagemErro, type Opcao, type PatrimonioView } from "@/lib/patrimonio";

export function ConferenciaDialog({
  item, onClose, localizacoes,
}: { item: PatrimonioView | null; onClose: () => void; localizacoes: Opcao[] }) {
  const invalidar = useInvalidarAcervo();
  const [v, setV] = useState({ data: hojeISO(), status: "encontrado" as "encontrado" | "nao_encontrado", localizacao_id: "", observacoes: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (item) {
      setErros({});
      setV({ data: hojeISO(), status: "encontrado", localizacao_id: item.localizacao_id, observacoes: item.observacoes ?? "" });
    }
  }, [item]);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    const r = conferenciaSchema.safeParse(v);
    if (!r.success) {
      const m: Record<string, string> = {};
      r.error.issues.forEach((i) => (m[String(i.path[0])] = i.message));
      setErros(m);
      return;
    }
    setSalvando(true);
    const { error } = await supabase.rpc("registrar_conferencia", {
      _patrimonio_id: item.id, _data: r.data.data, _status: r.data.status,
      _localizacao_id: r.data.localizacao_id, _observacoes: r.data.observacoes,
    });
    setSalvando(false);
    if (error) return toast.error(mensagemErro(error));
    await invalidar();
    toast.success(`Conferência de ${item.numero} registrada`);
    onClose();
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar conferência</DialogTitle>
          <DialogDescription>
            <span className="num-tag">{item?.numero}</span> · {item?.descricao}
            <br />Carga: {item?.setor} (não é alterada pela conferência)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={registrar} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-2">
            {(["encontrado", "nao_encontrado"] as const).map((s) => (
              <Button key={s} type="button" variant={v.status === s ? (s === "encontrado" ? "default" : "destructive") : "outline"} onClick={() => setV({ ...v, status: s })}>
                {s === "encontrado" ? "Encontrado" : "Não encontrado"}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Data da conferência" htmlFor="cdata" erro={erros.data}>
              <Input id="cdata" type="date" max={hojeISO()} value={v.data} onChange={(e) => setV({ ...v, data: e.target.value })} />
            </Campo>
            <Campo label="Localização encontrada" htmlFor="cloc" erro={erros.localizacao_id}>
              <OpcoesSelect id="cloc" opcoes={localizacoes} value={v.localizacao_id} onChange={(x) => setV({ ...v, localizacao_id: x })} placeholder="Selecione…" />
            </Campo>
          </div>
          <Campo label={v.status === "nao_encontrado" ? "Observações (obrigatório)" : "Observações"} htmlFor="cobs" erro={erros.observacoes}>
            <Textarea id="cobs" rows={3} value={v.observacoes} onChange={(e) => setV({ ...v, observacoes: e.target.value })} />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? "Registrando…" : "Registrar conferência"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
