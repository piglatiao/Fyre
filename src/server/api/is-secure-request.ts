import type { NextRequest } from "next/server";

// 判断请求是否经 HTTPS 到达，兼容反向代理传递的协议头
export function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }
  return request.nextUrl.protocol === "https:";
}
