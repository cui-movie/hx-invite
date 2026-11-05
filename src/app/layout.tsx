import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "华夏银行 · 客户经理邀请归因积分",
  description: "客户经理专属邀请码归因与积分 MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="container">
          <header className="header">
            <div className="brand">
              <div className="logo">华</div>
              <span>华夏银行 · 邀请归因积分</span>
            </div>
            <nav className="nav">
              <a href="/">首页</a>
              <a href="/admin">运营台</a>
              <a href="/staff">业务员台</a>
              <a href="/join">客户落地页</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
