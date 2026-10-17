import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/auth/get-admin-session";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "登录",
};

// 后台登录页：已登录用户直接进入后台首页
export default async function AdminLoginPage() {
  // 用完整会话校验：密码变更后旧会话指纹不匹配，应停留在登录页而不是与后台首页互跳
  const session = await getAdminSession();
  if (session?.user) {
    redirect("/admin");
  }
  return (
    <main className="admin-theme admin-login-bg flex min-h-screen items-center justify-center">
      <LoginForm />
    </main>
  );
}
