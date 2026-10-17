import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { MediaType } from "@/generated/prisma/client";
import type { StoredMediaFile } from "@/types/stored-media-file";
import type { MediaStorage } from "./media-storage.interface";
import { MediaUploadError } from "./media-upload-error";
import { faststartMp4 } from "@/lib/mp4-faststart";

// 图片与视频的单文件大小上限
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
// 其它文件（文档/压缩包/音频等）的单文件大小上限
const MAX_FILE_BYTES = 50 * 1024 * 1024;
// 允许上传的图片类型白名单
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
// 允许上传的视频类型白名单：键为 MIME，值为落盘扩展名
const ALLOWED_VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
]);
// 允许上传的其它文件类型：键为 MIME，值为落盘扩展名
const ALLOWED_FILE_TYPES = new Map([
  ["application/pdf", "pdf"],
  ["application/zip", "zip"],
  ["application/x-7z-compressed", "7z"],
  ["application/vnd.rar", "rar"],
  ["application/x-rar-compressed", "rar"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.ms-powerpoint", "ppt"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
  ["text/plain", "txt"],
  ["text/markdown", "md"],
  ["text/csv", "csv"],
  ["application/json", "json"],
  ["text/yaml", "yaml"],
  ["application/x-yaml", "yaml"],
  ["audio/mpeg", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/wav", "wav"],
  ["audio/ogg", "ogg"],
  ["audio/flac", "flac"],
]);
// octet-stream 兜底时允许的扩展名（浏览器对部分类型上报不准确）
const FALLBACK_EXTENSIONS = new Set([
  "pdf", "zip", "7z", "rar",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "md", "markdown", "csv", "json", "yaml", "yml", "log",
  "mp3", "m4a", "wav", "ogg", "flac",
  "mp4", "webm",
]);
// 纯文本类文件按原始扩展名保存（text/plain 上报时保留 .md 等后缀）
const TEXT_LIKE_EXTENSIONS = new Set(["md", "markdown", "txt", "csv", "json", "yaml", "yml", "log"]);
// 转码 WebP 的质量参数
const WEBP_QUALITY = 82;

// 随机文件名后缀：避免同名覆盖，同时不使用用户原始文件名以杜绝路径穿越
function randomSuffix(): string {
  return Math.random().toString(16).slice(2, 10);
}

// 从原始文件名提取安全扩展名：仅保留字母数字，长度不超过 8
function safeExtensionOf(originalName: string): string {
  const extension = path.extname(originalName).slice(1).toLowerCase();
  return /^[a-z0-9]{1,8}$/.test(extension) ? extension : "";
}

// 本机磁盘媒体存储：按 年/月 目录落盘，图片统一转 WebP（GIF 保留动图原格式），
// 视频与其它文件原样保存
export class LocalMediaStorage implements MediaStorage {
  constructor(private readonly rootDir: string) {}

  async save(input: { buffer: Buffer; originalName: string; mimeType: string }): Promise<StoredMediaFile> {
    const originalExtension = safeExtensionOf(input.originalName);
    const videoExtension = ALLOWED_VIDEO_TYPES.get(input.mimeType);
    let fileExtension = ALLOWED_FILE_TYPES.get(input.mimeType);
    const isImage = ALLOWED_IMAGE_TYPES.has(input.mimeType);
    // 浏览器上报 octet-stream 时按原始扩展名兜底放行
    if (!videoExtension && !fileExtension && !isImage) {
      const isGenericType = !input.mimeType || input.mimeType === "application/octet-stream";
      if (isGenericType && FALLBACK_EXTENSIONS.has(originalExtension)) {
        fileExtension = originalExtension;
      } else {
        throw new MediaUploadError("不支持该文件类型（支持图片、视频、文档、压缩包与音频等）");
      }
    }
    // 纯文本类保留原始扩展名（例如 .md 不会被改名为 .txt）
    if (fileExtension === "txt" && TEXT_LIKE_EXTENSIONS.has(originalExtension)) {
      fileExtension = originalExtension;
    }
    if (input.buffer.byteLength === 0) {
      throw new MediaUploadError("上传文件内容为空");
    }
    const maxBytes = isImage ? MAX_IMAGE_BYTES : videoExtension ? MAX_VIDEO_BYTES : MAX_FILE_BYTES;
    if (input.buffer.byteLength > maxBytes) {
      throw new MediaUploadError(
        isImage ? "图片大小不能超过 10MB" : videoExtension ? "视频大小不能超过 100MB" : "文件大小不能超过 50MB",
      );
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // 视频与其它文件落盘（作为横幅壁纸、附件等资源使用）；
    // MP4 自动重排为 fast-start：浏览器无需下完整个文件即可拿到元数据出画
    const passthroughExtension = videoExtension ?? fileExtension;
    if (passthroughExtension) {
      const storedFilename = `${Date.now()}-${randomSuffix()}.${passthroughExtension}`;
      const directory = path.join(this.rootDir, year, month);
      await mkdir(directory, { recursive: true });
      const passthroughOutput = passthroughExtension === "mp4" ? faststartMp4(input.buffer) : input.buffer;
      await writeFile(path.join(directory, storedFilename), passthroughOutput);
      return {
        filename: storedFilename,
        url: `/uploads/${year}/${month}/${storedFilename}`,
        mimeType: input.mimeType || "application/octet-stream",
        size: passthroughOutput.byteLength,
        type: MediaType.FILE,
      };
    }

    const isGif = input.mimeType === "image/gif";
    const extension = isGif ? "gif" : "webp";
    const filename = `${Date.now()}-${randomSuffix()}.${extension}`;
    const directory = path.join(this.rootDir, year, month);
    await mkdir(directory, { recursive: true });

    const output = isGif
      ? input.buffer
      : await sharp(input.buffer).rotate().webp({ quality: WEBP_QUALITY }).toBuffer();
    await writeFile(path.join(directory, filename), output);

    return {
      filename,
      url: `/uploads/${year}/${month}/${filename}`,
      mimeType: isGif ? "image/gif" : "image/webp",
      size: output.byteLength,
      type: MediaType.IMAGE,
    };
  }

  async removeByUrl(url: string): Promise<void> {
    const prefix = "/uploads/";
    if (!url.startsWith(prefix)) {
      return;
    }
    const root = path.resolve(this.rootDir);
    const target = path.resolve(root, url.slice(prefix.length));
    // 防御路径穿越：目标必须位于上传根目录内
    if (!target.startsWith(root + path.sep)) {
      return;
    }
    await unlink(target).catch(() => undefined);
  }
}