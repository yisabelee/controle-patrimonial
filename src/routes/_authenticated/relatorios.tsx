import { createFileRoute } from "@tanstack/react-router";
import { AcervoView, useFiltrosAcervo } from "@/components/AcervoView";
import { Graficos, Kpis } from "@/components/Indicadores";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Controle Patrimonial" },
      { name: "description", content: "Consulte indicadores e exporte relatórios patrimoniais." },
    ],
  }),
  component: Relatorios,
});

function Relatorios() {
  const estado = useFiltrosAcervo();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios patrimoniais</h1>
        <p className="text-sm text-muted-foreground">Filtre os registros e exporte os resultados em Excel ou PDF.</p>
      </div>
      <Kpis rows={estado.filtrados} />
      <Graficos rows={estado.filtrados} />
      <AcervoView estado={estado} />
    </div>
  );
}
