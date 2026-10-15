import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { agruparPor, resumir, type PatrimonioView } from "@/lib/patrimonio";

function Kpi({ label, valor, tom }: { label: string; valor: string | number; tom?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold tabular-nums ${tom ?? ""}`}>{valor}</div>
    </div>
  );
}

export function Kpis({ rows }: { rows: PatrimonioView[] }) {
  const r = resumir(rows);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Kpi label="Total" valor={r.total} />
      <Kpi label="Encontrados" valor={r.encontrados} tom="text-success" />
      <Kpi label="Não encontrados" valor={r.naoEncontrados} tom="text-destructive" />
      <Kpi label="Pendentes" valor={r.pendentes} tom="text-warning-foreground" />
      <Kpi label="% encontrados" valor={`${r.percentualEncontrados.toLocaleString("pt-BR")}%`} />
    </div>
  );
}

const CORES = { encontrados: "var(--chart-1)", naoEncontrados: "var(--chart-2)", pendentes: "var(--chart-3)" };

function PorGrupo({ titulo, rows, campo }: { titulo: string; rows: PatrimonioView[]; campo: "setor" | "localizacao" }) {
  const dados = agruparPor(rows, campo).slice(0, 8);
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{titulo}</h3>
      {dados.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Sem dados</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, dados.length * 34)}>
          <BarChart data={dados} layout="vertical" margin={{ left: 0, right: 12 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis type="category" dataKey="nome" width={120} fontSize={11} tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 17) + "…" : v)} />
            <Tooltip />
            <Bar dataKey="encontrados" name="Encontrados" stackId="a" fill={CORES.encontrados} />
            <Bar dataKey="naoEncontrados" name="Não encontrados" stackId="a" fill={CORES.naoEncontrados} />
            <Bar dataKey="pendentes" name="Pendentes" stackId="a" fill={CORES.pendentes} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function Graficos({ rows }: { rows: PatrimonioView[] }) {
  const r = resumir(rows);
  const pizza = [
    { nome: "Encontrados", valor: r.encontrados, cor: CORES.encontrados },
    { nome: "Não encontrados", valor: r.naoEncontrados, cor: CORES.naoEncontrados },
    { nome: "Pendentes", valor: r.pendentes, cor: CORES.pendentes },
  ].filter((p) => p.valor > 0);
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_1.4fr]">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Situação da conferência</h3>
        {pizza.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Sem dados</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={pizza} dataKey="valor" nameKey="nome" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {pizza.map((p) => <Cell key={p.nome} fill={p.cor} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 space-y-1 text-xs">
              {pizza.map((p) => (
                <li key={p.nome} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: p.cor }} />
                  {p.nome}: <strong>{p.valor}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <PorGrupo titulo="Por setor da carga" rows={rows} campo="setor" />
      <PorGrupo titulo="Por localização atual" rows={rows} campo="localizacao" />
    </div>
  );
}
