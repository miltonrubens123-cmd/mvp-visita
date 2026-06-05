type Props = {
  titulo: string;
  valor: string | number;
};

export default function DashboardCard({
  titulo,
  valor,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border">
      <div className="text-sm text-slate-600">
        {titulo}
      </div>

      <div className="mt-1 text-2xl font-bold">
        {valor}
      </div>
    </div>
  );
}