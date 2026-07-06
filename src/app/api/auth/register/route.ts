import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getMongolianPhoneError, normalizeMongolianPhone } from "@/lib/phone";

const registerSchema = z.object({
  name: z.string().min(2, "Нэр хэт богино байна"),
  email: z.string().email("Имэйл буруу байна"),
  password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт"),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  if (process.env.ALLOW_PUBLIC_REGISTRATION !== "true") {
    return NextResponse.json(
      { error: "Public registration is disabled" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;

    let normalizedPhone: string | undefined;
    if (phone?.trim()) {
      const phoneError = getMongolianPhoneError(phone);
      if (phoneError) {
        return NextResponse.json({ error: phoneError }, { status: 400 });
      }

      normalizedPhone = normalizeMongolianPhone(phone) ?? undefined;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Энэ имэйлээр бүртгэлтэй хэрэглэгч байна" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone: normalizedPhone },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Бүртгэл үүсгэхэд алдаа гарлаа" },
      { status: 500 }
    );
  }
}
