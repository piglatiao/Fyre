"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";

// 账号管理：修改昵称与密码（修改密码后旧会话立即失效）
export default function AccountManager({ username, nickname }: { username: string; nickname: string }) {
  const router = useRouter();
  const [nicknameInput, setNicknameInput] = useState(nickname);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // 保存昵称：留空表示清空
  async function handleProfileSubmit(): Promise<void> {
    setSavingProfile(true);
    setMessage(null);
    const result = await requestJsonBody<{ updated: boolean }>("/api/account/profile", "PUT", {
      nickname: nicknameInput,
    });
    setSavingProfile(false);
    if (result.ok) {
      setMessage({ type: "success", text: "昵称已更新" });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 修改密码：本地先确认两次输入一致，避免无效请求
  async function handlePasswordSubmit(): Promise<void> {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "两次输入的新密码不一致" });
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    const result = await requestJsonBody<{ updated: boolean }>("/api/account/password", "PUT", {
      currentPassword,
      newPassword,
    });
    setSavingPassword(false);
    if (result.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChanged(true);
      setMessage(null);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-sky-500/20";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const cardClass = "space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

  return (
    <div className="space-y-6">
      {message ? (
        <p
          role="status"
          className={
            message.type === "error"
              ? "rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400"
              : "rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className={cardClass}>
        <h2 className="text-sm font-semibold">账号信息</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="account-username" className={labelClass}>
              登录账号
            </label>
            <input id="account-username" value={username} disabled className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="account-nickname" className={labelClass}>
              昵称
            </label>
            <input
              id="account-nickname"
              value={nicknameInput}
              onChange={(event) => setNicknameInput(event.target.value)}
              placeholder="展示在后台顶部与文章作者处"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleProfileSubmit()}
            disabled={savingProfile}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {savingProfile ? "保存中…" : "保存昵称"}
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold">修改密码</h2>
        {passwordChanged ? (
          <div className="space-y-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <p>密码已修改，出于安全考虑当前登录会话已失效，请重新登录。</p>
            <Link
              href="/admin/login"
              className="inline-flex rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              前往登录
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="account-current-password" className={labelClass}>
                  当前密码
                </label>
                <input
                  id="account-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="account-new-password" className={labelClass}>
                  新密码（至少 6 位）
                </label>
                <input
                  id="account-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="account-confirm-password" className={labelClass}>
                  确认新密码
                </label>
                <input
                  id="account-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handlePasswordSubmit()}
                disabled={savingPassword}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                {savingPassword ? "提交中…" : "修改密码"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
