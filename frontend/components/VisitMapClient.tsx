"use client";

import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

type Props = {
  visitas: VisitaMapa[];
  mostrarRota?: boolean;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function VisitMapClient({
  visitas,
  mostrarRota = false,
}: Props) {
  const visitasValidas = visitas.filter(
    (visita) =>
      visita.latitude !== null &&
      visita.longitude !== null &&
      !Number.isNaN(Number(visita.latitude)) &&
      !Number.isNaN(Number(visita.longitude))
  );

  const centro: [number, number] =
    visitasValidas.length > 0
      ? [
          Number(visitasValidas[0].latitude),
          Number(visitasValidas[0].longitude),
        ]
      : [-2.43849, -54.69961];

  const positions: [number, number][] = visitasValidas.map((visita) => [
    Number(visita.latitude),
    Number(visita.longitude),
  ]);

  return (
    <MapContainer
      center={centro}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {mostrarRota && positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{
            weight: 4,
          }}
        />
      )}

      {visitasValidas.map((visita, index) => (
        <Marker
          key={`${visita.id_visita_erp ?? index}-${
            visita.cliente_id_erp ?? index
          }`}
          position={[Number(visita.latitude), Number(visita.longitude)]}
        >
          <Popup>
            <div className="min-w-[280px] space-y-2 text-sm">
              <div>
                <p className="font-bold text-slate-900">
                  {visita.cliente_nome ||
                    visita.cliente_nome_fantasia ||
                    "Cliente sem nome"}
                </p>

                {visita.cliente_id_erp && (
                  <p className="text-xs text-slate-500">
                    Código ERP: {visita.cliente_id_erp}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p>
                  <strong>Vendedor:</strong> {visita.vendedor_nome}
                </p>

                {visita.tipo_visita && (
                  <p>
                    <strong>Tipo:</strong> {visita.tipo_visita}
                  </p>
                )}

                {visita.motivo_visita && (
                  <p>
                    <strong>Motivo:</strong> {visita.motivo_visita}
                  </p>
                )}

                {(visita.data_visita || visita.hora_visita) && (
                  <p>
                    <strong>Data/Hora:</strong>{" "}
                    {visita.data_visita ?? ""} {visita.hora_visita ?? ""}
                  </p>
                )}

                {visita.observacao && (
                  <p>
                    <strong>Observação:</strong> {visita.observacao}
                  </p>
                )}

                <p>
                  <strong>Venda:</strong>{" "}
                  {visita.venda_efetivada ? "Efetivada" : "Não efetivada"}
                </p>
              </div>

              {(visita.endereco || visita.bairro || visita.cidade) && (
                <div className="border-t border-slate-200 pt-2">
                  <p className="font-semibold">Endereço</p>

                  {visita.endereco && <p>{visita.endereco}</p>}

                  {(visita.bairro || visita.cidade) && (
                    <p className="text-slate-600">
                      {[visita.bairro, visita.cidade]
                        .filter(Boolean)
                        .join(" - ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}