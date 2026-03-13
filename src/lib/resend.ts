import { Resend } from "resend";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY");
  }

  return new Resend(apiKey);
}

export function getEmailFrom() {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("Falta EMAIL_FROM");
  }

  return from;
}

export function getPhysioEmail() {
  const email = process.env.EMAIL_FISIO;

  if (!email) {
    throw new Error("Falta EMAIL_FISIO");
  }

  return email;
}
