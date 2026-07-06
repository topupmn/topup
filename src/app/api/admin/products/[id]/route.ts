import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { forbidCrossSiteRequest } from "@/lib/request-security";

export async function PATCH(
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
  const { isActive } = await request.json();

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(product);
}
