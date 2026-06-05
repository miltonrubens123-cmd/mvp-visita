type Props = {
  ranking: any[];
};

export default function RankingPanel({ ranking }: Props) {
  const maximo =
    ranking.length > 0
      ? Math.max(...ranking.map((x) => x.total_visitas))
      : 0;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">
        Ranking de Vendedores
      </h2>

      <div className="space-y-4">
        {ranking.map((item, index) => {
          const percentual =
            maximo > 0
              ? (item.total_visitas / maximo) * 100
              : 0;

          return (
            <div key={item.vendedor_nome}>
              <div className="mb-1 flex justify-between text-sm">
                <span>
                  {index + 1}º {item.vendedor_nome}
                </span>

                <strong>
                  {item.total_visitas}
                </strong>
              </div>

              <div className="h-2 rounded bg-slate-200">
                <div
                  className="h-2 rounded bg-blue-600"
                  style={{
                    width: `${percentual}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}