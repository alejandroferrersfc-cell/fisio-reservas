import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("admin-session")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;

  const protectedPaths = [
    "/admin",
    "/api/bloquear",
    "/api/cancelar-cita",
    "/api/eliminar-bloqueo",
    "/api/disponibilidades",
    "/api/eliminar-disponibilidad",
  ];

  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!secret || session !== secret) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/bloquear",
    "/api/cancelar-cita",
    "/api/eliminar-bloqueo",
    "/api/disponibilidades",
    "/api/eliminar-disponibilidad",
  ],
};
