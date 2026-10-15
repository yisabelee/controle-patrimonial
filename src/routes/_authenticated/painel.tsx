import { createFileRoute } from "@tanstack/react-router";
import { AcervoView, useFiltrosAcervo } from "@/components/AcervoView";
import { Graficos, Kpis } from "@/components/Indicadores";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Controle Patrimonial" },
      { name: "description", content: "Indicadores e consulta dos patrimônios cadastrados." },
      { property: "og:title", content: "Painel — Controle Patrimonial" },
      { property: "og:description", content: "Indicadores e consulta dos patrimônios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Painel,
});

function Painel() {
  const estado = useFiltrosAcervo();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Painel patrimonial</h1>
        <p className="text-sm text-muted-foreground">Indicadores calculados sobre os registros filtrados abaixo.</p>
      </div>
      <Kpis rows={estado.filtrados} />
      <Graficos rows={estado.filtrados} />
      <AcervoView estado={estado} />
    </div>
  );
}
