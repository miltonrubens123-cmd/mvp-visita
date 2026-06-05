"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Pasta = {
  id: number;
  nome: string;
  dia_semana: number;
  frequencia: string;
  data_inicio: string;
  ativo: boolean;
};

type Props = {
  aberto: boolean;
  pastas: Pasta[];
  onFechar: () => void;
  onAtualizar: () => Promise<void>;
};

const diasSemana = [
  { id: 1, nome: "Segunda" },
  { id: 2, nome: "Terça" },
  { id: 3, nome: "Quarta" },
  { id: 4, nome: "Quinta" },
  { id: 5, nome: "Sexta" },
  { id: 6, nome: "Sábado" },
  { id: 7, nome: "Domingo" },
];

export default function ConsultaPastasModal({
  aberto,
  pastas,
  onFechar,
  onAtualizar,
}: Props) {
  const [pastaSelecionadaId, setPastaSelecionadaId] = useState<number | null>(
    null
  );

  const pastaSelecionada = useMemo(() => {
    return pastas.find((pasta) => pasta.id === pastaSelecionadaId) ?? null;
  }, [pastas, pastaSelecionadaId]);

  const [nome, setNome] = useState("");
  const [diaSemana, setDiaSemana] = useState(1);
  const [frequencia, setFrequencia] = useState("Semanal");
  const [dataInicio, setDataInicio] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto && pastas.length > 0 && !pastaSelecionadaId) {
      setPastaSelecionadaId(pastas[0].id);
    }
  }, [aberto, pastas, pastaSelecionadaId]);

  useEffect(() => {
    if (!pastaSelecionada) return;

    setNome(pastaSelecionada.nome ?? "");
    setDiaSemana(pastaSelecionada.dia_semana ?? 1);
    setFrequencia(pastaSelecionada.frequencia ?? "Semanal");
    setDataInicio(String(pastaSelecionada.data_inicio ?? "").substring(0, 10));
    setAtivo(Boolean(pastaSelecionada.ativo));
  }, [pastaSelecionada]);

  async function salvarAlteracoes() {
    if (!pastaSelecionada) return;

    if (!nome || !dataInicio) {
      alert("Informe nome e data de início.");
      return;
    }

    setSalvando(true);

    try {
      await api.put(`/pastas-visita/${pastaSelecionada.id}`, {
        nome,
        dia_semana: diaSemana,
        frequencia,
        data_inicio: dataInicio,
        ativo,
      });

      await onAtualizar();
      alert("Pasta atualizada com sucesso.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-6">
      <div className="mx-auto flex max-h-[92vh] max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Consulta de Pastas
            </h2>
            <p className="text-sm text-slate-500">
              Calendário operacional e edição das rotas programadas.
            </p>
          </div>

          <button
            onClick={onFechar}
            className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Fechar
          </button>
        </div>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-4">
          <aside className="overflow-auto border-r border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-700">
              Pastas cadastradas
            </h3>

            <div className="space-y-2">
              {pastas.map((pasta) => (
                <button
                  key={pasta.id}
                  onClick={() => setPastaSelecionadaId(pasta.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${
                    pasta.id === pastaSelecionadaId
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-slate-900">
                    {pasta.nome}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Dia {pasta.dia_semana} · {pasta.frequencia}
                  </div>

                  <div className="mt-1 text-xs">
                    {pasta.ativo ? (
                      <span className="text-green-700">Ativa</span>
                    ) : (
                      <span className="text-red-600">Inativa</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="overflow-auto p-5 lg:col-span-3">
            {pastaSelecionada ? (
              <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    Editar pasta
                  </h3>

                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm text-slate-600">
                        Nome
                      </label>

                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                        {diasSemana.map((dia) => (
                          <option key={dia.id} value={dia.id}>
                            {dia.nome}
                          </option>
                        ))}
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
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(e) => setAtivo(e.target.checked)}
                      />
                      Pasta ativa
                    </label>

                    <button
                      onClick={salvarAlteracoes}
                      disabled={salvando}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {salvando ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    Mapa semanal de pastas
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
                    {diasSemana.map((dia) => {
                      const pastasDoDia = pastas.filter(
                        (pasta) => pasta.dia_semana === dia.id
                      );

                      return (
                        <div
                          key={dia.id}
                          className="min-h-[160px] rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="mb-3 text-sm font-bold text-slate-700">
                            {dia.nome}
                          </div>

                          <div className="space-y-2">
                            {pastasDoDia.map((pasta) => (
                              <button
                                key={pasta.id}
                                onClick={() => setPastaSelecionadaId(pasta.id)}
                                className={`w-full rounded border px-2 py-2 text-left text-xs ${
                                  pasta.id === pastaSelecionadaId
                                    ? "border-blue-500 bg-blue-100 text-blue-900"
                                    : pasta.ativo
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                    : "border-slate-200 bg-white text-slate-400"
                                }`}
                              >
                                <div className="font-semibold">
                                  {pasta.nome}
                                </div>
                                <div>{pasta.frequencia}</div>
                              </button>
                            ))}

                            {pastasDoDia.length === 0 && (
                              <div className="text-xs text-slate-400">
                                Sem pasta
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Nenhuma pasta cadastrada.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}