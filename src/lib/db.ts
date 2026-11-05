import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { POINTS_RULES } from "./points";

const DATA_DIR = path.resolve(
  process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data")
);
const DB_PATH = path.join(DATA_DIR, "hx-invite.db");

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  initSchema(db);
  seedIfEmpty(db);
  _db = db;
  return db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      branch TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS invite_code (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      staff_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS attribution (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL DEFAULT '',
      staff_id INTEGER NOT NULL,
      invite_code TEXT NOT NULL,
      locked INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS points_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      points INTEGER NOT NULL,
      biz_ref TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      UNIQUE(biz_ref)
    );

    CREATE INDEX IF NOT EXISTS idx_invite_code_code ON invite_code(code);
    CREATE INDEX IF NOT EXISTS idx_attribution_staff ON attribution(staff_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_staff ON points_ledger(staff_id);
  `);
}

const SEED_STAFF = [
  { name: "张经理", branch: "北京分行朝阳支行", code: "ZHANG01" },
  { name: "李经理", branch: "上海分行浦东支行", code: "LI02" },
  { name: "王经理", branch: "深圳分行福田支行", code: "WANG03" },
];

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS c FROM staff").get() as { c: number };
  if (row.c > 0) return;

  const insertStaff = db.prepare(
    "INSERT INTO staff (name, branch, status) VALUES (?, ?, 'active')"
  );
  const insertCode = db.prepare(
    "INSERT INTO invite_code (code, staff_id, status) VALUES (?, ?, 'active')"
  );

  for (const s of SEED_STAFF) {
    const r = insertStaff.run(s.name, s.branch);
    insertCode.run(s.code, Number(r.lastInsertRowid));
  }
}

export type Staff = {
  id: number;
  name: string;
  branch: string;
  status: string;
  created_at: string;
};

export type InviteCode = {
  id: number;
  code: string;
  staff_id: number;
  status: string;
  created_at: string;
};

export type Attribution = {
  id: number;
  customer_id: string;
  customer_name: string;
  staff_id: number;
  invite_code: string;
  locked: number;
  created_at: string;
};

export type PointsLedger = {
  id: number;
  staff_id: number;
  customer_id: string;
  event_type: string;
  points: number;
  biz_ref: string;
  note: string;
  created_at: string;
};

export function listStaff(): (Staff & { code?: string; code_status?: string; points?: number; customers?: number })[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT s.*,
        (SELECT code FROM invite_code ic WHERE ic.staff_id = s.id ORDER BY ic.id DESC LIMIT 1) AS code,
        (SELECT status FROM invite_code ic WHERE ic.staff_id = s.id ORDER BY ic.id DESC LIMIT 1) AS code_status,
        COALESCE((SELECT SUM(points) FROM points_ledger pl WHERE pl.staff_id = s.id), 0) AS points,
        COALESCE((SELECT COUNT(*) FROM attribution a WHERE a.staff_id = s.id), 0) AS customers
       FROM staff s ORDER BY s.id`
    )
    .all() as any[];
}

export function getStaffById(id: number) {
  const db = getDb();
  return db.prepare("SELECT * FROM staff WHERE id = ?").get(id) as Staff | undefined;
}

