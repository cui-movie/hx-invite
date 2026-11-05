import { NextRequest, NextResponse } from "next/server";
import { getStaffDashboard, listStaff } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: true, staff: listStaff() });
  }
  const dash = getStaffDashboard(Number(id));
  if (!dash) return NextResponse.json({ ok: false, message: "业务员不存在" }, { status: 404 });
  return NextResponse.json({ ok: true, ...dash });
}
