import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://topup.mn";

export const SITE_NAME = "topup.mn";

export const DEFAULT_DESCRIPTION =
  "Монголд Steam, Roblox, PUBG Mobile, Minecraft, PlayStation, Xbox, Nintendo зэрэг тоглоомын картуудыг QPay-ээр хурдан, хялбар худалдан аваарай.";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  keywords = [],
}: {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "mn_MN",
      type: "website",
      images: [
        {
          url: absoluteUrl("/logo.jpg"),
          width: 1024,
          height: 1024,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [absoluteUrl("/logo.jpg")],
    },
  };
}
