import Link from "next/link";

const modulos = [
  {
    titulo: "Monitoramento",
    descricao: "Acompanhar visitas no mapa e operação em campo.",
    href: "/monitoramento",
  },
  {
    titulo: "Planejado x Realizado",
    descricao: "Analisar aderência entre rota planejada e executada.",
    href: "/planejado-realizado",
  },
  {
    titulo: "Programação",
    descricao: "Criar pastas, vincular clientes e organizar rotas.",
    href: "/programacao",
  },
  {
    titulo: "Ranking",
    descricao: "Avaliar desempenho da equipe comercial.",
    href: "/ranking",
  },
  {
    titulo: "Analítico",
    descricao: "Visualizar indicadores e tendências comerciais.",
    href: "/analitico",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          MVP - Monitoramento de Visitas
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Gestão operacional de visitas, programação comercial e aderência de rota.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modulos.map((modulo) => (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {modulo.titulo}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {modulo.descricao}
            </p>

            <p className="mt-5 text-sm font-semibold text-blue-600">
              Acessar módulo →
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}