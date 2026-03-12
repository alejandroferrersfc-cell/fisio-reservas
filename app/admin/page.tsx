"use client";

import { useEffect, useState } from "react";

type Cita = {
  id: string;
  name: string;
  phone: string;
  start_time: string;
};

type Bloqueo = {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function inputToLocalDateTimeString(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export default function AdminPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);

  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarCitas();
    cargarBloqueos();
  }, []);

  async function cargarCitas() {
    const res = await fetch("/api/citas");
    const data = await res.json();
    setCitas(Array.isArray(data) ? data : []);
  }

  async function cargarBloqueos() {
    const res = await fetch("/api/disponibilidad");
    const data = await res.json();
    setBloqueos(data.bloqueos || []);
  }

  async function bloquearRango() {
    setMensaje("");

    if (!inicio || !fin) {
      setMensaje("Debes indicar inicio y fin del bloqueo.");
      return;
    }

    const res = await fetch("/api/bloquear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_time: inputToLocalDateTimeString(inicio),
    end_time: inputToLocalDateTimeString(fin),
        reason: motivo,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMensaje(data.error || "No se pudo guardar el bloqueo.");
      return;
    }

    setMensaje("Bloqueo guardado correctamente.");
    setInicio("");
    setFin("");
    setMotivo("");
    await cargarBloqueos();
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-blue-50 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-blue-900 mb-8">
          Panel del fisioterapeuta
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-5">
              Bloquear días y horas
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-blue-900">
                  Inicio
                </label>
                <input
                  type="datetime-local"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-blue-900">
                  Fin
                </label>
                <input
                  type="datetime-local"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-blue-900">
                  Motivo
                </label>
                <input
                  type="text"
                  placeholder="Ej: vacaciones, descanso, congreso..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={bloquearRango}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
              >
                Guardar bloqueo
              </button>

              {mensaje && (
                <p className="text-blue-800 font-medium">{mensaje}</p>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">
              <p className="font-semibold mb-2">Ejemplo vacaciones:</p>
              <p>Inicio: 2026-08-15 00:00</p>
              <p>Fin: 2026-09-01 00:00</p>
              <p className="mt-2">
                Así se bloquea del 15 al 31 de agosto completo.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-5">
              Bloqueos guardados
            </h2>

            <div className="space-y-4">
              {bloqueos.length === 0 && (
                <p className="text-slate-500">No hay bloqueos todavía.</p>
              )}

              {bloqueos.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-blue-100 bg-blue-50 p-4"
                >
                  <p className="font-semibold text-blue-900">
                    {b.reason || "Bloqueo sin motivo"}
                  </p>
                  <p className="text-slate-700">
                    Desde: {formatearFecha(b.start_time)}
                  </p>
                  <p className="text-slate-700">
                    Hasta: {formatearFecha(b.end_time)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          <h2 className="text-2xl font-semibold text-blue-900 mb-5">
            Citas reservadas
          </h2>

          <table className="w-full">
            <thead className="border-b border-blue-100">
              <tr className="text-left">
                <th className="pb-4 text-blue-900">Hora</th>
                <th className="pb-4 text-blue-900">Paciente</th>
                <th className="pb-4 text-blue-900">Teléfono</th>
              </tr>
            </thead>

            <tbody>
              {citas.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-slate-500">
                    No hay citas todavía
                  </td>
                </tr>
              )}

              {citas.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 hover:bg-blue-50"
                >
                  <td className="py-4 text-slate-800">
                    {formatearFecha(c.start_time)}
                  </td>
                  <td className="py-4 font-medium text-slate-900">
                    {c.name}
                  </td>
                  <td className="py-4 text-slate-700">
                    {c.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}