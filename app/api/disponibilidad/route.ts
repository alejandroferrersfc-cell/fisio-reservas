import { supabase } from "@/src/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: reservas, error: errorReservas } = await supabase
    .from("appointments")
    .select("*")
    .order("start_time", { ascending: true });

  const { data: bloqueos, error: errorBloqueos } = await supabase
    .from("blocked_slots")
    .select("*")
    .order("start_time", { ascending: true });

  return NextResponse.json({
    ok: !errorReservas && !errorBloqueos,
    reservas,
    bloqueos,
    errorReservas,
    errorBloqueos,
  });
}