import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Falta el id de la disponibilidad" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("custom_availability")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "No se pudo eliminar la disponibilidad" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno al eliminar disponibilidad" },
      { status: 500 }
    );
  }
}
