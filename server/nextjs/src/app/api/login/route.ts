import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CORS_HEADERS, issueToken, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ message: "ایمیل یا رمز عبور درست نیست." }, 422);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return json({ message: "ایمیل یا رمز عبور درست نیست." }, 422);
  }

  return json({
    token: await issueToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
