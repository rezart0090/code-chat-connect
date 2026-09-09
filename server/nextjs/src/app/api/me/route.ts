import { CORS_HEADERS, json, unauthorized, userFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return unauthorized();
  return json(user);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
