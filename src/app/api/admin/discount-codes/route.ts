import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { normalizeDiscountCode } from "@/lib/discounts";
import { prisma } from "@/lib/prisma";
import { forbidCrossSiteRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  const crossSiteResponse = forbidCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const code = normalizeDiscountCode(String(body.code ?? ""));
  const discountPercent = Number(body.discountPercent);

  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return NextResponse.json(
      { error: "Код 3-32 тэмдэгттэй, A-Z, 0-9, _ эсвэл - байна" },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(discountPercent) ||
    discountPercent <= 0 ||
    discountPercent >= 100
  ) {
    return NextResponse.json(
      { error: "Хөнгөлөлт 0-100% хооронд байх ёстой" },
      { status: 400 }
    );
  }

  try {
    const discountCode = await prisma.discountCode.create({
      data: { code, discountPercent },
    });

    return NextResponse.json(discountCode, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Энэ код аль хэдийн байна" },
      { status: 409 }
    );
  }
}
