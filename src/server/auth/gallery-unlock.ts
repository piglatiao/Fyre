import { createHmac, timingSafeEqual } from "node:crypto";

// 相册解锁令牌：与文章解锁完全独立，密码修改后旧令牌自动失效
const SECRET = process.env.AUTH_SECRET ?? "firefly-gallery-unlock";

// 生成指定相册的解锁 Cookie 名称
export function galleryUnlockCookieName(albumId: number): string {
  return `firefly_gallery_unlock_${albumId}`;
}

// 计算解锁令牌：相册编号与密码哈希共同参与签名
export function createGalleryUnlockToken(albumId: number, passwordHash: string): string {
  return createHmac("sha256", SECRET).update(`gallery:${albumId}:${passwordHash}`).digest("hex");
}

// 校验解锁令牌：长度或内容不一致均视为无效
export function verifyGalleryUnlockToken(albumId: number, passwordHash: string, token: string): boolean {
  const expected = createGalleryUnlockToken(albumId, passwordHash);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const tokenBuffer = Buffer.from(token, "utf8");
  if (expectedBuffer.length !== tokenBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, tokenBuffer);
}
