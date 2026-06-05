"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import ConsultaPastasModal from "@/components/ConsultaPastasModal";
import {
  getPastasVisita,
  criarPastaVisita,
  getProgramacaoCliente,
} from "@/lib/api";

type Pasta = {
  id: number;
  nome: string;
  dia_semana: number;
  frequencia: string;
  data_inicio: string;
  ativo: boolean;
};

type Programacao = {
  id: number;
  pasta_id: number;
  pasta_nome: string;
  cliente_id_erp: number;
  cliente_nome: string;
  vendedor_id_erp: number;
  vendedor_nome: string;
  ordem_rota: number;
  ativo: boolean;
};

type Cliente = {
  id: number;
  codigo_erp: number;
  razao_social: string;
  cidade?: string;
  uf?: string;
};

type Vendedor = {
  id: number;
  codigo_erp: number;
  nome: string;
  supervisor?: string;
  ativo: boolean;
};

export default function ProgramacaoClient() {
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [programacao, setProgramacao] = useState<Programacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  const [nome, setNome] = useState("");
  const [diaSemana, setDiaSemana] = useState(1);
  const [frequencia, setFrequencia] = useState("Semanal");
  const [dataInicio, setDataInicio] = useState("");

  const [pastaSelecionada, setPastaSelecionada] = useState<string>("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [vendedorSelecionado, setVendedorSelecionado] = useState<string>("");
  const [ordemRota, setOrdemRota] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [modalPastasAberto, setModalPastasAberto] = useState(false);

  async function carregarDados() {
    setLoading(true);

    try {
      const [pastasData, programacaoData, clientesRes, vendedoresRes] =
        await Promise.all([
          getPastasVisita(),
          getProgramacaoCliente(),
          api.get("/clientes"),
          api.get("/vendedores"),
        ]);

      setPastas(pastasData ?? []);
      setProgramacao(programacaoData ?? []);
      setClientes(clientesRes.data ?? []);
      setVendedores(vendedoresRes.data ?? []);

      if (!pastaSelecionada && pastasData?.length > 0) {
        setPastaSelecionada(String(pastasData[0].id));
      }
    } finally {
      setLoading(false);
    }
  }

  async function salvarPasta() {
    if (!nome || !dataInicio) {
      alert("Informe nome e data de início.");
      return;
    }

    await criarPastaVisita({
      nome,
      dia_semana: diaSemana,
      frequencia,
      data_inicio: dataInicio,
      ativo: true,
    });

    setNome("");
    setDiaSemana(1);
    setFrequencia("Semanal");
    setDataInicio("");

    await carregarDados();
  }

  async function adicionarClienteNaProgramacao() {
    if (!pastaSelecionada) {
      alert("Selecione uma pasta.");
      return;
    }

    if (!clienteSelecionado) {
      alert("Selecione um cliente.");
      return;
    }

    if (!vendedorSelecionado) {
      alert("Selecione um vendedor.");
      return;
    }

    const vendedorObj = vendedores.find(
      (vendedor) => String(vendedor.codigo_erp) === vendedorSelecionado
    );

    if (!vendedorObj) {
      alert("Vendedor inválido.");
      return;
    }

    await api.post("/programacao-cliente", {
      pasta_id: Number(pastaSelecionada),
      cliente_id_erp: clienteSelecionado.codigo_erp,
      cliente_nome: clienteSelecionado.razao_social,
      vendedor_id_erp: vendedorObj.codigo_erp,
      vendedor_nome: vendedorObj.nome,
      ordem_rota: ordemRota,
      ativo: true,
    });

    setBuscaCliente("");
    setClienteSelecionado(null);
    setOrdemRota(ordemRota + 1);

    await carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();

    if (!termo) return [];

    return clientes
      .filter((cliente) => {
        const nomeCliente = cliente.razao_social?.toLowerCase() ?? "";
        const codigoCliente = String(cliente.codigo_erp ?? "");

        return nomeCliente.includes(termo) || codigoCliente.includes(termo);
      })
      .slice(0, 10);
  }, [clientes, buscaCliente]);

  const programacaoFiltrada = useMemo(() => {
    if (!pastaSelecionada) return programacao;

    return programacao
      .filter((item) => String(item.pasta_id) === pastaSelecionada)
      .sort((a, b) => (a.ordem_rota ?? 0) - (b.ordem_rota ?? 0));
  }, [programacao, pastaSelecionada]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Programação de Visitas
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Cadastro de pastas, vinculação de clientes e organização da rota.
          </p>
        </div>

        <button
          onClick={() => setModalPastasAberto(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Consultar Pastas
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Nova Pasta
        </h2>

        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Nome</label>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ex: Segunda Santarém"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Dia da semana
            </label>

            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value={1}>Segunda-feira</option>
              <option value={2}>Terça-feira</option>
              <option value={3}>Quarta-feira</option>
              <option value={4}>Quinta-feira</option>
              <option value={5}>Sexta-feira</option>
              <option value={6}>Sábado</option>
              <option value={7}>Domingo</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Frequência
            </label>

            <select
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option>Semanal</option>
              <option>Quinzenal</option>
              <option>Mensal</option>
              <option>Sazonal</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Data início
            </label>

            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={salvarPasta}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Salvar Pasta
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Adicionar Cliente à Rota
        </h2>

        <div className="grid gap-4 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Pasta</label>

            <select
              value={pastaSelecionada}
              onChange={(e) => setPastaSelecionada(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione uma pasta</option>

              {pastas.map((pasta) => (
                <option key={pasta.id} value={pasta.id}>
                  {pasta.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="relative lg:col-span-2">
            <label className="mb-1 block text-sm text-slate-600">
              Buscar cliente ERP
            </label>

            <input
              value={
                clienteSelecionado
                  ? clienteSelecionado.razao_social
                  : buscaCliente
              }
              onChange={(e) => {
                setClienteSelecionado(null);
                setBuscaCliente(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Digite nome ou código do cliente"
            />

            {clientesFiltrados.length > 0 && !clienteSelecionado && (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {clientesFiltrados.map((cliente) => (
                  <button
                    key={cliente.codigo_erp}
                    onClick={() => {
                      setClienteSelecionado(cliente);
                      setBuscaCliente(cliente.razao_social);
                    }}
                    className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <div className="font-medium text-slate-900">
                      {cliente.razao_social}
                    </div>

                    <div className="text-xs text-slate-500">
                      ERP {cliente.codigo_erp} · {cliente.cidade ?? ""}{" "}
                      {cliente.uf ?? ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Vendedor
            </label>

            <select
              value={vendedorSelecionado}
              onChange={(e) => setVendedorSelecionado(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>

              {vendedores
                .filter((vendedor) => vendedor.ativo)
                .map((vendedor) => (
                  <option key={vendedor.codigo_erp} value={vendedor.codigo_erp}>
                    {vendedor.nome}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Ordem</label>

            <div className="flex gap-2">
              <input
                type="number"
                value={ordemRota}
                onChange={(e) => setOrdemRota(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <button
                onClick={adicionarClienteNaProgramacao}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Pastas Cadastradas
          </h2>

          <div className="space-y-3">
            {pastas.map((pasta) => (
              <button
                key={pasta.id}
                onClick={() => setPastaSelecionada(String(pasta.id))}
                className={`block w-full rounded-lg border p-3 text-left text-sm ${
                  String(pasta.id) === pastaSelecionada
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold text-slate-900">
                  {pasta.nome}
                </div>

                <div className="text-slate-500">
                  Dia {pasta.dia_semana} · {pasta.frequencia} · início{" "}
                  {pasta.data_inicio}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Clientes da Rota
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-2">Ordem</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Pasta</th>
                </tr>
              </thead>

              <tbody>
                {programacaoFiltrada.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.ordem_rota}</td>
                    <td>{item.cliente_nome}</td>
                    <td>{item.vendedor_nome}</td>
                    <td>{item.pasta_nome}</td>
                  </tr>
                ))}

                {programacaoFiltrada.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-sm text-slate-500"
                    >
                      Nenhum cliente programado para a pasta selecionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConsultaPastasModal
        aberto={modalPastasAberto}
        pastas={pastas}
        onFechar={() => setModalPastasAberto(false)}
        onAtualizar={carregarDados}
      />
    </div>
  );
}