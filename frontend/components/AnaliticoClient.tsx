"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Kpis = {
  total_visitas: number;
  clientes_visitados: number;
  vendedores_ativos: number;
  vendas_efetivadas: number;
  conversao_percentual: number | null;
};

type VisitaDia = {
  data_visita: string;
  total_visitas: number;
  vendas_efetivadas: number;
};

type TipoVisita = {
  tipo_visita: string;
  total: number;
};

type LinhaTabela = {
  id_visita_erp: number;
  data_hora_visita: string;
  cliente_nome: string;
  cliente_nome_fantasia: string;
  vendedor_nome: string;
  tipo_visita: string;
  venda_efetivada: boolean;
  observacao: string | null;
};

export default function AnaliticoClient() {
  const hoje = new Date().toISOString().split("T")[0];

  const [dataInicial, setDataInicial] = useState(hoje);
  const [dataFinal, setDataFinal] = useState(hoje);
  const [vendedor, setVendedor] = useState("TODOS");

  const [kpis, setKpis] = useState<Kpis>({
    total_visitas: 0,
    clientes_visitados: 0,
    vendedores_ativos: 0,
    vendas_efetivadas: 0,
    conversao_percentual: 0,
  });

  const [visitasDia, setVisitasDia] = useState<VisitaDia[]>([]);
  const [tiposVisita, setTiposVisita] = useState<TipoVisita[]>([]);
  const [tabela, setTabela] = useState<LinhaTabela[]>([]);
  const [vendedores, setVendedores] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregarDados() {
    setLoading(true);

    try {
      const params: Record<string, string> = {
        data_inicial: dataInicial,
        data_final: dataFinal,
      };

      if (vendedor !== "TODOS") {
        params.vendedor = vendedor;
      }

      const [kpisRes, visitasDiaRes, tiposRes, tabelaRes, vendedoresRes] =
        await Promise.all([
          api.get("/analitico-kpis", { params }),
          api.get("/analitico-visitas-dia", { params }),
          api.get("/analitico-tipos-visita", { params }),
          api.get("/analitico-tabela", { params }),
          api.get("/vendedores-visitas"),
        ]);

      setKpis(kpisRes.data ?? {});
      setVisitasDia(visitasDiaRes.data ?? []);
      setTiposVisita(tiposRes.data ?? []);
      setTabela(tabelaRes.data ?? []);
      setVendedores(
        (vendedoresRes.data ?? []).map((item: any) => item.vendedor_nome)
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const maiorDia = useMemo(() => {
    return Math.max(...visitasDia.map((item) => item.total_visitas), 1);
  }, [visitasDia]);

  const maiorTipo = useMemo(() => {
    return Math.max(...tiposVisita.map((item) => item.total), 1);
  }, [tiposVisita]);

  function formatarDataHora(valor: string) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportarCsv() {
  const colunas = [
    "ID Visita",
    "Data/Hora",
    "Vendedor",
    "Cliente",
    "Tipo Visita",
    "Venda Efetivada",
    "Observação",
  ];

  const linhas = tabela.map((linha) => [
    linha.id_visita_erp,
    formatarDataHora(linha.data_hora_visita),
    linha.vendedor_nome,
    linha.cliente_nome_fantasia ?? linha.cliente_nome,
    linha.tipo_visita ?? "",
    linha.venda_efetivada ? "Sim" : "Não",
    linha.observacao ?? "",
  ]);

  const csv = [colunas, ...linhas]
    .map((linha) =>
      linha
        .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `analitico-visitas-${dataInicial}-${dataFinal}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analítico</h1>

        <p className="mt-1 text-sm text-slate-500">
          Análise consolidada das visitas comerciais realizadas.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Data inicial
            </label>

            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Data final
            </label>

            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Vendedor
            </label>

            <select
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="TODOS">Todos os vendedores</option>

              {vendedores.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={carregarDados}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <KpiCard titulo="Total Visitas" valor={kpis.total_visitas ?? 0} />
        <KpiCard
          titulo="Clientes Visitados"
          valor={kpis.clientes_visitados ?? 0}
        />
        <KpiCard
          titulo="Vendedores Ativos"
          valor={kpis.vendedores_ativos ?? 0}
        />
        <KpiCard
          titulo="Vendas Efetivadas"
          valor={kpis.vendas_efetivadas ?? 0}
        />
        <KpiCard
          titulo="Conversão"
          valor={`${Number(kpis.conversao_percentual ?? 0).toFixed(2)}%`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Visitas por Dia
          </h2>

          <div className="space-y-3">
            {visitasDia.map((item) => (
              <div key={item.data_visita}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.data_visita}</span>
                  <span className="font-semibold">{item.total_visitas}</span>
                </div>

                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-blue-600"
                    style={{
                      width: `${(item.total_visitas / maiorDia) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {visitasDia.length === 0 && (
              <p className="text-sm text-slate-500">Sem dados no período.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Tipos de Visita
          </h2>

          <div className="space-y-3">
            {tiposVisita.map((item) => (
              <div key={item.tipo_visita}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.tipo_visita}</span>
                  <span className="font-semibold">{item.total}</span>
                </div>

                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-slate-700"
                    style={{
                      width: `${(item.total / maiorTipo) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {tiposVisita.length === 0 && (
              <p className="text-sm text-slate-500">Sem dados no período.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
            Detalhamento das Visitas
        </h2>

        <button
            onClick={exportarCsv}
            disabled={tabela.length === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
            Exportar CSV
        </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-600">
                <th className="py-2">Data/Hora</th>
                <th>Vendedor</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Venda</th>
                <th>Observação</th>
              </tr>
            </thead>

            <tbody>
              {tabela.map((linha) => (
                <tr key={linha.id_visita_erp} className="border-b">
                  <td className="py-2">{formatarDataHora(linha.data_hora_visita)}</td>
                  <td>{linha.vendedor_nome}</td>
                  <td>{linha.cliente_nome_fantasia ?? linha.cliente_nome}</td>
                  <td>{linha.tipo_visita}</td>
                  <td>{linha.venda_efetivada ? "Sim" : "Não"}</td>
                  <td>{linha.observacao ?? "-"}</td>
                </tr>
              ))}

              {tabela.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    Nenhuma visita encontrada no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}