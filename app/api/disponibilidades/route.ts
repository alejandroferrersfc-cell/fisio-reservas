import { getSupabaseClient } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("custom_availability")
      .select("*")
      .eq("active", true)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "No se pudieron obtener las disponibilidades" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json(
      { error: "Error interno al obtener disponibilidades" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const { date, start_time, end_time } = await req.json();

    if (!date || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Faltan datos de disponibilidad" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("custom_availability").insert({
      date,
      start_time,
      end_time,
      active: true,
    });

    if (error) {
      return NextResponse.json(
        { error: "No se pudo guardar la disponibilidad" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno al guardar disponibilidad" },
      { status: 500 }
    );
  }
}
