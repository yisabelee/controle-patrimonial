import { z } from "zod";

export type Status = "pendente" | "encontrado" | "nao_encontrado";

export const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  encontrado: "Encontrado",
  nao_encontrado: "Não encontrado",
};

export interface Opcao {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Patrimonio {
  id: string;
  numero: string;
  descricao: string;
  setor_id: string;
  localizacao_id: string;
  ultima_conferencia: string | null;
  status: Status;
  observacoes: string | null;
  responsavel_uso: string | null;
  is_teste: boolean;
  created_at: string;
  updated_at: string;
}

/** Patrimônio com nomes resolvidos de setor/localização. */
export interface PatrimonioView extends Patrimonio {
  setor: string;
  localizacao: string;
}

export interface Filtros {
  busca: string;
  setorId: string; // "" = todos
  localizacaoId: string;
  status: "" | Status;
  de: string; // yyyy-mm-dd
  ate: string;
  incluirTeste: boolean;
}

export const FILTROS_VAZIOS: Filtros = {
  busca: "",
  setorId: "",
  localizacaoId: "",
  status: "",
  de: "",
  ate: "",
  incluirTeste: false,
};

export function resolver(
  rows: Patrimonio[],
  setores: Opcao[],
  locais: Opcao[],
): PatrimonioView[] {
  const s = new Map(setores.map((o) => [o.id, o.nome]));
  const l = new Map(locais.map((o) => [o.id, o.nome]));
  return rows.map((r) => ({
    ...r,
    setor: s.get(r.setor_id) ?? "—",
    localizacao: l.get(r.localizacao_id) ?? "—",
  }));
}

export function aplicarFiltros(rows: PatrimonioView[], f: Filtros): PatrimonioView[] {
  const q = f.busca.trim().toLowerCase();
  return rows.filter((r) => {
    if (!f.incluirTeste && r.is_teste) return false;
    if (q && ![
      r.numero, r.descricao, r.setor, r.localizacao, r.responsavel_uso ?? "", r.status, STATUS_LABEL[r.status], r.observacoes ?? "",
    ].some((valor) => valor.toLocaleLowerCase("pt-BR").includes(q))) return false;
    if (f.setorId && r.setor_id !== f.setorId) return false;
    if (f.localizacaoId && r.localizacao_id !== f.localizacaoId) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.de || f.ate) {
      if (!r.ultima_conferencia) return false;
      if (f.de && r.ultima_conferencia < f.de) return false;
      if (f.ate && r.ultima_conferencia > f.ate) return false;
    }
    return true;
  });
}

export type SortKey =
  | "numero"
  | "descricao"
  | "setor"
  | "localizacao"
  | "responsavel_uso"
  | "ultima_conferencia"
  | "status"
  | "observacoes";

export function ordenar(rows: PatrimonioView[], key: SortKey, dir: "asc" | "desc") {
  const m = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = (key === "status" ? STATUS_LABEL[a.status] : a[key]) ?? "";
    const vb = (key === "status" ? STATUS_LABEL[b.status] : b[key]) ?? "";
    return String(va).localeCompare(String(vb), "pt-BR", { numeric: true }) * m;
  });
}

export interface Resumo {
  total: number;
  encontrados: number;
  naoEncontrados: number;
  pendentes: number;
  percentualEncontrados: number; // 0-100, sobre o total
}

export function resumir(rows: PatrimonioView[]): Resumo {
  const total = rows.length;
  const encontrados = rows.filter((r) => r.status === "encontrado").length;
  const naoEncontrados = rows.filter((r) => r.status === "nao_encontrado").length;
  const pendentes = total - encontrados - naoEncontrados;
  return {
    total,
    encontrados,
    naoEncontrados,
    pendentes,
    percentualEncontrados: total ? Math.round((encontrados / total) * 1000) / 10 : 0,
  };
}

export function agruparPor(rows: PatrimonioView[], campo: "setor" | "localizacao") {
  const map = new Map<string, Resumo & { nome: string }>();
  for (const r of rows) {
    const nome = r[campo];
    const cur = map.get(nome) ?? {
      nome,
      total: 0,
      encontrados: 0,
      naoEncontrados: 0,
      pendentes: 0,
      percentualEncontrados: 0,
    };
    cur.total++;
    if (r.status === "encontrado") cur.encontrados++;
    else if (r.status === "nao_encontrado") cur.naoEncontrados++;
    else cur.pendentes++;
    cur.percentualEncontrados = Math.round((cur.encontrados / cur.total) * 1000) / 10;
    map.set(nome, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function formatarData(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

export function hojeISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function descreverFiltros(f: Filtros, setores: Opcao[], locais: Opcao[]): string[] {
  const out: string[] = [];
  if (f.busca.trim()) out.push(`Busca: "${f.busca.trim()}"`);
  if (f.setorId) out.push(`Setor da carga: ${setores.find((s) => s.id === f.setorId)?.nome ?? "?"}`);
  if (f.localizacaoId)
    out.push(`Localização: ${locais.find((s) => s.id === f.localizacaoId)?.nome ?? "?"}`);
  if (f.status) out.push(`Status: ${STATUS_LABEL[f.status]}`);
  if (f.de || f.ate)
    out.push(`Conferência: ${f.de ? formatarData(f.de) : "início"} a ${f.ate ? formatarData(f.ate) : "hoje"}`);
  if (f.incluirTeste) out.push("Inclui dados de teste");
  return out;
}

export const patrimonioSchema = z.object({
  numero: z.string().trim().min(1, "Informe o número do patrimônio").max(50, "Máximo de 50 caracteres"),
  descricao: z.string().trim().min(1, "Informe a descrição do bem").max(300, "Máximo de 300 caracteres"),
  setor_id: z.string().uuid("Selecione o setor da carga"),
  localizacao_id: z.string().uuid("Selecione a localização atual"),
  observacoes: z.string().max(2000, "Máximo de 2000 caracteres").optional().default(""),
  responsavel_uso: z.string().trim().max(200, "Máximo de 200 caracteres").optional().default(""),
  is_teste: z.boolean().default(false),
});

export const conferenciaSchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data")
    .refine((d) => d <= hojeISO(), "A data não pode ser futura"),
  status: z.enum(["encontrado", "nao_encontrado"]),
  localizacao_id: z.string().uuid("Selecione a localização"),
  observacoes: z.string().max(2000).optional().default(""),
}).refine((v) => v.status !== "nao_encontrado" || v.observacoes.trim().length > 0, {
  message: "Explique a situação do bem não encontrado",
  path: ["observacoes"],
});

/** Traduz erros do banco para mensagens compreensíveis. */
export function mensagemErro(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  if (err?.code === "23505") return "Já existe um registro com esse número/nome.";
  if (err?.code === "23503") return "Este item está em uso por patrimônios e não pode ser excluído. Desative-o.";
  if (err?.code === "42501") return "Você não tem permissão para esta operação.";
  return err?.message || "Não foi possível concluir a operação.";
}
