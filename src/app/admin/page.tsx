"use client";

import { useEffect, useState } from "react";

type StaffRow = {
  id: number;
  name: string;
  branch: string;
  status: string;
  code?: string;
  code_status?: string;
  points?: number;
  customers?: number;
};

type Rules = Record<string, { points: number; label: string }>;

export default function AdminPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [rules, setRules] = useState<Rules>({});
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [s, r] = await Promise.all([
      fetch("/api/invite-codes").then((x) => x.json()),
      fetch("/api/points").then((x) => x.json()),
    ]);
    setStaff(s.staff || []);
    setRules(r.rules || {});
  }

  useEffect(() => {
    load();
  }, []);

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_staff", name, branch }),
    }).then((x) => x.json());
    setLoading(false);
    setMsg({ type: res.ok ? "ok" : "err", text: res.message + (res.code ? `，码：${res.code}` : "") });
    if (res.ok) {
      setName("");
      setBranch("");
      load();
    }
  }

  async function issueCode(staffId: number) {
    setLoading(true);
    const res = await fetch("/api/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "issue_code", staff_id: staffId }),
    }).then((x) => x.json());
    setLoading(false);
    setMsg({ type: res.ok ? "ok" : "err", text: res.message + (res.code ? `：${res.code}` : "") });
    load();
  }

  return (
    <main>
      <div className="card">
        <h2>运营台</h2>
        <p className="muted">管理客户经理、发放/停用邀请码、查看积分规则，导出归因与积分流水。</p>
        <div className="row" style={{ marginTop: 8 }}>
          <a className="btn secondary" href="/api/export?type=attribution">导出归因 CSV</a>
          <a className="btn secondary" href="/api/export?type=points">导出积分 CSV</a>
        </div>
        {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>积分规则</h3>
          <table>
            <thead>
              <tr>
                <th>事件</th>
                <th>说明</th>
                <th>积分</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rules).map(([k, v]) => (
                <tr key={k}>
                  <td className="mono">{k}</td>
                  <td>{v.label}</td>
                  <td>+{v.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 8 }}>冲正可对同一客户写入负分事件（手工调用 API）。</p>
        </div>

        <div className="card">
          <h3>新增业务员并发码</h3>
          <form className="form" onSubmit={createStaff}>
            <label>
              姓名
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：赵经理" required />
            </label>
            <label>
              网点
              <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="如：广州分行天河支行" />
            </label>
            <button className="btn" type="submit" disabled={loading}>创建并发码</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3>业务员列表</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>网点</th>
              <th>当前邀请码</th>
              <th>客户数</th>
              <th>积分</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.branch}</td>
                <td>
                  <span className="mono">{s.code || "-"}</span>{" "}
                  {s.code_status === "active" ? (
                    <span className="tag ok">有效</span>
                  ) : s.code ? (
                    <span className="tag off">停用</span>
                  ) : null}
                </td>
                <td>{s.customers ?? 0}</td>
                <td>{s.points ?? 0}</td>
                <td className="row">
                  <button className="btn sm secondary" type="button" onClick={() => issueCode(s.id)} disabled={loading}>
                    重新发码
                  </button>
                  <a className="btn sm secondary" href={`/staff?id=${s.id}`}>业务员台</a>
                  <a className="btn sm" href={`/join?code=${s.code || ""}`}>落地页</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
