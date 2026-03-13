"use client";

import { useEffect, useMemo, useState } from "react";

type Reserva = {
  id: string;
  name: string;
  phone: string;
  start_time: string;
  end_time: string;
};

type Bloqueo = {
  id: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateTimeString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function parseLocalDateTime(value?: string) {
  if (!value) return new Date("Invalid Date");

  const normalizado = value.replace("T", " ").replace("Z", "");
  const [datePart, timePart = "00:00:00"] = normalizado.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second);
}

export default function ReservasPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDisponibilidad();
  }, []);

  async function cargarDisponibilidad() {
    try {
      const res = await fetch("/api/disponibilidad");
      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "No se pudo cargar la disponibilidad");
        return;
      }

      setReservas(data.reservas || []);
      setBloqueos(data.bloqueos || []);
    } catch {
      setMensaje("No se pudo cargar la disponibilidad");
    }
  }

  const horas = useMemo(() => {
    if (!fecha) return [];

    const lista: string[] = [];
    for (let h = 9; h < 14; h++) {
      lista.push(`${String(h).padStart(2, "0")}:00`);
    }
    for (let h = 16; h < 20; h++) {
      lista.push(`${String(h).padStart(2, "0")}:00`);
    }
    return lista;
  }, [fecha]);

  function obtenerBloqueoDeHora(h: string) {
    const inicio = new Date(`${fecha}T${h}:00`);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);

    const bloqueo = bloqueos.find((b) => {
      if (!b.start_time || !b.end_time) return false;

      const inicioBloqueo = parseLocalDateTime(b.start_time).getTime();
      const finBloqueo = parseLocalDateTime(b.end_time).getTime();

      return inicio.getTime() < finBloqueo && fin.getTime() > inicioBloqueo;
    });

    return bloqueo || null;
  }

  function estaOcupada(h: string) {
    const inicio = new Date(`${fecha}T${h}:00`);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);

    const reservada = reservas.some((r) => {
      if (!r.start_time) return false;
      return parseLocalDateTime(r.start_time).getTime() === inicio.getTime();
    });

    const bloqueo = bloqueos.find((b) => {
      if (!b.start_time || !b.end_time) return false;

      const inicioBloqueo = parseLocalDateTime(b.start_time).getTime();
      const finBloqueo = parseLocalDateTime(b.end_time).getTime();

      return inicio.getTime() < finBloqueo && fin.getTime() > inicioBloqueo;
    });

    return reservada || !!bloqueo;
  }

  async function reservar() {
    setMensaje("");

    if (!name || !phone || !email || !fecha || !hora) {
      setMensaje("Completa todos los campos.");
      return;
    }

    const bloqueo = obtenerBloqueoDeHora(hora);
    if (bloqueo) {
      setMensaje(
        `No disponible: ${bloqueo.reason || "bloqueado por el fisioterapeuta"}`
      );
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
              className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="text"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setHora("");
                setMensaje("");
              }}
              className="rounded-xl border border-blue-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {fecha && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4">
                Horas disponibles
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {horas.map((h) => {
                  const ocupada = estaOcupada(h);
                  const bloqueo = obtenerBloqueoDeHora(h);
                  const motivoBloqueo = bloqueo?.reason || "No disponible";

                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={ocupada}
                      onClick={() => {
                        if (!ocupada) setHora(h);
                      }}
                      title={
                        bloqueo
                          ? motivoBloqueo
                          : ocupada
                          ? "Hora ocupada"
                          : "Disponible"
                      }
                      className={`rounded-xl px-4 py-3 border font-medium transition ${
                        bloqueo
                          ? "bg-slate-300 text-slate-600 border-slate-300 cursor-not-allowed line-through"
                          : ocupada
                          ? "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed"
                          : hora === h
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-900 border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      <div>{h}</div>
                      {bloqueo && (
                        <div className="text-xs mt-1">{motivoBloqueo}</div>
                      )}
                    </button>
                  );
                })}
              </div>
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
