import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data"));
for (const f of ["hx-invite.db", "hx-invite.db-shm", "hx-invite.db-wal"]) {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
console.log(`已删除 ${dir}/hx-invite.db* 。请重启 npm run dev，下次访问会自动建库并写入种子业务员。`);
