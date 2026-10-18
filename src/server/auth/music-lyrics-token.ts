import { createHmac, timingSafeEqual } from "node:crypto";

// 歌词代理令牌：仅允许服务端签发的远程地址通过代理，避免公开任意 URL 抓取
const SECRET = process.env.AUTH_SECRET ?? "firefly-music-lyrics";

// 生成 URL 的 HMAC 签名令牌
function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(`music-lyrics:${payload}`).digest("base64url");
}

// 创建歌词代理令牌
export function createMusicLyricsToken(url: string): string {
  const payload = Buffer.from(url, "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

// 校验并还原歌词地址；格式错误或签名不匹配时返回 null
export function verifyMusicLyricsToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}
