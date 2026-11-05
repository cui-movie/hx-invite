import { NextRequest, NextResponse } from "next/server";
import { disableCode } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return NextResponse.json({ ok: false, message: "缺少码 id" }, { status: 400 });
  disableCode(id);
  return NextResponse.json({ ok: true, message: "已停用" });
}
