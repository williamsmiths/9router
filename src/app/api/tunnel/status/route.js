import { NextResponse } from "next/server";

/** Lite build: tunnel removed — stub for stale clients / old Docker UI cache */
export async function GET() {
  return NextResponse.json({
    tunnel: {
      enabled: false,
      settingsEnabled: false,
      tunnelUrl: "",
      publicUrl: "",
    },
    tailscale: {
      enabled: false,
      settingsEnabled: false,
      tunnelUrl: "",
    },
    download: { downloading: false, progress: 0 },
  });
}
