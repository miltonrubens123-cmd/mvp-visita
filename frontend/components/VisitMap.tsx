"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type VisitaMapa = {
  id_visita_erp: number;
  cliente_nome_fantasia: string;
  vendedor_nome: string;
  latitude: number;
  longitude: number;
  data_hora_visita: string;
  tipo_visita: string;
};

type Props = {
  visitas: VisitaMapa[];
};

export default function VisitMap({ visitas }: Props) {
  if (!visitas.length) {
    return (
      <div className="rounded-xl border bg-white p-6">
        Nenhuma visita encontrada.
      </div>
    );
  }

  const centro = [
    visitas[0].latitude,
    visitas[0].longitude,
  ] as [number, number];

  const rota = visitas
    .sort(
        (a, b) =>
            new Date(a.data_hora_visita).getTime() -
            new Date(b.data_hora_visita).getTime()
        )
    .map((v) => [v.latitude, v.longitude] as [number, number]);

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <MapContainer
        center={centro}
        zoom={12}
        style={{ height: "650px", width: "100%" }}
      >
        <TileLayer
          attribution="OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={rota} />

        {visitas.map((visita) => (
          <Marker
            key={visita.id_visita_erp}
            position={[visita.latitude, visita.longitude]}
          >
            <Popup>
              <div>
                <strong>{visita.cliente_nome_fantasia}</strong>

                <br />

                {visita.vendedor_nome}

                <br />

                {visita.tipo_visita}

                <br />

                {visita.data_hora_visita}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}