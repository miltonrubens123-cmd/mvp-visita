"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const VisitMapClient = dynamic(() => import("@/components/VisitMapClient"), {
  ssr: false,
});

type DashboardData = {
  total_visitas: number;
  total_vendedores: number;
  total_clientes: number;
  vendas_efetivadas: number;
};

type Vendedor = {
  vendedor_id?: number;
  vendedor_nome: string;
};

type VisitaMapa = {
  id_visita_erp?: number | null;
  cliente_id_erp?: number | null;
  cliente_nome: string;
  cliente_nome_fantasia?: string | null;
  vendedor_id?: number | null;
  vendedor_nome: string;
  tipo_visita?: string | null;
  motivo_visita?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  latitude: number;
  longitude: number;
  data_visita?: string | null;
  hora_visita?: string | null;
  observacao?: string | null;
  venda_efetivada?: boolean | null;
};

type StatusCarga = {
  id?: number;
  inicio_execucao?: string;
  fim_execucao?: string;
  registros_processados?: number;
  status?: string;
  mensagem?: string;
};

export default function MonitoramentoClient() {
  const hoje = new Date().toISOString().split("T")[0];

  const [dataFiltro, setDataFiltro] = useState(hoje);
  const [vendedorId, setVendedorId] = useState<string>("TODOS");

  const [dashboard, setDashboard] = useState<DashboardData>({
    total_visitas: 0,
    total_vendedores: 0,
    total_clientes: 0,
    vendas_efetivadas: 0,
  });

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [visitasMapa, setVisitasMapa] = useState<VisitaMapa[]>([]);
  const [statusCarga, setStatusCarga] = useState<StatusCarga | null>(null);

  const [loading, setLoading] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>("");
  const [erro, setErro] = useState<string>("");

  function formatarDataHora(valor?: string) {
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

  async function carregarDados() {
    setLoading(true);
    setErro("");

    try {
      const params: Record<string, string> = {
        data: dataFiltro,
      };

      if (vendedorId !== "TODOS") {
        params.vendedor = vendedorId;
      }

      const [
        dashboardResponse,
        vendedoresResponse,
        mapaResponse,
        cargaResponse,
      ] = await Promise.all([
        api.get("/dashboard", { params }),
        api.get("/vendedores-visitas", { params }),
        api.get("/mapa-visitas", { params }),
        api.get("/status-carga"),
      ]);

      setDashboard({
        total_visitas:
          dashboardResponse.data.total_visitas ??
          dashboardResponse.data.visitas ??
          0,
        total_vendedores:
          dashboardResponse.data.total_vendedores ??
          dashboardResponse.data.vendedores ??
          0,
        total_clientes:
          dashboardResponse.data.total_clientes ??
          dashboardResponse.data.clientes ??
          0,
        vendas_efetivadas:
          dashboardResponse.data.vendas_efetivadas ??
          dashboardResponse.data.vendas ??
          0,
      });

      setVendedores(vendedoresResponse.data ?? []);

      setVisitasMapa(
        (mapaResponse.data ?? []).map((item: any) => ({
          id_visita_erp: item.id_visita_erp,

          cliente_id_erp: item.id_cliente_erp,
          cliente_nome:
            item.cliente_nome_fantasia ??
            item.cliente_nome ??
            "Cliente sem nome",
          cliente_nome_fantasia: item.cliente_nome_fantasia,

          vendedor_id: item.id_vendedor_erp,
          vendedor_nome: item.vendedor_nome,

          tipo_visita: item.tipo_visita,
          observacao: item.observacao,
          venda_efetivada: item.venda_efetivada,

          latitude: item.latitude,
          longitude: item.longitude,

          data_visita:
            item.data_visita ??
            item.data_hora_visita?.split("T")[0] ??
            null,

          hora_visita:
            item.hora_visita ??
            item.data_hora_visita?.split("T")[1]?.substring(0, 5) ??
            null,
        }))
      );

      setStatusCarga(cargaResponse.data ?? null);

      setUltimaAtualizacao(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      console.error("Erro ao carregar monitoramento:", error);
      setErro("Não foi possível carregar os dados do monitoramento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Monitoramento</h1>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhamento operacional das visitas em campo.
          </p>

          {statusCarga && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Última carga
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatarDataHora(statusCarga.fim_execucao)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Status
                  </p>

                  <p
                    className={`mt-1 font-semibold ${
                      statusCarga.status === "SUCESSO"
                        ? "text-green-600"
                        : statusCarga.status === "ERRO"
                        ? "text-red-600"
                        : "text-slate-700"
                    }`}
                  >
                    {statusCarga.status ?? "SEM STATUS"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Registros
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {Number(
                      statusCarga.registros_processados ?? 0
                    ).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Mensagem
                  </p>

                  <p className="mt-1 truncate font-semibold text-slate-900">
                    {statusCarga.mensagem ?? "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-600">Data</label>

              <input
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">
                Vendedor
              </label>

              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="TODOS">Todos os vendedores</option>

                {vendedores.map((vendedor, index) => (
                  <option
                    key={`${vendedor.vendedor_id ?? vendedor.vendedor_nome}-${index}`}
                    value={
                      vendedor.vendedor_id
                        ? String(vendedor.vendedor_id)
                        : vendedor.vendedor_nome
                    }
                  >
                    {vendedor.vendedor_nome}
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

          {erro && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card titulo="Visitas Realizadas" valor={dashboard.total_visitas} />
          <Card titulo="Clientes Visitados" valor={dashboard.total_clientes} />
          <Card titulo="Equipe Ativa" valor={dashboard.total_vendedores} />
          <Card titulo="Vendas Efetivadas" valor={dashboard.vendas_efetivadas} />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Mapa de Visitas
              </h2>

              <p className="text-sm text-slate-500">
                {vendedorId === "TODOS"
                  ? "Exibindo marcadores de todos os vendedores."
                  : "Exibindo rota do vendedor selecionado."}
              </p>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p>Atualização da tela</p>

              <p className="font-semibold text-slate-700">
                {ultimaAtualizacao || "--:--"}
              </p>
            </div>
          </div>

          <div className="h-[620px]">
            <VisitMapClient
              visitas={visitasMapa}
              mostrarRota={vendedorId !== "TODOS"}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}