export function findInviteByCode(code: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT ic.*, s.name AS staff_name, s.branch AS staff_branch, s.status AS staff_status
       FROM invite_code ic
       JOIN staff s ON s.id = ic.staff_id
       WHERE ic.code = ?`
    )
    .get(code.trim().toUpperCase()) as
    | (InviteCode & { staff_name: string; staff_branch: string; staff_status: string })
    | undefined;
}

export function generateCode(staffId: number): string {
  const staff = getStaffById(staffId);
  if (!staff) throw new Error("业务员不存在");
  const db = getDb();
  // 停用旧码
  db.prepare("UPDATE invite_code SET status = 'disabled' WHERE staff_id = ? AND status = 'active'").run(staffId);
  // ASCII 码：HX + staffId + 随机4位
  let code = "";
  for (let i = 0; i < 20; i++) {
    const rand = Math.floor(Math.random() * 9000 + 1000);
    code = `HX${staffId}${rand}`;
    const exists = db.prepare("SELECT id FROM invite_code WHERE code = ?").get(code);
    if (!exists) break;
  }
  db.prepare("INSERT INTO invite_code (code, staff_id, status) VALUES (?, ?, 'active')").run(code, staffId);
  return code;
}

export function disableCode(codeId: number) {
  const db = getDb();
  db.prepare("UPDATE invite_code SET status = 'disabled' WHERE id = ?").run(codeId);
}

export function createStaff(name: string, branch: string) {
  const db = getDb();
  const r = db.prepare("INSERT INTO staff (name, branch, status) VALUES (?, ?, 'active')").run(name, branch);
  const id = Number(r.lastInsertRowid);
  const code = generateCode(id);
  return { id, code };
}

export type BindResult = {
  ok: boolean;
  message: string;
  attribution?: Attribution & { staff_name?: string };
  alreadyBound?: boolean;
  pointsAwarded?: number;
};

export function bindCustomer(opts: {
  customerId: string;
  customerName: string;
  inviteCode?: string;
}): BindResult {
  const db = getDb();
  const customerId = opts.customerId.trim();
  const customerName = opts.customerName.trim();

  if (!/^1\d{10}$/.test(customerId)) {
    return { ok: false, message: "请输入有效的11位手机号" };
  }
  if (!customerName) {
    return { ok: false, message: "请输入姓名" };
  }

  const existing = db
    .prepare(
      `SELECT a.*, s.name AS staff_name FROM attribution a
       JOIN staff s ON s.id = a.staff_id WHERE a.customer_id = ?`
    )
    .get(customerId) as (Attribution & { staff_name: string }) | undefined;

  if (existing) {
    return {
      ok: true,
      message: `已归属原推荐人：${existing.staff_name}（首次归因锁定，不可改绑）`,
      attribution: existing,
      alreadyBound: true,
      pointsAwarded: 0,
    };
  }

  const code = (opts.inviteCode || "").trim().toUpperCase();
  if (!code) {
    // 无码注册：成功但不归因、不积分
    return {
      ok: true,
      message: "注册成功（未使用邀请码，无推荐人归因）",
      alreadyBound: false,
      pointsAwarded: 0,
    };
  }

  const invite = findInviteByCode(code);
  if (!invite || invite.status !== "active" || invite.staff_status !== "active") {
    return { ok: false, message: "邀请码无效或已停用，无法完成归因注册" };
  }

  const r = db
    .prepare(
      `INSERT INTO attribution (customer_id, customer_name, staff_id, invite_code, locked)
       VALUES (?, ?, ?, ?, 1)`
    )
    .run(customerId, customerName, invite.staff_id, invite.code);

  const attr = db
    .prepare(
      `SELECT a.*, s.name AS staff_name FROM attribution a
       JOIN staff s ON s.id = a.staff_id WHERE a.id = ?`
    )
    .get(Number(r.lastInsertRowid)) as Attribution & { staff_name: string };

  // 注册积分入账
  const award = awardPoints({
    customerId,
    eventType: "register",
    bizRef: `register:${customerId}`,
    note: "客户首次注册留资",
  });

  return {
    ok: true,
    message: `注册成功，已归属推荐人：${attr.staff_name}`,
    attribution: attr,
    alreadyBound: false,
    pointsAwarded: award.ok ? award.points : 0,
  };
}

export type AwardResult = {
  ok: boolean;
  message: string;
  points?: number;
  duplicate?: boolean;
};

export function awardPoints(opts: {
  customerId: string;
  eventType: string;
  bizRef: string;
  note?: string;
  pointsOverride?: number;
}): AwardResult {
  const db = getDb();
  const customerId = opts.customerId.trim();
  const eventType = opts.eventType.trim();
  const bizRef = opts.bizRef.trim();

  if (!bizRef) return { ok: false, message: "缺少 biz_ref" };

  const dup = db.prepare("SELECT * FROM points_ledger WHERE biz_ref = ?").get(bizRef) as
    | PointsLedger
    | undefined;
  if (dup) {
    return {
      ok: true,
      message: "该业务事件已入账（幂等）",
      points: dup.points,
      duplicate: true,
    };
  }

  const attr = db.prepare("SELECT * FROM attribution WHERE customer_id = ? AND locked = 1").get(customerId) as
    | Attribution
    | undefined;
  if (!attr) {
    return { ok: false, message: "客户未锁定归因，无法入账积分" };
  }

  let points = opts.pointsOverride;
  if (points === undefined) {
    const rulePts = POINTS_RULES[eventType]?.points;
    if (rulePts === undefined) {
      return { ok: false, message: `未知事件类型：${eventType}` };
    }
    points = rulePts;
  }

  db.prepare(
    `INSERT INTO points_ledger (staff_id, customer_id, event_type, points, biz_ref, note)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(attr.staff_id, customerId, eventType, points, bizRef, opts.note || "");

  return { ok: true, message: "积分入账成功", points, duplicate: false };
}

