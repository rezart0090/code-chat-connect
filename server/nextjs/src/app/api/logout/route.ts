import { CORS_HEADERS, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Tokens are stateless JWTs; the client simply drops it.
export function POST() {
  return json({ ok: true });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
