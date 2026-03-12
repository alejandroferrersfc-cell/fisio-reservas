import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data: reservas, error: errorReservas } = await supabase
      .from("appointments")
      .select("*")
      .order("start_time", { ascending: true });

    const { data: bloqueos, error: errorBloqueos } = await supabase
      .from("blocked_slots")
      .select("*")
      .order("start_time", { ascending: true });

    if (errorReservas || errorBloqueos) {
      return NextResponse.json(
        { error: "Error al obtener disponibilidad" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reservas: reservas ?? [],
      bloqueos: bloqueos ?? [],
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