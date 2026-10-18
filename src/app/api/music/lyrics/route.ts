import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { verifyMusicLyricsToken } from "@/server/auth/music-lyrics-token";

// 歌词响应上限：防止异常远程文件耗尽内存
const MAX_LYRICS_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 5000;

// 拒绝明显的本机、私网与链路本地地址，减少代理被滥用为内网探针的风险
function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1" || host.startsWith("fe80:")) {
    return true;
  }
  if (host.includes(":") && (host.startsWith("fc") || host.startsWith("fd"))) {
    return true;
  }
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }
  const first = Number.parseInt(match[1], 10);
  const second = Number.parseInt(match[2], 10);
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19))
  );
}

// 远程歌词代理：只接受服务端签发的地址，返回纯文本供播放器解析
export async function GET(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const target = verifyMusicLyricsToken(token);
  if (!target) {
    return errorResponse("invalid_token", "歌词地址无效", 400);
  }
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return errorResponse("invalid_url", "歌词地址无效", 400);
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    isBlockedHostname(url.hostname)
  ) {
    return errorResponse("invalid_url", "歌词地址不受支持", 400);
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
      headers: { accept: "text/plain, application/octet-stream;q=0.8" },
    });
    const contentLength = Number.parseInt(response.headers.get("content-length") ?? "0", 10);
    if (!response.ok || (Number.isFinite(contentLength) && contentLength > MAX_LYRICS_BYTES)) {
      return errorResponse("lyrics_unavailable", "歌词暂时无法获取", 502);
    }
    const text = await response.text();
    if (text.length > MAX_LYRICS_BYTES) {
      return errorResponse("lyrics_too_large", "歌词文件过大", 413);
    }
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return errorResponse("lyrics_unavailable", "歌词暂时无法获取", 502);
  }
}
