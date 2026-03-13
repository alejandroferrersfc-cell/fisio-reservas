import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Falta el id del bloqueo" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("blocked_slots")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "No se pudo eliminar el bloqueo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno al eliminar bloqueo" },
      { status: 500 }
    );
  }
}
