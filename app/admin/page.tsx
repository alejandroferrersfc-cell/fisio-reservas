"use client";

import { useEffect, useMemo, useState } from "react";

type Cita = {
  id: string;
  name: string;
  phone: string;
  start_time: string;
  status?: string;
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
  const [filtroFecha, setFiltroFecha] = useState("");

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    await Promise.all([cargarCitas(), cargarBloqueos()]);
  }

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

  async function cancelarCita(id: string) {
    const confirmar = confirm("¿Seguro que quieres cancelar esta cita?");
    if (!confirmar) return;

    const res = await fetch("/api/cancelar-cita", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "No se pudo cancelar la cita");
      return;
    }

    await cargarCitas();
  }

  async function eliminarBloqueo(id: string) {
    const confirmar = confirm("¿Seguro que quieres eliminar este bloqueo?");
    if (!confirmar) return;

    const res = await fetch("/api/eliminar-bloqueo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "No se pudo eliminar el bloqueo");
      return;
    }

    await cargarBloqueos();
  }

  async function cerrarSesion() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
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

  const citasFiltradas = useMemo(() => {
    if (!filtroFecha) return citas;

    return citas.filter((c) => {
      const fechaCita = new Date(c.start_time);
      const yyyy = fechaCita.getFullYear();
      const mm = String(fechaCita.getMonth() + 1).padStart(2, "0");
      const dd = String(fechaCita.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}` === filtroFecha;
    });
  }, [citas, filtroFecha]);

  const citasHoy = useMemo(() => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    const hoyStr = `${yyyy}-${mm}-${dd}`;

    return citas.filter((c) => {
      const fechaCita = new Date(c.start_time);
      const y = fechaCita.getFullYear();
      const m = String(fechaCita.getMonth() + 1).padStart(2, "0");
      const d = String(fechaCita.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}` === hoyStr && c.status === "confirmed";
    }).length;
  }, [citas]);

  return (
    <main className="min-h-screen bg-blue-50 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold text-blue-900">
            Panel del fisioterapeuta
          </h1>

          <button
            type="button"
            onClick={cerrarSesion}
            className="bg-white border border-blue-200 text-blue-900 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <p className="text-sm text-slate-500">Citas confirmadas hoy</p>
            <p className="text-4xl font-bold text-blue-900 mt-2">{citasHoy}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <p className="text-sm text-slate-500">Total de bloqueos</p>
            <p className="text-4xl font-bold text-blue-900 mt-2">{bloqueos.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <p className="text-sm text-slate-500">Total de citas</p>
            <p className="text-4xl font-bold text-blue-900 mt-2">{citas.length}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-5">
              Bloquear días y horas
            </h2>

            <div className="space-y-4">
              <input
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="datetime-local"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="text"
                placeholder="Motivo del bloqueo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={bloquearRango}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
              >
                Guardar bloqueo
              </button>

              {mensaje && <p className="text-blue-800 font-medium">{mensaje}</p>}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-5">
              Bloqueos guardados
            </h2>

            <div className="space-y-4 max-h-[420px] overflow-auto">
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
                  <p className="text-slate-700 mb-3">
                    Hasta: {formatearFecha(b.end_time)}
                  </p>

                  <button
                    type="button"
                    onClick={() => eliminarBloqueo(b.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Eliminar bloqueo
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <h2 className="text-2xl font-semibold text-blue-900">
              Citas
            </h2>

            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="rounded-xl border border-blue-200 px-4 py-3 text-slate-900"
            />
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-blue-100">
                <tr className="text-left">
                  <th className="pb-4 text-blue-900">Hora</th>
                  <th className="pb-4 text-blue-900">Paciente</th>
                  <th className="pb-4 text-blue-900">Teléfono</th>
                  <th className="pb-4 text-blue-900">Estado</th>
                  <th className="pb-4 text-blue-900">Acción</th>
                </tr>
              </thead>

              <tbody>
                {citasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-slate-500">
                      No hay citas para mostrar
                    </td>
                  </tr>
                )}

                {citasFiltradas.map((c) => (
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
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          c.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {c.status === "cancelled" ? "Cancelada" : "Confirmada"}
                      </span>
                    </td>
                    <td className="py-4">
                      {c.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => cancelarCita(c.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                        >
                          Cancelar cita
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
