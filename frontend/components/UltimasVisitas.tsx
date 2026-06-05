type Props = {
  visitas: any[];
};

export default function UltimasVisitas({
  visitas,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">
        Últimas Visitas
      </h2>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Data</th>
            <th className="text-left">Vendedor</th>
            <th className="text-left">Cliente</th>
            <th className="text-left">Tipo</th>
          </tr>
        </thead>

        <tbody>
          {visitas.map((v, i) => (
            <tr key={i}>
              <td>{v.data_hora_visita}</td>
              <td>{v.vendedor_nome}</td>
              <td>{v.cliente_nome_fantasia}</td>
              <td>{v.tipo_visita}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}