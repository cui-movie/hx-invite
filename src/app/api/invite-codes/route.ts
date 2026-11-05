import { NextRequest, NextResponse } from "next/server";
import { createStaff, generateCode, listStaff } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, staff: listStaff() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "create_staff") {
    const name = String(body.name || "").trim();
    const branch = String(body.branch || "").trim() || "未填写网点";
    if (!name) return NextResponse.json({ ok: false, message: "姓名必填" }, { status: 400 });
    const r = createStaff(name, branch);
    return NextResponse.json({ ok: true, ...r, message: "已创建业务员并发码" });
  }

  if (action === "issue_code") {
    const staffId = Number(body.staff_id);
    if (!staffId) return NextResponse.json({ ok: false, message: "缺少 staff_id" }, { status: 400 });
    try {
      const code = generateCode(staffId);
      return NextResponse.json({ ok: true, code, message: "已重新发码（旧码已停用）" });
    } catch (e: any) {
      return NextResponse.json({ ok: false, message: e.message || "发码失败" }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: false, message: "未知操作" }, { status: 400 });
}
