"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type RankingItem = {
  id_vendedor_erp: number;
  vendedor_nome: string;
  total_visitas: number;
  clientes_visitados: number;
  vendas_efetivadas: number;
  conversao_percentual: number;
  ultima_visita: string;
};

export default function RankingClient() {
  const hoje = new Date().toISOString().split("T")[0];

  const [dataInicial, setDataInicial] = useState(hoje);
  const [dataFinal, setDataFinal] = useState(hoje);

  const [dados, setDados] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregarDados() {
    setLoading(true);

    try {
      const response = await api.get("/ranking-comercial", {
        params: {
          data_inicial: dataInicial,
          data_final: dataFinal,
        },
      });

      setDados(response.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function formatarDataHora(valor?: string) {
    if (!valor) return "-";

    return new Date(valor).toLocaleString("pt-BR");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Ranking Comercial
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Desempenho dos vendedores por período.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Data Inicial
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
              Data Final
            </label>

            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={carregarDados}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Ranking de Vendedores
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-4 py-3">Posição</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3 text-center">Visitas</th>
                <th className="px-4 py-3 text-center">Clientes</th>
                <th className="px-4 py-3 text-center">Vendas</th>
                <th className="px-4 py-3 text-center">Conversão</th>
                <th className="px-4 py-3">Última Visita</th>
              </tr>
            </thead>

            <tbody>
              {dados.map((item, index) => (
                <tr
                  key={`${item.id_vendedor_erp}-${index}`}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold">
                    #{index + 1}
                  </td>

                  <td className="px-4 py-3">
                    {item.vendedor_nome}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {item.total_visitas}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {item.clientes_visitados}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {item.vendas_efetivadas}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {Number(item.conversao_percentual ?? 0).toFixed(2)}%
                  </td>

                  <td className="px-4 py-3">
                    {formatarDataHora(item.ultima_visita)}
                  </td>
                </tr>
              ))}

              {dados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-slate-500"
                  >
                    Nenhum resultado encontrado.
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