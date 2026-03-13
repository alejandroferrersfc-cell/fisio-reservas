import { getSupabaseClient } from "@/src/lib/supabase";
import {
  getResendClient,
  getEmailFrom,
  getPhysioEmail,
} from "@/src/lib/resend";
import { NextResponse } from "next/server";

function parseLocalDateTime(value?: string) {
  if (!value) return new Date("Invalid Date");

  const normalizado = value.replace("T", " ").replace("Z", "");
  const [datePart, timePart = "00:00:00"] = normalizado.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second);
}

function formatearFechaHora(fechaTexto: string) {
  const fecha = parseLocalDateTime(fechaTexto);

  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();

    const body = await req.json();
    const { name, phone, email, start_time, end_time } = body;

    if (!name || !phone || !email || !start_time || !end_time) {
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
      status: "confirmed",
    });

if (error) {
  const rawMessage = error.message?.toLowerCase() || "";
  const rawCode = (error as { code?: string })?.code || "";

  const esReservaDuplicada =
    rawCode === "23505" || rawMessage.includes("duplicate key");

  return NextResponse.json(
    {
      error: esReservaDuplicada
        ? "Este día y esa hora ya han sido reservados por otro cliente."
        : "La hora ya no está disponible.",
    },
    { status: 400 }
  );
}

    try {
      const resend = getResendClient();
      const from = getEmailFrom();
      const physioEmail = getPhysioEmail();
      const fechaFormateada = formatearFechaHora(start_time);

      await Promise.all([
        resend.emails.send({
          from,
          to: email,
          subject: "Reserva confirmada",
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Reserva confirmada</h2>
              <p>Hola ${name},</p>
              <p>Tu cita ha sido confirmada correctamente.</p>
              <p><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
              <p>Gracias por tu reserva.</p>
            </div>
          `,
        }),
        resend.emails.send({
          from,
          to: physioEmail,
          subject: "Nueva reserva recibida",
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Nueva reserva</h2>
              <p><strong>Paciente:</strong> ${name}</p>
              <p><strong>Teléfono:</strong> ${phone}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
            </div>
          `,
        }),
      ]);
    } catch (emailError) {
      console.error("Error enviando emails:", emailError);
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
