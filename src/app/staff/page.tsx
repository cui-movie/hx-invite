"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type StaffLite = { id: number; name: string; branch: string };
type Dash = {
  staff: StaffLite & { status: string };
  activeCode?: { id: number; code: string; status: string };
  codes: { id: number; code: string; status: string; created_at: string }[];
  customers: {
    customer_id: string;
    customer_name: string;
    invite_code: string;
    created_at: string;
    customer_points: number;
  }[];
  ledger: {
    id: number;
    customer_id: string;
    customer_name?: string;
    event_type: string;
    points: number;
    biz_ref: string;
    note: string;
    created_at: string;
  }[];
  totalPoints: number;
};

function StaffInner() {
  const sp = useSearchParams();
  const [list, setList] = useState<StaffLite[]>([]);
  const [staffId, setStaffId] = useState<number>(Number(sp.get("id") || 0));
  const [dash, setDash] = useState<Dash | null>(null);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
    setOrigin(base || window.location.origin);
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) => {
        setList(d.staff || []);
        if (!staffId && d.staff?.[0]) setStaffId(d.staff[0].id);
      });
  }, []);

  useEffect(() => {
    if (!staffId) return;
    fetch(`/api/staff?id=${staffId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setDash(d);
      });
  }, [staffId]);

  const inviteUrl = useMemo(() => {
    if (!origin || !dash?.activeCode?.code) return "";
    return `${origin}/join?code=${dash.activeCode.code}`;
  }, [origin, dash]);

  async function simulateOpenAccount(customerId: string) {
    setMsg(null);
    const res = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        event_type: "open_account",
        note: "模拟开户入账",
      }),
    }).then((x) => x.json());
    setMsg({
      type: res.ok ? (res.duplicate ? "warn" : "ok") : "err",
      text: res.message + (res.points !== undefined ? `（${res.points} 分）` : ""),
    });
    if (staffId) {
      const d = await fetch(`/api/staff?id=${staffId}`).then((r) => r.json());
      if (d.ok) setDash(d);
    }
  }

  return (
    <main>
      <div className="card">
        <h2>业务员台</h2>
        <p className="muted">演示免登录：下拉切换业务员，查看专属码、二维码、客户与积分。</p>
        <label className="muted" style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 320 }}>
          选择业务员
          <select
            value={staffId || ""}
            onChange={(e) => setStaffId(Number(e.target.value))}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
          >
            {list.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}（{s.branch}）
              </option>
            ))}
          </select>
        </label>
        {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
      </div>

      {dash && (
        <>
          <div className="grid grid-3">
            <div className="card stat">
              <div className="num">{dash.totalPoints}</div>
              <div className="label">累计积分</div>
            </div>
            <div className="card stat">
              <div className="num">{dash.customers.length}</div>
              <div className="label">归因客户数</div>
            </div>
            <div className="card stat">
              <div className="num mono" style={{ fontSize: 22 }}>
                {dash.activeCode?.code || "-"}
              </div>
              <div className="label">当前邀请码</div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3>专属链接与二维码</h3>
              {dash.activeCode?.status === "active" ? (
                <>
                  <p className="mono" style={{ wordBreak: "break-all" }}>
                    {inviteUrl}
                  </p>
                  <div className="row" style={{ margin: "8px 0" }}>
                    <a className="btn secondary sm" href={inviteUrl} target="_blank" rel="noreferrer">
                      打开落地页
                    </a>
                    <button
                      className="btn secondary sm"
                      type="button"
                      onClick={() => navigator.clipboard.writeText(inviteUrl)}
                    >
                      复制链接
                    </button>
                  </div>
                  {inviteUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="qr"
                      alt="邀请二维码"
                      src={`/api/qrcode?url=${encodeURIComponent(inviteUrl)}`}
                    />
                  )}
                  <p className="muted">扫码后进入落地页并自动带上邀请码。</p>
                </>
              ) : (
                <p className="msg warn">当前无有效邀请码，请到运营台重新发码。</p>
              )}
            </div>

            <div className="card">
              <h3>历史邀请码</h3>
              <table>
                <thead>
                  <tr>
                    <th>码</th>
                    <th>状态</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.codes.map((c) => (
                    <tr key={c.id}>
                      <td className="mono">{c.code}</td>
                      <td>
                        {c.status === "active" ? (
                          <span className="tag ok">有效</span>
                        ) : (
                          <span className="tag off">停用</span>
                        )}
                      </td>
                      <td>{c.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>我的客户</h3>
            <table>
              <thead>
                <tr>
                  <th>手机号</th>
                  <th>姓名</th>
                  <th>邀请码</th>
                  <th>注册时间</th>
                  <th>贡献积分</th>
                  <th>模拟事件</th>
                </tr>
              </thead>
              <tbody>
                {dash.customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      暂无客户。请用专属链接完成一次注册。
                    </td>
                  </tr>
                )}
                {dash.customers.map((c) => (
                  <tr key={c.customer_id}>
                    <td className="mono">{c.customer_id}</td>
                    <td>{c.customer_name}</td>
                    <td className="mono">{c.invite_code}</td>
                    <td>{c.created_at}</td>
                    <td>{c.customer_points}</td>
                    <td>
                      <button
                        className="btn sm"
                        type="button"
                        onClick={() => simulateOpenAccount(c.customer_id)}
                      >
                        模拟开户 +50
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>积分明细</h3>
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>客户</th>
                  <th>事件</th>
                  <th>积分</th>
                  <th>biz_ref</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {dash.ledger.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      暂无积分流水
                    </td>
                  </tr>
                )}
                {dash.ledger.map((l) => (
                  <tr key={l.id}>
                    <td>{l.created_at}</td>
                    <td>
                      {l.customer_name || "-"}
                      <div className="mono muted">{l.customer_id}</div>
                    </td>
                    <td className="mono">{l.event_type}</td>
                    <td>{l.points > 0 ? `+${l.points}` : l.points}</td>
                    <td className="mono">{l.biz_ref}</td>
                    <td>{l.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="card">加载中…</div>}>
      <StaffInner />
    </Suspense>
  );
}
