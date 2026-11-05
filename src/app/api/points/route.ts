import { NextRequest, NextResponse } from "next/server";
import { awardPoints } from "@/lib/db";
import { POINTS_RULES } from "@/lib/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, rules: POINTS_RULES });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const customerId = String(body.customer_id || "").trim();
  const eventType = String(body.event_type || "").trim();
  let bizRef = String(body.biz_ref || "").trim();
  if (!bizRef) bizRef = `${eventType}:${customerId}:${Date.now()}`;
  // open_account 默认幂等键
  if (eventType === "open_account" && !body.biz_ref) {
    bizRef = `open_account:${customerId}`;
  }
  const result = awardPoints({
    customerId,
    eventType,
    bizRef,
    note: String(body.note || ""),
    pointsOverride: body.points !== undefined ? Number(body.points) : undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
