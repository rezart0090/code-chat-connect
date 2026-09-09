import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CORS_HEADERS, json, unauthorized, userFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  body: string;
  userId: number;
  createdAt: Date;
  user: { name: string } | null;
};

function present(row: Row) {
  return {
    id: String(row.id),
    body: row.body,
    user_id: row.userId,
    user_name: row.user?.name ?? "کاربر",
    created_at: row.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return unauthorized();

  const rows = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true } } },
  });

  return json({ messages: rows.reverse().map(present) });
}

const schema = z.object({ body: z.string().min(1).max(4000) });

export async function POST(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ message: "متن پیام معتبر نیست." }, 422);

  const row = await prisma.message.create({
    data: { body: parsed.data.body, userId: user.id },
    include: { user: { select: { name: true } } },
  });

  const payload = present(row);
  await broadcast(payload);

  return json({ message: payload }, 201);
}

/** Push the saved message to the socket server; never fail the request on it. */
async function broadcast(message: unknown) {
  const url = (process.env.SOCKET_URL ?? "").replace(/\/+$/, "");
  if (!url) return;
  try {
    await fetch(`${url}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Socket-Secret": process.env.SOCKET_SECRET ?? "",
      },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    console.warn("socket broadcast failed");
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
