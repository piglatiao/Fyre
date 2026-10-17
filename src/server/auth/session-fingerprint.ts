import { createHash } from "node:crypto";

// 密码哈希指纹：写入 JWT，修改密码后旧会话因指纹不匹配而失效
export function createSessionFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 32);
}
