import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

function parseLocalDateTime(value?: string) {
  if (!value) return new Date("Invalid Date");

  const normalizado = value.replace("T", " ").replace("Z", "");
  const [datePart, timePart = "00:00:00"] = normalizado.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();

    const body = await req.json();
    const { name, phone, start_time, end_time } = body;

    if (!name || !phone || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const inicioReserva = parseLocalDateTime(start_time).getTime();
    const finReserva = parseLocalDateTime(end_time).getTime();

    const { data: bloqueos, error: errorBloqueos } = await supabase
      .from("blocked_slots")
      .select("*");

    if (errorBloqueos) {
      return NextResponse.json(
        { error: "No se pudo comprobar la disponibilidad" },
        { status: 500 }
      );
    }

    const bloqueoActivo = (bloqueos || []).find((b) => {
      const inicioBloqueo = parseLocalDateTime(b.start_time).getTime();
      const finBloqueo = parseLocalDateTime(b.end_time).getTime();

      return inicioReserva < finBloqueo && finReserva > inicioBloqueo;
    });

    if (bloqueoActivo) {
      return NextResponse.json(
        {
          error: `No disponible: ${bloqueoActivo.reason || "bloqueado por el fisioterapeuta"}`,
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("appointments").insert({
      name,
      phone,
      start_time,
      end_time,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "La hora ya no está disponible" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error al procesar la reserva",
        detalle: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
