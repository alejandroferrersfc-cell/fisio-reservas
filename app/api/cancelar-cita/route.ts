import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Falta el id de la cita" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "No se pudo eliminar la cita" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno al cancelar la cita" },
      { status: 500 }
    );
  }
}
