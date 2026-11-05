"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function JoinInner() {
  const sp = useSearchParams();
  const initialCode = (sp.get("code") || "").toUpperCase();
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [referrer, setReferrer] = useState<{
    valid: boolean;
    staff_name?: string;
    staff_branch?: string;
    message?: string;
  } | null>(null);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    const c = code.trim();
    if (!c) {
      setReferrer({ valid: false, message: "未填写邀请码，可注册但不归因" });
      return;
    }
    let cancelled = false;
    fetch(`/api/validate-code?code=${encodeURIComponent(c)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.valid) {
          setReferrer({
            valid: true,
            staff_name: d.staff_name,
            staff_branch: d.staff_branch,
          });
        } else {
          setReferrer({ valid: false, message: d.message || "邀请码无效" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/bind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: phone,
        customer_name: name,
        invite_code: code,
      }),
    }).then((x) => x.json());
    setLoading(false);
    const type = res.ok ? (res.alreadyBound ? "warn" : "ok") : "err";
    let text = res.message || "";
    if (res.ok && !res.alreadyBound && res.pointsAwarded) {
      text += `；推荐人已获注册积分 +${res.pointsAwarded}`;
    }
    setMsg({ type, text });
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2>客户注册 / 留资</h2>
        <p className="muted">通过客户经理专属链接或扫码进入，完成注册后完成推荐归因。</p>

        {referrer?.valid ? (
          <div className="msg info">
            推荐人：<strong>{referrer.staff_name}</strong>
            {referrer.staff_branch ? `（${referrer.staff_branch}）` : ""}
          </div>
        ) : referrer ? (
          <div className={`msg ${code ? "err" : "warn"}`}>{referrer.message}</div>
        ) : null}

        <form className="form" onSubmit={onSubmit} style={{ marginTop: 12 }}>
          <label>
            邀请码（可选）
            <input
              className="mono"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="如 ZHANG01"
            />
          </label>
          <label>
            手机号
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="11位手机号"
              required
              inputMode="numeric"
            />
          </label>
          <label>
            姓名
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="真实姓名" required />
          </label>
          <button className="btn" type="submit" disabled={loading || (!!code && referrer !== null && !referrer.valid)}>
            {loading ? "提交中…" : "提交注册"}
          </button>
        </form>

        {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}

        <p className="muted" style={{ marginTop: 16 }}>
          规则提示：同一手机号首次有效绑定后锁定，不可改绑；重复提交将幂等返回原推荐人。
        </p>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="card">加载中…</div>}>
      <JoinInner />
    </Suspense>
  );
}
