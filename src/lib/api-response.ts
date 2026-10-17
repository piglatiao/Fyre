import { NextResponse } from "next/server";

// 统一 API 响应格式：成功 { ok: true, data }，失败 { ok: false, error: { code, message } }
export function okResponse<T>(data: T): NextResponse {
  return NextResponse.json({ ok: true, data });
}

// 失败响应：code 为机器可读错误码，status 为 HTTP 状态码
export function errorResponse(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}
