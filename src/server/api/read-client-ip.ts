import type { NextRequest } from "next/server";

// 读取访客 IP：优先使用反向代理写入的首个 X-Forwarded-For 地址
export function readClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}
