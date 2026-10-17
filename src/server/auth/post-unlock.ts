import { createHmac, timingSafeEqual } from "node:crypto";

// 文章解锁令牌：基于 AUTH_SECRET 的 HMAC，密码修改后旧令牌自动失效
const SECRET = process.env.AUTH_SECRET ?? "firefly-post-unlock";

// 生成解锁 Cookie 名称（按文章区分）
export function unlockCookieName(postId: number): string {
  return `firefly_post_unlock_${postId}`;
}

// 计算解锁令牌：postId + 密码哈希参与签名
export function createUnlockToken(postId: number, passwordHash: string): string {
  return createHmac("sha256", SECRET).update(`post:${postId}:${passwordHash}`).digest("hex");
}

// 校验解锁令牌：长度不同或内容不同都视为无效
export function verifyUnlockToken(postId: number, passwordHash: string, token: string): boolean {
  const expected = createUnlockToken(postId, passwordHash);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const tokenBuffer = Buffer.from(token, "utf8");
  if (expectedBuffer.length !== tokenBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, tokenBuffer);
}