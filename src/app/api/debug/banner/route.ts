import { appendFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";

// 开发期横幅诊断接口：接收页面上报的横幅媒体状态，追加写入系统临时目录下的日志文件。
// 仅在非生产环境启用，避免线上暴露调试入口。
const LOG_FILE = join(tmpdir(), "firefly-banner-debug.log");
const MAX_BODY = 8 * 1024;

// 未知接口统一 404 响应
function notFound(): NextResponse {
  return NextResponse.json({ ok: false, error: { code: "not_found", message: "接口不存在" } }, { status: 404 });
}

// 接收上报：POST /api/debug/banner
export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return notFound();
  }
  const body = (await request.text()).slice(0, MAX_BODY).trim();
  if (body) {
    await appendFile(LOG_FILE, `[${new Date().toISOString()}] ${body}\n`, "utf8").catch(() => undefined);
  }
  return NextResponse.json({ ok: true, data: null });
}

// 读取最近日志：GET /api/debug/banner?lines=200
export async function GET(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return notFound();
  }
  const raw = Number(new URL(request.url).searchParams.get("lines") ?? "200");
  const lines = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 2000) : 200;
  const text = await readFile(LOG_FILE, "utf8").catch(() => "");
  const rows = text.trim().length > 0 ? text.trim().split("\n").slice(-lines) : [];
  return NextResponse.json({ ok: true, data: rows });
}