import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeitorFotoPatrimonio } from "@/components/LeitorFotoPatrimonio";
import { NativeSelect, OpcoesSelect } from "@/components/campos";
import { FILTROS_VAZIOS, type Filtros, type Opcao, type Status } from "@/lib/patrimonio";

export function FiltrosBar({
  f,
  set,
  setores,
  localizacoes,
}: {
  f: Filtros;
  set: (f: Filtros) => void;
  setores: Opcao[];
  localizacoes: Opcao[];
}) {
  const ativo = JSON.stringify(f) !== JSON.stringify(FILTROS_VAZIOS);
  return (
    <div className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto_auto_auto]">
      <div className="flex min-w-0 gap-2 sm:col-span-2 lg:col-span-1">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Pesquisar"
            placeholder="Pesquisar número, bem, setor, local, status ou observação"
            value={f.busca}
            onChange={(e) => set({ ...f, busca: e.target.value })}
            className="pl-8"
          />
        </div>
        <LeitorFotoPatrimonio compacto onNumeroReconhecido={(numero) => set({ ...f, busca: numero })} />
      </div>
      <OpcoesSelect todos opcoes={setores} value={f.setorId} onChange={(v) => set({ ...f, setorId: v })} placeholder="Todos os setores" />
      <OpcoesSelect todos opcoes={localizacoes} value={f.localizacaoId} onChange={(v) => set({ ...f, localizacaoId: v })} placeholder="Todas as localizações" />
      <NativeSelect aria-label="Status" value={f.status} onChange={(e) => set({ ...f, status: e.target.value as "" | Status })}>
        <option value="">Todos os status</option>
        <option value="encontrado">Encontrado</option>
        <option value="nao_encontrado">Não encontrado</option>
        <option value="pendente">Pendente</option>
      </NativeSelect>
      <Input type="date" aria-label="Conferido de" title="Conferido de" value={f.de} onChange={(e) => set({ ...f, de: e.target.value })} />
      <Input type="date" aria-label="Conferido até" title="Conferido até" value={f.ate} onChange={(e) => set({ ...f, ate: e.target.value })} />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
          <input type="checkbox" checked={f.incluirTeste} onChange={(e) => set({ ...f, incluirTeste: e.target.checked })} />
          Dados de teste
        </label>
        {ativo && (
          <Button size="sm" variant="ghost" onClick={() => set(FILTROS_VAZIOS)}>
            <X className="size-4" /> Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
