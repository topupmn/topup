import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendGiftCardSms } from "@/lib/sms";
import { forbidCrossSiteRequest } from "@/lib/request-security";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSiteResponse = forbidCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { fulfillment: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
  }

  if (!order.fulfillment?.cardCode) {
    return NextResponse.json(
      { error: "Код хараахан үүсээгүй байна" },
      { status: 400 }
    );
  }

  try {
    await sendGiftCardSms(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "SMS илгээхэд алдаа гарлаа",
      },
      { status: 500 }
    );
  }
}
