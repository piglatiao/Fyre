import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { resolveInsideUploadRoot } from "@/lib/upload-path";

// 常见媒体扩展名 → Content-Type
function contentTypeOf(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".pdf":
      return "application/pdf";
    case ".zip":
      return "application/zip";
    case ".7z":
      return "application/x-7z-compressed";
    case ".rar":
      return "application/vnd.rar";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".ppt":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".txt":
    case ".log":
      return "text/plain; charset=utf-8";
    case ".md":
    case ".markdown":
      return "text/markdown; charset=utf-8";
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".yaml":
    case ".yml":
      return "text/yaml; charset=utf-8";
    case ".mp3":
      return "audio/mpeg";
    case ".m4a":
      return "audio/mp4";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".flac":
      return "audio/flac";
    default:
      return "application/octet-stream";
  }
}

// 解析 Range 请求头：仅支持单段 bytes=start-end / bytes=start- / bytes=-suffix
function parseRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) {
    return null;
  }
  const startRaw = match[1];
  const endRaw = match[2];
  let start = startRaw ? Number.parseInt(startRaw, 10) : Number.NaN;
  let end = endRaw ? Number.parseInt(endRaw, 10) : Number.NaN;
  if (Number.isNaN(start) && Number.isNaN(end)) {
    return null;
  }
  if (Number.isNaN(start)) {
    // 后缀范围：取文件末尾 N 字节
    start = Math.max(0, size - end);
    end = size - 1;
  } else if (Number.isNaN(end)) {
    end = size - 1;
  }
  if (start > end || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

// 本机媒体文件输出：仅允许读取上传根目录内的文件，支持 Range（视频拖动所需），带长缓存头
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params;
  const target = resolveInsideUploadRoot(segments);
  // 防御路径穿越：目标必须位于上传根目录内
  if (!target) {
    return new Response("Not Found", { status: 404 });
  }
  try {
    const info = await stat(target);
    if (!info.isFile()) {
      return new Response("Not Found", { status: 404 });
    }
    const baseHeaders = {
      "Content-Type": contentTypeOf(target),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    };

    // 视频等媒体按 Range 返回 206，部分浏览器（Safari）依赖该能力播放
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      const range = parseRange(rangeHeader, info.size);
      if (!range) {
        return new Response("Range Not Satisfiable", {
          status: 416,
          headers: { ...baseHeaders, "Content-Range": `bytes */${info.size}` },
        });
      }
      const stream = createReadStream(target, { start: range.start, end: range.end });
      return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${range.start}-${range.end}/${info.size}`,
          "Content-Length": String(range.end - range.start + 1),
        },
      });
    }

    const stream = createReadStream(target);
    return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(info.size) },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
