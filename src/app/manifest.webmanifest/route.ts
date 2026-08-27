import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "aphogato — Muhammad Hadid Photography admin",
      short_name: "aphogato",
      description:
        "Admin app for Muhammad Hadid Photography — galleries, clients, calendar, finance, quotations.",
      start_url: "/dashboard",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0a0a0a",
      theme_color: "#0a0a0a",
      icons: [
        {
          src: "/images/logo/MH_logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/logo/MH_logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    {
      headers: {
        "content-type": "application/manifest+json",
        "cache-control": "public, max-age=3600",
      },
    }
  );
}
