import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { FileSpreadsheet, Upload, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInvalidarAcervo } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import type { Opcao } from "@/lib/patrimonio";

type CampoPlanilha = "numero" | "descricao" | "carga" | "localizacao" | "data" | "responsavel";
type Linha = {
  linha: number;
  numero: string;
  descricao: string;
  carga: string;
  localizacao: string;
  data: string;
  responsavel: string;
  setor_id: string | null;
  localizacao_id: string | null;
  status: "pronta" | "erro" | "duplicada";
  motivos: string[];
};
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setores: Opcao[];
  localizacoes: Opcao[];
};

const CAMPOS: { key: CampoPlanilha; label: string; required: boolean; aliases: string[] }[] = [
  { key: "numero", label: "Tombamento", required: true, aliases: ["tombamento", "numero", "numeropatrimonio", "numerodotombo", "tombo", "npatrimonio", "patrimonio"] },
  { key: "descricao", label: "Descrição", required: true, aliases: ["descricao", "descricaodobem", "objeto", "descricaodoobjeto"] },
  { key: "carga", label: "Carga / setor", required: true, aliases: ["carga", "setor", "setordacarga", "setorresponsavel", "cargapatrimonial"] },
  { key: "localizacao", label: "Localização atual", required: true, aliases: ["localizacaoatual", "localizacao", "localatual", "local"] },
  { key: "data", label: "Data da conferência", required: false, aliases: ["datadaconferencia", "ultimaconferencia", "dataconferencia", "ultimadatadeconferencia", "conferencia"] },
  { key: "responsavel", label: "Quem está utilizando o bem", required: false, aliases: ["quemestautilizando", "quemestautilizandoobem", "responsavelpelouso", "responsaveluso", "usuariodobem", "responsavel", "usuario"] },
];

