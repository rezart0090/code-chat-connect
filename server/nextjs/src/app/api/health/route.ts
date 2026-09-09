import { CORS_HEADERS, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ ok: true });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
