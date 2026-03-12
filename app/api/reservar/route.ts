import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

function parseLocalDateTime(value: string) {
  const [datePart, timePart] = value.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second || 0);
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
        { error: "La hora ya no está disponible" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la reserva" },
      { status: 500 }
    );
  }
}