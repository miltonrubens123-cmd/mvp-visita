"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Resumo = {
  vendedor_nome: string;
  programados: number;
  visitados: number;
  nao_visitados: number;
  percentual: number;
};

type Cliente = {
  cliente_id_erp: number;
  cliente_nome: string;
  pasta_nome: string;
  ordem_rota: number;
  status: "VISITADO" | "NAO_VISITADO" | "FORA_ROTA";
};

type Detalhe = {
  vendedor_nome: string;
  clientes: Cliente[];
};

export default function PlanejadoRealPanel() {
  const hoje = new Date().toISOString().split("T")[0];

  const [dataFiltro, setDataFiltro] = useState(hoje);
  const [vendedor, setVendedor] = useState("TODOS");

  const [resumo, setResumo] = useState<Resumo[]>([]);
  const [detalhe, setDetalhe] = useState<Detalhe[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    setLoading(true);
    setErro("");

    try {
      const params: Record<string, string> = {
        data: dataFiltro,
      };

      const [resResumo, resDetalhe] = await Promise.all([
        api.get("/planejado-realizado", { params }),
        api.get("/planejado-realizado-detalhe", { params }),
      ]);

      setResumo(resResumo.data ?? []);
      setDetalhe(resDetalhe.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar Planejado x Realizado:", error);
      setErro("Não foi possível carregar os dados do Planejado x Realizado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const vendedores = useMemo(() => {
    return resumo.map((item) => item.vendedor_nome);
  }, [resumo]);

  const resumoFiltrado = useMemo(() => {
    if (vendedor === "TODOS") return resumo;
    return resumo.filter((item) => item.vendedor_nome === vendedor);
  }, [resumo, vendedor]);

  const detalheFiltrado = useMemo(() => {
    if (vendedor === "TODOS") return detalhe;
    return detalhe.filter((item) => item.vendedor_nome === vendedor);
  }, [detalhe, vendedor]);

  const totalProgramados = resumoFiltrado.reduce(
    (acc, item) => acc + item.programados,
    0
  );

  const totalVisitados = resumoFiltrado.reduce(
    (acc, item) => acc + item.visitados,
    0
  );

  const totalNaoVisitados = resumoFiltrado.reduce(
    (acc, item) => acc + item.nao_visitados,
    0
  );

  const aderencia =
    totalProgramados > 0
      ? Math.round((totalVisitados / totalProgramados) * 100)
      : 0;

  function getStatusClass(status: Cliente["status"]) {
    if (status === "VISITADO") return "bg-green-500 border-green-700";
    if (status === "FORA_ROTA") return "bg-yellow-400 border-yellow-600";
    return "bg-slate-300 border-slate-700";
  }

  function getResumoVendedor(nome: string) {
    return resumo.find((item) => item.vendedor_nome === nome);
  }

  function getBateria(percentual: number) {
    if (percentual >= 80) return "bg-green-500";
    if (percentual >= 50) return "bg-yellow-400";
    return "bg-red-500";
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard de vendas
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Acompanhamento de aderência da rota comercial.
        </p>
      </div>

      <section className="flex flex-col gap-3 border-b border-slate-300 pb-4 md:flex-row md:items-end">
        <div>
          <label className="text-sm font-semibold text-slate-700">Data</label>

          <input
            type="date"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
            className="mt-1 h-9 min-w-[180px] rounded border border-slate-300 bg-white px-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">
            Vendedor
          </label>

          <select
            value={vendedor}
            onChange={(e) => setVendedor(e.target.value)}
            className="mt-1 h-9 min-w-[260px] rounded border border-slate-300 bg-white px-2 text-sm text-slate-900"
          >
            <option value="TODOS">Todos os vendedores</option>

            {vendedores.map((nome, index) => (
              <option key={`${nome}-${index}`} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={carregarDados}
          disabled={loading}
          className="h-9 rounded bg-slate-100 px-4 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>

        <button className="ml-auto h-9 rounded bg-slate-100 px-4 text-sm font-medium text-slate-800 hover:bg-slate-200">
          Mostrar Legenda
        </button>
      </section>

      {erro && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <section className="rounded border border-slate-300 bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-300 px-4 py-2">
          <h2 className="text-sm font-bold text-slate-800">Resumo do dia</h2>
          <span className="text-slate-500">⌄</span>
        </div>

        <div className="overflow-x-auto bg-white p-4">
          <table className="w-full min-w-[1200px] border-collapse text-xs">
            <thead>
              <tr>
                <th
                  colSpan={2}
                  className="border border-slate-300 bg-white px-2 py-1 text-left text-green-700"
                >
                  Vendedor
                </th>

                <th
                  colSpan={5}
                  className="border border-slate-300 bg-white px-2 py-1 text-center font-bold"
                >
                  ROTA DO DIA
                </th>

                <th
                  colSpan={2}
                  className="border border-slate-300 bg-white px-2 py-1 text-center font-bold"
                >
                  FORA ROTA
                </th>

                <th
                  rowSpan={2}
                  className="border border-slate-300 bg-white px-2 py-1 text-center font-bold"
                >
                  ROTA DO DIA
                </th>
              </tr>

              <tr>
                <th className="border border-slate-300 px-2 py-1 text-left text-green-700">
                  Código
                </th>

                <th className="border border-slate-300 px-2 py-1 text-left text-green-700">
                  Nome
                </th>

                <th className="border border-slate-300 px-2 py-1 text-center text-green-700">
                  Bateria
                </th>

                <th className="border border-slate-300 px-2 py-1 text-center text-green-700">
                  Total
                </th>

                <th className="border border-slate-300 px-2 py-1 text-center text-green-700">
                  Visitados
                </th>

                <th className="border border-slate-300 px-2 py-1 text-center text-green-700">
                  Não vis.
                </th>

                <th className="border border-slate-300 px-2 py-1 text-center text-green-700">
                  (%) Pos.
                </th>

                <th className="border border-slate-300 px-2 py-1 text-center text-green-700">
                  Total
                </th>

                <th className="border border-slate-300 px-2 py-1 text-center text-green-700">
                  Pos.
                </th>
              </tr>
            </thead>

            <tbody>
              {detalheFiltrado.map((grupo, index) => {
                const resumoVend = getResumoVendedor(grupo.vendedor_nome);
                const percentual = resumoVend?.percentual ?? 0;

                const foraRota = grupo.clientes.filter(
                  (cliente) => cliente.status === "FORA_ROTA"
                ).length;

                return (
                  <tr key={`${grupo.vendedor_nome}-${index}`}>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {index + 201}
                    </td>

                    <td className="border border-slate-300 px-2 py-1">
                      {grupo.vendedor_nome}
                    </td>

                    <td className="border border-slate-300 px-2 py-1">
                      <div className="flex h-5 w-12 items-center rounded border border-black bg-white p-[2px]">
                        <div
                          className={`h-full ${getBateria(percentual)}`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </td>

                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {resumoVend?.programados ?? 0}
                    </td>

                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {resumoVend?.visitados ?? 0}
                    </td>

                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {resumoVend?.nao_visitados ?? 0}
                    </td>

                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {percentual.toFixed(2)}
                    </td>

                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {foraRota}
                    </td>

                    <td className="border border-slate-300 px-2 py-1 text-center">
                      0
                    </td>

                    <td className="border border-slate-300 px-2 py-1">
                      <div className="flex w-full gap-[1px]">
                        {grupo.clientes
                          .sort((a, b) => a.ordem_rota - b.ordem_rota)
                          .map((cliente) => (
                            <div
                              key={`${cliente.cliente_id_erp}-${cliente.ordem_rota}`}
                              title={`${cliente.ordem_rota} - ${cliente.cliente_nome}`}
                              className={`h-4 min-w-[22px] flex-1 border ${getStatusClass(
                                cliente.status
                              )}`}
                            />
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {detalheFiltrado.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="border border-slate-300 px-4 py-6 text-center text-slate-500"
                  >
                    Nenhum dado encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <ResumoCard titulo="Programados" valor={totalProgramados} />
        <ResumoCard titulo="Visitados" valor={totalVisitados} />
        <ResumoCard titulo="Não visitados" valor={totalNaoVisitados} />
        <ResumoCard titulo="Aderência" valor={`${aderencia}%`} />
      </section>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}