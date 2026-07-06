import { NextResponse } from "next/server";
import { sendHourlyStatusToTelegram } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isAuthorizedCronRequest(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const schedule = request.headers.get("x-vercel-cron-schedule");
  const secret = process.env.MONITORING_CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (userAgent.includes("vercel-cron/1.0") && schedule) {
    return true;
  }

  if (secret && authorization === `Bearer ${secret}`) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await sendHourlyStatusToTelegram();
    const hasFailure = result.checks.some((check) => !check.ok);

    return NextResponse.json({
      ok: !hasFailure,
      checks: result.checks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Monitoring failed",
      },
      { status: 500 }
    );
  }
}
