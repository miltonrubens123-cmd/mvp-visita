import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Business Vision"',
    },
  });
}

export function middleware(request: NextRequest) {
  const authUser = process.env.AUTH_USER;
  const authPassword = process.env.AUTH_PASSWORD;

  if (!authUser || !authPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  const base64Credentials = authHeader.replace("Basic ", "");

  let credentials = "";

  try {
    credentials = atob(base64Credentials);
  } catch {
    return unauthorized();
  }

  const separatorIndex = credentials.indexOf(":");

  if (separatorIndex === -1) {
    return unauthorized();
  }

  const username = credentials.slice(0, separatorIndex);
  const password = credentials.slice(separatorIndex + 1);

  if (username !== authUser || password !== authPassword) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};