import { NextRequest, NextResponse } from "next/server";
import { bindCustomer } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = bindCustomer({
    customerId: String(body.customer_id || body.phone || ""),
    customerName: String(body.customer_name || body.name || ""),
    inviteCode: body.invite_code || body.code || "",
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
