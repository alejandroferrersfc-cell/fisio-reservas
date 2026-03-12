import { supabase } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { start_time, end_time, reason } = body;

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: "Faltan fechas para bloquear" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("blocked_slots").insert({
      start_time,
      end_time,
      reason,
    });

    if (error) {
      return NextResponse.json(
        { error: "No se pudo guardar el bloqueo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno al bloquear" },
      { status: 500 }
    );
  }
}