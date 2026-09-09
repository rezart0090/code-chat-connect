import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");

export type SafeUser = { id: number; name: string; email: string };

export async function issueToken(userId: number) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

/** Reads the bearer token and returns the user, or null when unauthenticated. */
export async function userFromRequest(request: Request): Promise<SafeUser | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return null;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
    return user;
  } catch {
    return null;
  }
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

export function unauthorized() {
  return json({ message: "ابتدا وارد شوید." }, 401);
}
