import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") || "";
  if (!url) return NextResponse.json({ ok: false, message: "缺少 url" }, { status: 400 });
  const png = await QRCode.toBuffer(url, { type: "png", width: 280, margin: 2 });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
