# 华夏银行 · 客户经理邀请归因 + 积分（MVP）

本地可一键启动的最小可用产品：运营发码 → 客户扫码/填码注册归因 → 业务事件入账积分 → 业务员查看客户与积分。

## 技术栈

- Next.js 15（App Router）+ TypeScript + React 19
- SQLite（Node.js 内置 `node:sqlite`，无需原生编译）
- `qrcode` 生成邀请二维码
- 单仓库，数据文件：`data/hx-invite.db`（启动时自动建表 + 种子数据）

> 需要 **Node.js ≥ 22**（推荐 22/24，本机已验证 Node 24）。

## 安装与启动

```bash
cd /workspace/hx-invite
npm install
npm run dev
```

浏览器打开：**http://localhost:3000**

生产模式（可选）：

```bash
npm run build && npm start
```

首次访问任意会触库的页面/API 时自动：
1. 创建 `data/hx-invite.db`
2. 建四张表：`staff` / `invite_code` / `attribution` / `points_ledger`
3. 写入 3 个种子业务员及邀请码

## 种子业务员（演示用）

| 姓名 | 网点 | 邀请码 | 落地页 |
|------|------|--------|--------|
| 张经理 | 北京分行朝阳支行 | `ZHANG01` | /join?code=ZHANG01 |
| 李经理 | 上海分行浦东支行 | `LI02` | /join?code=LI02 |
| 王经理 | 深圳分行福田支行 | `WANG03` | /join?code=WANG03 |

## 页面

| 路径 | 说明 |
|------|------|
| `/` | 首页导航 + 种子码一览 |
| `/admin` | 运营台：人员、发码、规则、导出 CSV |
| `/staff` | 业务员台：下拉切换业务员（免登录），看码/链接/二维码/客户/积分；可「模拟开户」 |
| `/join?code=XXX` | 客户落地页：展示推荐人，手机号+姓名注册 |

## 推荐演示路径（约 3 分钟）

1. 打开 http://localhost:3000 ，确认三个种子码可见
2. 打开 **运营台** `/admin`，查看积分规则：`register=+10`，`open_account=+50`
3. 打开 **张经理落地页** `/join?code=ZHANG01`，应显示推荐人「张经理」
4. 用手机号如 `13800000001`、姓名「测试客户甲」提交注册  
   - 提示归属张经理，并给张经理 **+10** 注册积分
5. 打开 **业务员台** `/staff`，选择「张经理」  
   - 可见专属链接、二维码、客户列表、积分明细（register +10）
6. 在客户行点击 **「模拟开户 +50」**  
   - 积分变为 60；再次点击应提示幂等已入账
7. 再用同一手机号走李经理码 `/join?code=LI02` 注册  
   - 应提示「已归属原推荐人：张经理」，**不改绑**
8. （可选）运营台导出归因 / 积分 CSV

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/invite-codes` | 业务员列表（含码、客户数、积分） |
| POST | `/api/invite-codes` | `{action:"create_staff",name,branch}` 或 `{action:"issue_code",staff_id}` |
| POST | `/api/invite-codes/disable` | `{id}` 停用码 |
| GET | `/api/validate-code?code=` | 校验邀请码 |
| POST | `/api/bind` | `{customer_id,customer_name,invite_code}` 注册绑定（幂等） |
| POST | `/api/points` | `{customer_id,event_type,biz_ref?,note?}` 积分入账（按归因找 staff；`biz_ref` 幂等） |
| GET | `/api/staff?id=` | 业务员看板数据 |
| GET | `/api/export?type=attribution\|points` | 导出 CSV |
| GET | `/api/qrcode?url=` | 二维码 PNG |

## 业务规则（MVP）

- 码无效/停用：落地页提示，不允许带码提交绑定
- 无码可注册，但不归因、不积分
- 同一 `customer_id`（手机号）首次有效绑定后锁定，不可改绑；重复提交幂等返回原结果
- 仅存在锁定归因时才入账积分；同一 `biz_ref` 幂等防重复
- 不做多级裂变、登录鉴权、复杂风控/商城


## Render 免费部署

适合不懂开发、只想免费上线演示：用 Render 免费 Web Service（无需 Docker、无付费依赖）。

### 一键部署步骤

1. 把本仓库推到 **GitHub / GitLab / Bitbucket**
2. 打开 Render Blueprint：  
   `https://dashboard.render.com/blueprint/new?repo=<你的仓库 HTTPS 地址>`  
   （把 `<你的仓库 HTTPS 地址>` 换成例如 `https://github.com/你的用户名/hx-invite`）
3. 登录 Render → 授权 Git → 确认 Blueprint 里是 **hx-invite / plan free** → 点 **Apply**
4. 等构建完成，打开服务给的 `*.onrender.com` 地址即可

仓库根目录已有 `render.yaml`：`runtime: node`，`buildCommand: npm install && npm run build`，`startCommand: npm start`（监听 Render 注入的 `PORT`），健康检查路径 `/`。

可选环境变量（Blueprint 已带默认值）：

| 变量 | 默认 | 说明 |
|------|------|------|
| `NODE_VERSION` | `22.22.0` | 需 ≥22（使用 `node:sqlite`） |
| `DATA_DIR` | `./data` | SQLite 目录；启动访问时自动建表 + seed |
| `NEXT_PUBLIC_BASE_URL` | （可不设） | 若以后要写死绝对外链可用；当前邀请链接用浏览器相对域名 |

### 免费版务必知道

- **空闲约 15 分钟会休眠**；下次打开可能要等约 **几十秒～1 分钟** 冷启动，属正常现象。
- **免费实例没有持久盘**：本地 SQLite（`DATA_DIR`）写在**临时文件系统**上。服务**重新部署、重启或休眠唤醒**后，数据可能被清空，会重新自动建表并写入种子业务员。正式长期数据请勿依赖免费盘。
- 免费额度有月度实例小时限制；休眠中不消耗运行小时。详见 [Render Free](https://render.com/docs/free)。

## 重置数据

删除数据库文件后重启即可重新 seed：

```bash
rm -f data/hx-invite.db data/hx-invite.db-*
npm run dev
```

## 已知限制

- 免登录，仅适合本地/内网演示
- 一人默认一有效码；重新发码会停用旧码（旧码历史仍保留）
- 未校验「业务员邀请自己」
- 积分规则写在代码常量中，运营台只读展示
