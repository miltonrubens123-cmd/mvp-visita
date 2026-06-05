import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});
export async function getDashboard(dataFiltro?: string) {
  const { data } = await api.get("/dashboard", {
    params: { data: dataFiltro },
  });
  return data;
}

export async function getVisitas() {
  const { data } = await api.get("/visitas");
  return data;
}

export async function getDatasVisitas() {
  const { data } = await api.get("/datas-visitas");
  return data;
}

export async function getVendedoresVisitas(dataFiltro?: string) {
  const { data } = await api.get("/vendedores-visitas", {
    params: { data: dataFiltro },
  });
  return data;
}

export async function getMapaVisitas(dataFiltro?: string, vendedor?: string) {
  const { data } = await api.get("/mapa-visitas", {
    params: {
      data: dataFiltro,
      vendedor: vendedor && vendedor !== "Todos" ? vendedor : undefined,
    },
  });
  return data;
}

export async function getRanking(dataFiltro?: string) {
  const { data } = await api.get("/ranking", {
    params: { data: dataFiltro },
  });
  return data;
}

export async function getUltimasVisitas(dataFiltro?: string) {
  const { data } = await api.get("/ultimas-visitas", {
    params: { data: dataFiltro },
  });
  return data;
}

export async function getPlanejadoRealizado(dataFiltro: string) {
  const { data } = await api.get("/planejado-realizado", {
    params: { data: dataFiltro },
  });
  return data;
}

export async function getPlanejadoRealizadoDetalhe(dataFiltro: string) {
  const { data } = await api.get("/planejado-realizado-detalhe", {
    params: { data: dataFiltro },
  });
  return data;
}

export async function getPastasVisita() {
  const { data } = await api.get("/pastas-visita");
  return data;
}

export async function criarPastaVisita(payload: {
  nome: string;
  dia_semana: number;
  frequencia: string;
  data_inicio: string;
  ativo: boolean;
}) {
  const { data } = await api.post("/pastas-visita", payload);
  return data;
}

export async function getProgramacaoCliente() {
  const { data } = await api.get("/programacao-cliente");
  return data;
}

export async function criarProgramacaoCliente(payload: {
  pasta_id: number;
  cliente_id_erp: number;
  cliente_nome: string;
  vendedor_id_erp: number;
  vendedor_nome: string;
  ordem_rota?: number;
  ativo: boolean;
}) {
  const { data } = await api.post("/programacao-cliente", payload);
  return data;
}