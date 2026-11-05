import { NextRequest, NextResponse } from "next/server";
import { findInviteByCode } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  if (!code) return NextResponse.json({ ok: false, valid: false, message: "未提供邀请码" });
  const invite = findInviteByCode(code);
  if (!invite) return NextResponse.json({ ok: false, valid: false, message: "邀请码不存在" });
  if (invite.status !== "active" || invite.staff_status !== "active") {
    return NextResponse.json({ ok: false, valid: false, message: "邀请码已停用" });
  }
  return NextResponse.json({
    ok: true,
    valid: true,
    code: invite.code,
    staff_id: invite.staff_id,
    staff_name: invite.staff_name,
    staff_branch: invite.staff_branch,
  });
}
