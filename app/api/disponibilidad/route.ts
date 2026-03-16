import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseLocalDateTime(value?: string) {
  if (!value) return new Date("Invalid Date");

  const normalizado = value.replace("T", " ").replace("Z", "");
  const [datePart, timePart = "00:00:00"] = normalizado.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second);
}

function generarHorasEntre(startTime: string, endTime: string) {
  const horas: string[] = [];

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const inicio = new Date(2000, 0, 1, startHour, startMinute, 0);
  const fin = new Date(2000, 0, 1, endHour, endMinute, 0);

  while (inicio < fin) {
    horas.push(`${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`);
    inicio.setHours(inicio.getHours() + 1);
  }

  return horas;
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha");

    const { data: reservas, error: errorReservas } = await supabase
      .from("appointments")
      .select("*")
      .order("start_time", { ascending: true });

    const { data: bloqueos, error: errorBloqueos } = await supabase
      .from("blocked_slots")
      .select("*")
      .order("start_time", { ascending: true });

    const { data: disponibilidades, error: errorDisponibilidades } = await supabase
      .from("custom_availability")
      .select("*")
      .eq("active", true)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (errorReservas || errorBloqueos || errorDisponibilidades) {
      return NextResponse.json(
        { error: "Error al obtener disponibilidad" },
        { status: 500 }
      );
    }

    if (!fecha) {
      return NextResponse.json({
        reservas: reservas ?? [],
        bloqueos: bloqueos ?? [],
        disponibilidades: disponibilidades ?? [],
      });
    }

    const franjasDelDia = (disponibilidades ?? []).filter((d) => d.date === fecha);

    let horasDisponibles: string[] = [];

    for (const franja of franjasDelDia) {
      horasDisponibles.push(...generarHorasEntre(franja.start_time, franja.end_time));
    }

    horasDisponibles = horasDisponibles.filter((hora) => {
      const inicioSlot = new Date(`${fecha}T${hora}:00`);
      const finSlot = new Date(inicioSlot.getTime() + 60 * 60 * 1000);

      const reservada = (reservas ?? []).some((r) => {
        const esConfirmada = !r.status || r.status === "confirmed";
        if (!esConfirmada) return false;

        const inicioReserva = parseLocalDateTime(r.start_time).getTime();
        return inicioReserva === inicioSlot.getTime();
      });

      const bloqueada = (bloqueos ?? []).some((b) => {
        const inicioBloqueo = parseLocalDateTime(b.start_time).getTime();
        const finBloqueo = parseLocalDateTime(b.end_time).getTime();

        return inicioSlot.getTime() < finBloqueo && finSlot.getTime() > inicioBloqueo;
      });

      return !reservada && !bloqueada;
    });

    return NextResponse.json({
      reservas: reservas ?? [],
      bloqueos: bloqueos ?? [],
      disponibilidades: disponibilidades ?? [],
      horasDisponibles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error interno",
        detalle: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
