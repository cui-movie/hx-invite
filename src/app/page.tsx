export default function HomePage() {
  return (
    <main>
      <div className="card">
        <h2>客户经理邀请归因 + 积分（MVP）</h2>
        <p className="muted">
          运营为客户经理发放专属邀请码 → 客户扫码/填码注册完成归因锁定 → 业务事件入账积分。
          本系统为本地演示版，免登录，数据存于本地 SQLite。
        </p>
      </div>

      <div className="hero-links grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        <a className="card-link" href="/admin">
          <div className="t">运营台</div>
          <div className="d">人员列表、发码/停用、积分规则、导出 CSV</div>
        </a>
        <a className="card-link" href="/staff">
          <div className="t">业务员台</div>
          <div className="d">我的邀请码、专属链接与二维码、客户与积分</div>
        </a>
        <a className="card-link" href="/join?code=ZHANG01">
          <div className="t">客户落地页（示例）</div>
          <div className="d">用张经理码 ZHANG01 体验注册归因</div>
        </a>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>演示种子业务员</h3>
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>网点</th>
              <th>邀请码</th>
              <th>落地页</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>张经理</td>
              <td>北京分行朝阳支行</td>
              <td className="mono">ZHANG01</td>
              <td><a href="/join?code=ZHANG01">/join?code=ZHANG01</a></td>
            </tr>
            <tr>
              <td>李经理</td>
              <td>上海分行浦东支行</td>
              <td className="mono">LI02</td>
              <td><a href="/join?code=LI02">/join?code=LI02</a></td>
            </tr>
            <tr>
              <td>王经理</td>
              <td>深圳分行福田支行</td>
              <td className="mono">WANG03</td>
              <td><a href="/join?code=WANG03">/join?code=WANG03</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
