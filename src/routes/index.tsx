import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, FileBarChart, LayoutDashboard, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePapeis } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Controle Patrimonial FAPDF" },
      { name: "description", content: "Sistema de controle patrimonial da Fundação de Apoio à Pesquisa do Distrito Federal." },
    ],
  }),
  component: Index,
});

const ADMIN_EMAIL = "lopesyasmin690@gmail.com";

function Index() {
  const { data: papeis } = usePapeis();
  const isAdmin = Boolean(papeis?.admin && papeis.email?.trim().toLowerCase() === ADMIN_EMAIL);
  const adminPath = isAdmin ? "/admin" : "/auth";

  const cards = [
    {
      titulo: "Consultar patrimônios",
      descricao: "Pesquise os bens cadastrados, confira setor de carga, localização e situação.",
      detalhe: "Patrimônio",
      icon: LayoutDashboard,
      to: "/painel" as const,
    },
    {
      titulo: "Área do administrador",
      descricao: "Cadastre, edite e remova patrimônios, setores e localizações.",
      detalhe: "Gerenciamento",
      icon: ShieldCheck,
      to: adminPath,
    },
  ];

  return (
    <div className="min-h-screen scroll-smooth text-slate-900" style={{ scrollBehavior: "smooth", backgroundImage: "radial-gradient(ellipse at 8% 8%, rgba(226,162,42,0.12), transparent 28%), radial-gradient(ellipse at 92% 35%, rgba(54,93,119,0.10), transparent 32%), linear-gradient(180deg, #f8fafc 0%, #eef3f6 55%, #f8fafc 100%)" }}>
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl text-white shadow-md" style={{ background: "linear-gradient(145deg, #365d77, #244458)" }}>
              <Boxes className="size-6" />
            </span>
            <span>
              <span className="block font-display text-base font-semibold sm:text-lg">Controle Patrimonial</span>
              <span className="block text-xs text-slate-500">Fundação de Apoio à Pesquisa do DF</span>
            </span>
          </Link>
          <nav aria-label="Navegação principal" className="flex items-center gap-2 sm:gap-4">
            <a href="#sobre" onClick={(e) => { e.preventDefault(); document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Info className="size-4" /> <span>Sobre</span>
            </a>
            <Button asChild variant="outline" size="sm">
              <Link to={adminPath}>{isAdmin ? "Abrir administração" : "Área do administrador"} <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl overflow-hidden px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
          <div className={`absolute -left-28 top-16 size-72 rounded-full bg-amber-300/20 blur-3xl animate-[pulse_8s_ease-in-out_infinite]`} />
          <div className={`absolute -right-24 top-[28rem] size-96 rounded-full bg-sky-300/25 blur-3xl animate-[pulse_10s_ease-in-out_infinite]`} />
          <div className={`absolute left-[48%] top-[38rem] size-64 rounded-full border border-[#365d77]/10 animate-[spin_45s_linear_infinite]`} />
        </div>
        <section className="relative isolate overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-2xl sm:px-12 sm:py-16" style={{ background: "linear-gradient(115deg, #203f53 0%, #365d77 58%, #547c91 100%)" }}>
          <div aria-hidden="true" className={`pointer-events-none absolute -right-20 -top-24 size-80 rounded-full border border-white/20 animate-[spin_32s_linear_infinite]`} />
          <div aria-hidden="true" className={`pointer-events-none absolute -right-4 -top-10 size-64 rounded-full border-[24px] border-white/5 animate-[spin_42s_linear_infinite_reverse]`} />
          <div aria-hidden="true" className={`pointer-events-none absolute bottom-[-8rem] left-[35%] size-72 rounded-full border-[36px] border-[#e2a22a]/15 animate-[pulse_7s_ease-in-out_infinite]`} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full border-[1px] border-white/15" /><div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-10 size-64 rounded-full border-[28px] border-white/5" /><div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-[42%] size-72 rounded-full border-[36px] border-[#e2a22a]/15" /><div aria-hidden="true" className="pointer-events-none right-0 top-0 h-full w-1.5 absolute bg-[#e2a22a]" />
          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-white/90"><span className="size-2 rounded-full bg-[#e2a22a]" /> GESTÃO PATRIMONIAL</div><h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Consulte os patrimônios da FAPDF em um só lugar.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              Pesquise os bens, verifique a carga patrimonial e consulte as informações disponíveis.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="border-0 bg-[#e2a22a] font-semibold text-slate-950 shadow-lg hover:bg-[#efb846]">
                <Link to="/painel">Consultar patrimônios <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/35 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                <Link to={adminPath}><ShieldCheck className="mr-2 size-4" /> Área do administrador</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#365d77]">Navegação</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">O que você precisa acessar?</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <Link key={card.titulo} to={card.to} className="group rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_30px_rgba(31,55,70,0.06)] backdrop-blur transition-all hover:-translate-y-1 hover:border-[#365d77]/30 hover:shadow-[0_18px_45px_rgba(31,55,70,0.12)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-[#365d77]/10 text-[#365d77] transition-colors group-hover:bg-[#365d77] group-hover:text-white"><card.icon className="size-6" /></span>
                  <ArrowRight className="mt-1 size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.detalhe}</p>
                <h3 className="mt-1 text-lg font-semibold">{card.titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.descricao}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="sobre" className="mt-12 scroll-mt-8 rounded-[2rem] border border-white/80 bg-white/80 px-6 py-8 shadow-[0_8px_30px_rgba(31,55,70,0.05)] backdrop-blur sm:px-10 sm:py-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#365d77]">Sobre a plataforma</p>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Fundação de Apoio à Pesquisa do Distrito Federal</h2>
            <h3 className="mt-2 text-base font-semibold text-muted-foreground">Gerência de Patrimônio e Transporte</h3>
            <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
              Este hub reúne ferramentas digitais desenvolvidas para facilitar a organização, o gerenciamento de informações e o acompanhamento dos bens patrimoniais da FAPDF. A plataforma busca tornar as consultas mais práticas, apoiar o controle dos registros e centralizar informações importantes para as atividades da Gerência de Patrimônio e Transporte.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { titulo: "Organização", descricao: "Informações estruturadas para facilitar o acompanhamento." },
                { titulo: "Centralização", descricao: "Dados patrimoniais reunidos em um único ambiente." },
                { titulo: "Eficiência", descricao: "Mais praticidade na consulta e no gerenciamento." },
              ].map((item) => (
                <div key={item.titulo} className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
                  <h4 className="font-semibold">{item.titulo}</h4>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-col gap-1 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Controle Patrimonial FAPDF</span>
          
        </footer>
      </main>
    </div>
  );
}
