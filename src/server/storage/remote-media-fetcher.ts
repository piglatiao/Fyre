import { MediaUploadError } from "./media-upload-error";
import type { RemoteMediaFetcher } from "./remote-media-fetcher.interface";

// 远程文件体积上限：与媒体存储的视频单文件上限保持一致
const MAX_BYTES = 100 * 1024 * 1024;
// 下载超时（毫秒）
const FETCH_TIMEOUT_MS = 60000;

// 内网与回环地址判定：避免后台被当作内网探测跳板（SSRF）
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host === "::1" || host === "0.0.0.0" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (/^(127|10|192\.168|169\.254)\./.test(host)) {
    return true;
  }
  const privateRange = /^172\.(\d{1,2})\./.exec(host);
  if (privateRange) {
    const second = Number(privateRange[1]);
    return second >= 16 && second <= 31;
  }
  return false;
}

// 从地址推断原始文件名：取路径最后一段，解码失败时使用默认名
function filenameFromUrl(target: URL): string {
  const segment = target.pathname.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(segment).slice(0, 120) || "remote-file";
  } catch {
    return "remote-file";
  }
}

// 基于 fetch 的远程媒体抓取实现：仅支持 http/https，跟随跳转后再次校验目标主机
export class HttpRemoteMediaFetcher implements RemoteMediaFetcher {
  async fetch(url: string): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      throw new MediaUploadError("文件地址不合法");
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      throw new MediaUploadError("只支持 http/https 地址");
    }
    if (isBlockedHost(target.hostname)) {
      throw new MediaUploadError("出于安全考虑，不支持转存内网地址");
    }

    let response: Response;
    try {
      response = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    } catch {
      throw new MediaUploadError("远程文件下载失败，请确认地址可访问");
    }
    const finalUrl = new URL(response.url || target.toString());
    if (isBlockedHost(finalUrl.hostname)) {
      throw new MediaUploadError("出于安全考虑，不支持转存内网地址");
    }
    if (!response.ok) {
      throw new MediaUploadError(`远程文件下载失败（HTTP ${response.status}）`);
    }
    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_BYTES) {
      throw new MediaUploadError("远程文件超过 100MB 上限");
    }

    const chunks: Uint8Array[] = [];
    let received = 0;
    if (response.body) {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        received += chunk.byteLength;
        if (received > MAX_BYTES) {
          throw new MediaUploadError("远程文件超过 100MB 上限");
        }
        chunks.push(chunk);
      }
    }
    if (received === 0) {
      throw new MediaUploadError("远程文件内容为空");
    }

    const mimeType = (response.headers.get("content-type") ?? "").split(";")[0].trim() || "application/octet-stream";
    return { buffer: Buffer.concat(chunks), mimeType, originalName: filenameFromUrl(target) };
  }
}