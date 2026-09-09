import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CORS_HEADERS, issueToken, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ message: "اطلاعات وارد شده درست نیست." }, 422);

  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return json({ message: "این ایمیل قبلاً ثبت شده است." }, 422);

  const user = await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 10) },
    select: { id: true, name: true, email: true },
  });

  return json({ token: await issueToken(user.id), user }, 201);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
