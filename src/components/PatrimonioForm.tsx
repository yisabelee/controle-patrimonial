import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Campo, NativeSelect, OpcoesSelect } from "@/components/campos";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidarAcervo } from "@/lib/data";
import { hojeISO, mensagemErro, patrimonioSchema, type Opcao, type PatrimonioView, type Status } from "@/lib/patrimonio";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editando?: PatrimonioView | null;
  setores: Opcao[];
  localizacoes: Opcao[];
}

export function PatrimonioForm({ open, onOpenChange, editando, setores, localizacoes }: Props) {
  const invalidar = useInvalidarAcervo();
  const [v, setV] = useState({
    numero: "", descricao: "", setor_id: "", localizacao_id: "", responsavel_uso: "", observacoes: "", is_teste: false,
    status: "pendente" as Status, ultima_conferencia: "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErros({});
    setV(
      editando
        ? {
            numero: editando.numero, descricao: editando.descricao, setor_id: editando.setor_id,
            localizacao_id: editando.localizacao_id, responsavel_uso: editando.responsavel_uso ?? "", observacoes: editando.observacoes ?? "",
            is_teste: editando.is_teste, status: editando.status, ultima_conferencia: editando.ultima_conferencia ?? "",
          }
        : { numero: "", descricao: "", setor_id: "", localizacao_id: "", responsavel_uso: "", observacoes: "", is_teste: false, status: "pendente", ultima_conferencia: "" }, 
    );
  }, [open, editando]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const r = patrimonioSchema.safeParse(v);
    const novosErros: Record<string, string> = {};
    if (!r.success) r.error.issues.forEach((i) => (novosErros[String(i.path[0])] = i.message));
    if (!editando) {
      if (v.status !== "pendente" && !v.ultima_conferencia) novosErros["ultima_conferencia"] = "Informe a data da conferência";
      if (v.ultima_conferencia && v.ultima_conferencia > hojeISO()) novosErros["ultima_conferencia"] = "A data não pode ser futura";
      if (v.status === "nao_encontrado" && !v.observacoes.trim()) novosErros["observacoes"] = "Explique a situação do bem não encontrado";
    }
    setErros(novosErros);
    if (!r.success || Object.keys(novosErros).length) return;

    setSalvando(true);
    const base = { ...r.data, observacoes: r.data.observacoes.trim() || null };
    const { error } = editando
      ? await supabase.from("patrimonios").update(base).eq("id", editando.id)
      : await supabase.from("patrimonios").insert({
          ...base,
          status: v.status,
          ultima_conferencia: v.status === "pendente" ? (v.ultima_conferencia || null) : v.ultima_conferencia,
        });
    setSalvando(false);
    if (error) {
      if (error.code === "23505") setErros({ numero: "Este número de patrimônio já está cadastrado" });
      toast.error(mensagemErro(error));
      return;
    }
    await invalidar();
    toast.success(editando ? "Patrimônio atualizado" : "Patrimônio cadastrado");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editando ? `Editar patrimônio ${editando.numero}` : "Novo patrimônio"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <Campo label="Número do patrimônio *" htmlFor="numero" erro={erros["numero"]}>
              <Input id="numero" value={v.numero} onChange={(e) => setV({ ...v, numero: e.target.value })} className="num-tag" />
            </Campo>
            <Campo label="Descrição do bem *" htmlFor="descricao" erro={erros["descricao"]}>
              <Input id="descricao" value={v.descricao} onChange={(e) => setV({ ...v, descricao: e.target.value })} />
            </Campo>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Setor responsável pela carga *" htmlFor="setor" erro={erros["setor_id"]}>
              <OpcoesSelect id="setor" opcoes={setores} value={v.setor_id} onChange={(x) => setV({ ...v, setor_id: x })} placeholder="Selecione…" />
            </Campo>
            <Campo label="Localização atual *" htmlFor="local" erro={erros["localizacao_id"]}>
              <OpcoesSelect id="local" opcoes={localizacoes} value={v.localizacao_id} onChange={(x) => setV({ ...v, localizacao_id: x })} placeholder="Selecione…" />
            </Campo>
          </div>
          <Campo label="Quem está utilizando o bem" htmlFor="responsavel_uso" erro={erros["responsavel_uso"]}>
            <Input id="responsavel_uso" value={v.responsavel_uso} onChange={(e) => setV({ ...v, responsavel_uso: e.target.value })} placeholder="Ex.: Yasmin" maxLength={200} />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
          {editando ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Status e data da última conferência só mudam ao registrar uma conferência — editar o cadastro não os altera.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Status da conferência" htmlFor="status">
                <NativeSelect id="status" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as Status })}>
                  <option value="pendente">Pendente (ainda não conferido)</option>
                  <option value="encontrado">Encontrado</option>
                  <option value="nao_encontrado">Não encontrado</option>
                </NativeSelect>
              </Campo>
              <Campo label="Última data de conferência" htmlFor="data" erro={erros["ultima_conferencia"]}>
                <Input id="data" type="date" max={hojeISO()} value={v.ultima_conferencia} onChange={(e) => setV({ ...v, ultima_conferencia: e.target.value })} />
              </Campo>
            </div>
          )}
          <Campo label="Observações" htmlFor="obs" erro={erros["observacoes"]}>
            <Textarea id="obs" rows={3} value={v.observacoes} onChange={(e) => setV({ ...v, observacoes: e.target.value })} />
          </Campo>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={v.is_teste} onChange={(e) => setV({ ...v, is_teste: e.target.checked })} />
            Registro de teste (fica oculto dos relatórios oficiais por padrão)
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
