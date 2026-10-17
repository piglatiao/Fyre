import { auth } from "@/server/auth/auth";

// Next 16 起 middleware 更名为 proxy：作为后台路由的第一道鉴权拦截
// 第二道保险在 src/app/admin/(protected)/layout.tsx 中做服务端会话校验
export const proxy = auth;

export const config = {
  matcher: ["/admin/:path*"],
};
