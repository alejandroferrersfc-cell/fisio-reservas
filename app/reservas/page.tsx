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
  const [error, setError] = useState("");

  const horasBase = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
  ];

  useEffect(() => {
    if (!fecha) return;

    cargarDisponibilidad();
  }, [fecha]);

  async function cargarDisponibilidad() {
    try {
      const res = await fetch(`/api/disponibilidad?fecha=${fecha}`);
      const data = await res.json();

      if (!data.ok) {
        setError("No se pudo cargar la disponibilidad");
        return;
      }

      setHorasDisponibles(data.horasDisponibles || []);
    } catch {
      setError("Error al cargar disponibilidad");
    }
  }

  async function reservar() {
    setError("");
    setMensaje("");

    if (!name || !phone || !email || !fecha || !hora) {
      setError("Debes rellenar todos los campos.");
      return;
    }

    const start = new Date(`${fecha}T${hora}`);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    try {
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
        setError(data.error || "Error al procesar la reserva");
        return;
      }

      setMensaje("Reserva realizada correctamente.");

      setName("");
      setPhone("");
      setEmail("");
      setFecha("");
      setHora("");

      setHorasDisponibles([]);
    } catch {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <main className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl border border-blue-100">

        <h1 className="text-3xl font-bold text-blue-900 mb-6">
          Reservar cita
        </h1>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="tel"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900"
          />

        </div>

        {fecha && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Horas disponibles
            </h2>

            <div className="grid grid-cols-3 gap-3">

              {horasBase.map((h) => {
                const disponible = horasDisponibles.includes(h);

                return (
                  <button
                    key={h}
                    disabled={!disponible}
                    onClick={() => setHora(h)}
                    className={`py-3 rounded-xl border font-medium transition
                      ${
                        hora === h
                          ? "bg-blue-600 text-white border-blue-600"
                          : disponible
                          ? "bg-white border-blue-200 hover:bg-blue-50"
                          : "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                      }
                    `}
                  >
                    {h}
                  </button>
                );
              })}

            </div>
          </div>
        )}

        <button
          onClick={reservar}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
        >
          Confirmar reserva
        </button>

        {mensaje && (
          <p className="mt-4 text-green-700 font-medium">
            {mensaje}
          </p>
        )}

        {error && (
          <p className="mt-4 text-red-600 font-medium">
            {error}
          </p>
        )}

      </div>
    </main>
  );
}
