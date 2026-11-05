import { NextRequest, NextResponse } from "next/server";
import { exportAttributionsCsv, exportPointsCsv } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "attribution";
  const csv = type === "points" ? exportPointsCsv() : exportAttributionsCsv();
  const filename = type === "points" ? "points_ledger.csv" : "attributions.csv";
  // BOM for Excel CN
  const body = "\uFEFF" + csv;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
