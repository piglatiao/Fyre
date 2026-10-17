import path from "node:path";

// 上传根目录：默认 data/uploads（静态字面量，避免打包器追踪整个项目），可用 UPLOAD_DIR 覆盖
export function resolveUploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.join(process.cwd(), "data", "uploads");
}

// 把路径片段解析成上传根目录内的绝对路径，越界返回 null（防御路径穿越）
export function resolveInsideUploadRoot(segments: readonly string[]): string | null {
  const root = resolveUploadRoot();
  const target = path.resolve(root, ...segments);
  if (!target.startsWith(root + path.sep)) {
    return null;
  }
  return target;
}