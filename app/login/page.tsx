"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setMensaje("");
    setCargando(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMensaje(data.error || "No se pudo iniciar sesión");
      setCargando(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen bg-blue-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">
          Acceso administrador
        </h1>

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <button
          type="button"
          onClick={entrar}
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>

        {mensaje && <p className="mt-4 text-red-600">{mensaje}</p>}
      </div>
    </main>
  );
}
