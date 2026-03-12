import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener citas" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
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