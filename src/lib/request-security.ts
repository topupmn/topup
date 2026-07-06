import { NextResponse } from "next/server";

function getAllowedOrigins(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  return new Set(
    [requestOrigin, configuredAppUrl ? new URL(configuredAppUrl).origin : null]
      .filter(Boolean)
  );
}

export function isSameOriginRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  return getAllowedOrigins(request).has(origin);
}

export function forbidCrossSiteRequest(request: Request) {
  if (isSameOriginRequest(request)) {
    return null;
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
