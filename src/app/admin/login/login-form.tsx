"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import type { LoginState } from "@/types/login-state";

const initialState: LoginState = {};

// 后台登录表单：使用 Server Action 提交，展示错误信息与提交状态
export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-sm px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">流萤</h1>
        <p className="mt-2 text-sm text-white/85">登录管理后台</p>
      </div>
      <form
        action={formAction}
        className="card-base space-y-4 rounded-(--radius-large) border border-(--line-color) p-6 shadow-xl"
      >
        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            用户名
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className="h-10 w-full rounded-xl border border-(--line-color) bg-(--card-bg) px-3 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--btn-regular-bg)"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-10 w-full rounded-xl border border-(--line-color) bg-(--card-bg) px-3 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--btn-regular-bg)"
          />
        </div>
        {state.error ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="h-10 w-full rounded-xl bg-(--primary) text-sm font-medium text-white shadow-sm transition hover:bg-(--btn-content) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "登录中…" : "登 录"}
        </button>
      </form>
    </div>
  );
}
