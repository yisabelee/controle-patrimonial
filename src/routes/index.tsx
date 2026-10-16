import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePapeis } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Controle Patrimonial FAPDF" },
      {
        name: "description",
        content: "Sistema de consulta, acompanhamento e conferência dos bens patrimoniais da FAPDF.",
      },
      { property: "og:title", content: "Controle Patrimonial FAPDF" },
      {
        property: "og:description",
        content: "Consulta patrimonial, conferência física e relatórios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ADMIN_EMAIL = "lopesyasmin690@gmail.com";

function Index() {
  const { data: papeis, isLoading } = usePapeis();
  const isAdmin = Boolean(
    papeis?.admin && papeis.email?.trim().toLocaleLowerCase("pt-BR") === ADMIN_EMAIL,
  );

  const atalhos = [
    {
      titulo: "Painel patrimonial",
      descricao: "Consulte os bens, pesquise registros e acompanhe os indicadores do inventário.",
      detalhe: "Consulta de bens",
      icon: LayoutDashboard,
      to: "/painel" as const,
    },
    {
      titulo: "Relatórios",
      descricao: "Acesse os relatórios disponíveis e organize as informações para conferência.",
      detalhe: "PDF e planilhas",
      icon: FileBarChart,
      to: "/relatorios" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Boxes className="size-6" />
            </span>
            <span>
              <span className="block font-display text-base font-semibold sm:text-lg">
                Controle Patrimonial
              </span>
              <span className="block text-xs text-muted-foreground">Fundação de Apoio à Pesquisa do DF</span>
            </span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Entrar <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <section className="relative overflow-hidden rounded-3xl bg-sidebar px-6 py-9 text-sidebar-foreground shadow-sm sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[36px] border-sidebar-primary/10" />
          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/70 px-3 py-1.5 text-xs font-medium">
              <span className="size-2 rounded-full bg-sidebar-primary" />
              Sistema de gestão patrimonial
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
              Organização e transparência em cada bem patrimonial.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-sidebar-foreground/75 sm:text-base">
              Consulte o inventário, acompanhe as informações dos bens e acesse as ferramentas de
              conferência e relatórios em um só lugar.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                <Link to="/painel">Acessar painel <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              {isAdmin && (
                <Button asChild size="lg" variant="outline" className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent">
                  <Link to="/admin"><ShieldCheck className="mr-2 size-4" /> Área administrativa</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Acesso rápido</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">O que você precisa fazer?</h2>
            </div>
            <p className="text-sm text-muted-foreground">Escolha uma área para continuar</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {atalhos.map((atalho) => (
              <Link
                key={atalho.titulo}
                to={atalho.to}
                className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <atalho.icon className="size-6" />
                  </span>
                  <ArrowRight className="mt-1 size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{atalho.detalhe}</p>
                <h3 className="mt-1 text-lg font-semibold">{atalho.titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{atalho.descricao}</p>
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="group rounded-2xl border border-primary/20 bg-primary/[0.035] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-6" />
                  </span>
                  <ArrowRight className="mt-1 size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Acesso restrito</p>
                <h3 className="mt-1 text-lg font-semibold">Área administrativa</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Gerencie os cadastros auxiliares e mantenha os dados do sistema organizados.
                </p>
              </Link>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Boxes, titulo: "Inventário centralizado", texto: "Informações dos bens organizadas em um só ambiente." },
            { icon: ClipboardCheck, titulo: "Conferência registrada", texto: "Acompanhe status e histórico das verificações." },
            { icon: FileBarChart, titulo: "Relatórios práticos", texto: "Consulte as ferramentas de relatório disponíveis." },
          ].map((item) => (
            <div key={item.titulo} className="flex gap-3 rounded-xl border border-dashed p-4">
              <item.icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">{item.titulo}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.texto}</p>
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-12 flex flex-col gap-1 border-t pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Controle Patrimonial FAPDF</span>
          <span>{isLoading ? "Verificando permissões…" : isAdmin ? "Sessão administrativa autorizada" : "Acesso conforme as permissões da conta"}</span>
        </footer>
      </main>
    </div>
  );
}