function normalizarCabecalho(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function texto(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}
function dataISO(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear(), month = String(value.getMonth() + 1).padStart(2, "0"), day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const parts = XLSX.SSF.parse_date_code(value);
    if (parts) return `${parts.y}-${String(parts.m).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
  }
  const raw = String(value).trim();
  const br = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (br) return `${br[3]}-${(br[2] ?? "").padStart(2, "0")}-${(br[1] ?? "").padStart(2, "0")}`;
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${(iso[2] ?? "").padStart(2, "0")}-${(iso[3] ?? "").padStart(2, "0")}`;
  return null;
}
function nomeChave(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
}

export function ImportarPatrimonios({ open, onOpenChange, setores, localizacoes }: Props) {
  const invalidar = useInvalidarAcervo();
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [cabecalhos, setCabecalhos] = useState<string[]>([]);
  const [dados, setDados] = useState<unknown[][]>([]);
  const [mapeamento, setMapeamento] = useState<Record<CampoPlanilha, string>>({
    numero: "", descricao: "", carga: "", localizacao: "", data: "", responsavel: "",
  });
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [lendo, setLendo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [fase, setFase] = useState<"arquivo" | "revisao">("arquivo");
  const [resultado, setResultado] = useState<{ sucesso: number; ignoradas: number; erros: number } | null>(null);

  const resumo = useMemo(() => ({
    total: linhas.length,
    prontas: linhas.filter((l) => l.status === "pronta").length,
    duplicadas: linhas.filter((l) => l.status === "duplicada").length,
    erros: linhas.filter((l) => l.status === "erro").length,
  }), [linhas]);

  function limpar() {
    setNomeArquivo(""); setCabecalhos([]); setDados([]); setLinhas([]);
    setMapeamento({ numero: "", descricao: "", carga: "", localizacao: "", data: "", responsavel: "" });
    setFase("arquivo"); setResultado(null); setLendo(false); setImportando(false);
  }
  function fechar(value: boolean) {
    if (!value && !importando) { onOpenChange(false); limpar(); }
    else if (value) onOpenChange(true);
  }

  async function lerArquivo(file?: File) {
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) { toast.error("Selecione um arquivo .xlsx ou .csv."); return; }
    setLendo(true);
    try {
      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(bytes, { type: "array", cellDates: true });
      const primeiraAba = workbook.SheetNames[0];
      const sheet = primeiraAba ? workbook.Sheets[primeiraAba] : undefined;
      if (!sheet) throw new Error("A planilha não contém uma aba com dados.");
      const matriz = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
      if (matriz.length < 2) throw new Error("A planilha precisa ter uma linha de cabeçalho e pelo menos um patrimônio.");
      const headers = (matriz[0] ?? []).map((v, i) => texto(v) || `Coluna ${i + 1}`);
      const rows = matriz.slice(1).filter((r) => r.some((v) => texto(v) !== ""));
      if (!rows.length) throw new Error("Não encontrei linhas com patrimônios.");
      const nextMapping = { ...mapeamento };
      for (const campo of CAMPOS) {
        const index = headers.findIndex((header) => campo.aliases.includes(normalizarCabecalho(header)));
        nextMapping[campo.key] = index >= 0 ? String(index) : "";
      }
      setNomeArquivo(file.name); setCabecalhos(headers); setDados(rows); setMapeamento(nextMapping);
      setFase("revisao"); setLinhas([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler a planilha.");
    } finally { setLendo(false); }
  }

  async function prepararImportacao() {
    const obrigatorios = CAMPOS.filter((c) => c.required && mapeamento[c.key] === "");
    if (obrigatorios.length) { toast.error(`Associe as colunas obrigatórias: ${obrigatorios.map((c) => c.label).join(", ")}.`); return; }
    const [{ data: existentes, error: erroExistentes }] = await Promise.all([
      supabase.from("patrimonios").select("numero"),
    ]);
    if (erroExistentes) { toast.error(`Não foi possível consultar os patrimônios existentes: ${erroExistentes.message}`); return; }
    const numerosExistentes = new Set((existentes ?? []).map((r) => String(r.numero).trim()));
    const mapaSetores = new Map(setores.map((s) => [nomeChave(s.nome), s]));
    const mapaLocais = new Map(localizacoes.map((l) => [nomeChave(l.nome), l]));
    const vistos = new Set<string>();
    const novas: Linha[] = dados.map((row, i) => {
      const get = (campo: CampoPlanilha) => mapeamento[campo] === "" ? "" : texto(row[Number(mapeamento[campo])]);
      const numero = get("numero"), descricao = get("descricao"), carga = get("carga"), localizacao = get("localizacao"), dataRaw = get("data"), responsavel = get("responsavel");
      const motivos: string[] = [];
      const setor = mapaSetores.get(nomeChave(carga));
      const local = mapaLocais.get(nomeChave(localizacao));
      const data = dataRaw ? dataISO(row[Number(mapeamento.data)]) : null;
      if (!numero) motivos.push("Tombamento não informado");
      if (!descricao) motivos.push("Descrição não informada");
      if (!carga) motivos.push("Carga não informada");
      else if (!setor) motivos.push(`Setor “${carga}” não cadastrado`);
      if (!localizacao) motivos.push("Localização não informada");
      else if (!local) motivos.push(`Localização “${localizacao}” não cadastrada`);
      if (dataRaw && !data) motivos.push("Data da conferência inválida");
      if (data && data > new Date().toLocaleDateString("en-CA")) motivos.push("Data da conferência não pode ser futura");
      let status: Linha["status"] = motivos.length ? "erro" : "pronta";
      if (numero && (numerosExistentes.has(numero) || vistos.has(numero))) {
        status = "duplicada"; motivos.splice(0, motivos.length, numerosExistentes.has(numero) ? "Tombamento já existe no sistema" : "Tombamento repetido na planilha");
      } else if (numero) vistos.add(numero);
      return { linha: i + 2, numero, descricao, carga, localizacao, data: data ?? "", responsavel, setor_id: setor?.id ?? null, localizacao_id: local?.id ?? null, status, motivos };
    });
    setLinhas(novas);
  }

  async function confirmarImportacao() {
    const prontos = linhas.filter((l) => l.status === "pronta");
    if (!prontos.length) { toast.error("Não há linhas válidas para importar."); return; }
    setImportando(true);
    let sucesso = 0, ignoradas = linhas.filter((l) => l.status === "duplicada").length, erros = linhas.filter((l) => l.status === "erro").length;
    let responsavelIndisponivel = false;
    for (let i = 0; i < prontos.length; i += 100) {
      const lote = prontos.slice(i, i + 100);
      const registros = lote.map((l) => ({
        numero: l.numero, descricao: l.descricao, setor_id: l.setor_id!, localizacao_id: l.localizacao_id!,
        ultima_conferencia: l.data || null, status: l.data ? "encontrado" as const : "pendente" as const,
        observacoes: null, responsavel_uso: l.responsavel || null, is_teste: false,
      }));
      let { error } = await supabase.from("patrimonios").insert(registros);
      if (error && (error.code === "PGRST204" || (error.message.includes("responsavel_uso") && error.message.includes("schema cache")))) {
        const semResponsavel = registros.map(({ responsavel_uso: _responsavel, ...registro }) => registro);
        const tentativa = await supabase.from("patrimonios").insert(semResponsavel);
        error = tentativa.error;
        if (!error) responsavelIndisponivel = true;
      }
      if (error) {
        erros += lote.length;
        toast.error(`Falha ao importar o lote iniciado na linha ${lote[0]?.linha ?? "?"}: ${error.message}`);
      } else sucesso += lote.length;
    }
    await invalidar();
    setResultado({ sucesso, ignoradas, erros });
    setImportando(false);
    if (sucesso) toast.success(`${sucesso} patrimônio(s) importado(s).`);
    if (responsavelIndisponivel) toast.warning("A coluna de usuário não existe no banco ainda; os patrimônios foram importados sem salvar esse campo.");
  }

  function baixarRelatorio() {
    const rows = linhas.map((l) => ({
      Linha: l.linha, Tombamento: l.numero, Descricao: l.descricao, Carga: l.carga,
      "Localizacao atual": l.localizacao, "Data da conferencia": l.data, "Quem utiliza": l.responsavel,
      Situacao: l.status, Motivo: l.motivos.join("; "),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Resultado");
    XLSX.writeFile(wb, "resultado-importacao-patrimonios.xlsx");
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5 text-primary" /> Importar patrimônios por planilha</DialogTitle>
          <DialogDescription>Importe tombamento, descrição, carga, localização atual, data da conferência e quem utiliza o bem.</DialogDescription>
        </DialogHeader>

        {fase === "arquivo" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Upload className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 font-medium">Selecione uma planilha Excel ou CSV</p>
              <p className="mt-1 text-sm text-muted-foreground">Formatos aceitos: .xlsx e .csv. A primeira linha deve conter os cabeçalhos.</p>
              <label className="mt-4 inline-flex cursor-pointer">
                <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => void lerArquivo(e.target.files?.[0])} />
                <span className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{lendo ? "Lendo arquivo…" : "Escolher arquivo"}</span>
              </label>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">Colunas esperadas</p>
              <p className="mt-1 text-muted-foreground">TOMBAMENTO · DESCRIÇÃO · CARGA · LOCALIZAÇÃO ATUAL · DATA DA CONFERÊNCIA · QUEM ESTÁ UTILIZANDO O BEM</p>
              <p className="mt-2 text-muted-foreground">A data e quem utiliza podem ficar vazios. Os setores e as localizações devem existir no sistema antes da importação.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2"><FileSpreadsheet className="size-5 text-primary" /><span className="text-sm font-medium">{nomeArquivo}</span></div>
              <Button variant="outline" size="sm" onClick={() => { setFase("arquivo"); setLinhas([]); setResultado(null); }}>Trocar arquivo</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPOS.map((campo) => (
                <label key={campo.key} className="space-y-1 text-sm">
                  <span className="font-medium">{campo.label}{campo.required ? " *" : ""}</span>
                  <select className="h-10 w-full rounded-md border bg-background px-3" value={mapeamento[campo.key]} onChange={(e) => setMapeamento((old) => ({ ...old, [campo.key]: e.target.value }))}>
                    <option value="">Não importar esta coluna</option>
                    {cabecalhos.map((header, i) => <option key={i} value={String(i)}>{header}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void prepararImportacao()} disabled={importando}><CheckCircle2 className="size-4" /> Validar planilha</Button>
              {linhas.length > 0 && <Button variant="outline" onClick={baixarRelatorio}>Baixar relatório de validação</Button>}
            </div>
            {linhas.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Resumo label="Linhas" value={resumo.total} />
                  <Resumo label="Prontas" value={resumo.prontas} />
                  <Resumo label="Duplicadas" value={resumo.duplicadas} />
                  <Resumo label="Com erro" value={resumo.erros} />
                </div>
                <div className="max-h-[38vh] overflow-auto rounded-md border">
                  <table className="w-full min-w-[1050px] text-left text-xs">
                    <thead className="sticky top-0 bg-muted">
                      <tr>{["Linha", "Tombamento", "Descrição", "Carga", "Localização", "Data", "Quem utiliza", "Situação"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => <tr key={l.linha} className="border-t align-top">
                        <td className="px-3 py-2">{l.linha}</td><td className="px-3 py-2">{l.numero || "—"}</td><td className="px-3 py-2">{l.descricao || "—"}</td><td className="px-3 py-2">{l.carga || "—"}</td><td className="px-3 py-2">{l.localizacao || "—"}</td><td className="px-3 py-2">{l.data || "—"}</td><td className="px-3 py-2">{l.responsavel || "—"}</td>
                        <td className="px-3 py-2"><span className={l.status === "pronta" ? "text-emerald-700" : l.status === "duplicada" ? "text-amber-700" : "text-destructive"}>{l.status === "pronta" ? "Pronta" : l.status === "duplicada" ? "Duplicada" : "Erro"}</span>{l.motivos.length > 0 && <p className="mt-1 max-w-64 whitespace-normal text-muted-foreground">{l.motivos.join("; ")}</p>}</td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
                {resultado && <div className="rounded-lg border p-3 text-sm"><p className="font-semibold">Resultado da importação</p><p className="mt-1">Importados: {resultado.sucesso} · Duplicados ignorados: {resultado.ignoradas} · Com erro: {resultado.erros}</p></div>}
                <DialogFooter>
                  <Button variant="outline" onClick={baixarRelatorio}>Baixar relatório</Button>
                  <Button onClick={() => void confirmarImportacao()} disabled={!resumo.prontas || importando}>{importando ? "Importando…" : `Importar ${resumo.prontas} patrimônio(s)`}</Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => fechar(false)} disabled={importando}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Resumo({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>;
}
