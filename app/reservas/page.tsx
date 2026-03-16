"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateTimeString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export default function ReservasPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!fecha) {
      setHorasDisponibles([]);
      return;
    }

    cargarDisponibilidad();
  }, [fecha]);

  async function cargarDisponibilidad() {
    try {
      const res = await fetch(`/api/disponibilidad?fecha=${fecha}`);
      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "No se pudo cargar la disponibilidad");
        return;
      }

      setHorasDisponibles(data.horasDisponibles || []);
    } catch {
      setMensaje("No se pudo cargar la disponibilidad");
    }
  }

  async function reservar() {
    setMensaje("");

    if (!name || !phone || !email || !fecha || !hora) {
      setMensaje("Completa todos los campos.");
      return;
    }

    const start = new Date(`${fecha}T${hora}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const res = await fetch("/api/reservar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone,
        email,
        start_time: toLocalDateTimeString(start),
        end_time: toLocalDateTimeString(end),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMensaje(data.error || "No se pudo reservar.");
      await cargarDisponibilidad();
      return;
    }

    setMensaje("Reserva realizada correctamente.");
    setName("");
    setPhone("");
    setEmail("");
    setHora("");
    await cargarDisponibilidad();
  }

  const horasBase = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  return (
    <main className="min-h-screen bg-blue-50 py-10">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-blue-900 mb-8">
          Reservar cita
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
          <div className="space-y-4 mb-8">
            <input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900"
            />

            <input
              type="text"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900"
            />

            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setHora("");
                setMensaje("");
              }}
              className="rounded-xl border border-blue-200 px-4 py-3 text-slate-900"
            />
          </div>

          {fecha && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4">
                Horas disponibles
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {horasBase.map((h) => {
                  const disponible = horasDisponibles.includes(h);

                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={!disponible}
                      onClick={() => {
                        if (disponible) setHora(h);
                      }}
                      className={`rounded-xl px-4 py-3 border font-medium transition ${
                        !disponible
                          ? "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed"
                          : hora === h
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-900 border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>

              {horasDisponibles.length === 0 && (
                <p className="mt-4 text-slate-600">
                  No hay horas disponibles para ese día.
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={reservar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Confirmar reserva
          </button>

          {mensaje && (
            <p className="mt-6 text-slate-700 font-medium">{mensaje}</p>
          )}
        </div>
      </div>
    </main>
  );
}