export function getStaffDashboard(staffId: number) {
  const db = getDb();
  const staff = getStaffById(staffId);
  if (!staff) return null;

  const codes = db
    .prepare("SELECT * FROM invite_code WHERE staff_id = ? ORDER BY id DESC")
    .all(staffId) as InviteCode[];

  const activeCode = codes.find((c) => c.status === "active") || codes[0];

  const customers = db
    .prepare(
      `SELECT a.*,
        COALESCE((SELECT SUM(points) FROM points_ledger pl WHERE pl.customer_id = a.customer_id AND pl.staff_id = a.staff_id), 0) AS customer_points
       FROM attribution a WHERE a.staff_id = ? ORDER BY a.created_at DESC`
    )
    .all(staffId) as (Attribution & { customer_points: number })[];

  const ledger = db
    .prepare(
      `SELECT pl.*, a.customer_name
       FROM points_ledger pl
       LEFT JOIN attribution a ON a.customer_id = pl.customer_id
       WHERE pl.staff_id = ?
       ORDER BY pl.created_at DESC, pl.id DESC`
    )
    .all(staffId) as (PointsLedger & { customer_name?: string })[];

  const totalPoints = ledger.reduce((s, x) => s + x.points, 0);

  return { staff, codes, activeCode, customers, ledger, totalPoints };
}

export function exportAttributionsCsv(): string {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.id, a.customer_id, a.customer_name, s.name AS staff_name, a.invite_code, a.locked, a.created_at
       FROM attribution a JOIN staff s ON s.id = a.staff_id ORDER BY a.id`
    )
    .all() as any[];
  const header = "id,customer_id,customer_name,staff_name,invite_code,locked,created_at";
  const lines = rows.map((r) =>
    [r.id, r.customer_id, csvEscape(r.customer_name), csvEscape(r.staff_name), r.invite_code, r.locked, r.created_at].join(",")
  );
  return [header, ...lines].join("\n");
}

export function exportPointsCsv(): string {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT pl.id, s.name AS staff_name, pl.customer_id, a.customer_name, pl.event_type, pl.points, pl.biz_ref, pl.note, pl.created_at
       FROM points_ledger pl
       JOIN staff s ON s.id = pl.staff_id
       LEFT JOIN attribution a ON a.customer_id = pl.customer_id
       ORDER BY pl.id`
    )
    .all() as any[];
  const header = "id,staff_name,customer_id,customer_name,event_type,points,biz_ref,note,created_at";
  const lines = rows.map((r) =>
    [
      r.id,
      csvEscape(r.staff_name),
      r.customer_id,
      csvEscape(r.customer_name || ""),
      r.event_type,
      r.points,
      csvEscape(r.biz_ref),
      csvEscape(r.note || ""),
      r.created_at,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function csvEscape(v: string) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export { POINTS_RULES, DB_PATH };
