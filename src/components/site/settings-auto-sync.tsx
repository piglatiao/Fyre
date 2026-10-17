"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// 前台设置自动同步：页面渲染时带着设置版本，回到前台或定时与服务器比对，
// 发现后台保存过新设置就自动刷新（router.refresh），实现「后台保存即时生效、无需手动刷新」。
// 刻意不按 document.visibilityState 提前退出：内嵌浏览器/被遮挡窗口里该状态可能长期停在 hidden，
// 但用户其实在看页面，之前正是这种环境下切回标签页看不到新设置
const CHECK_INTERVAL_MS = 20000;
// 交互信号限速：点击/滚轮/按键可能很密集，版本比对需要限速
const ACTIVITY_THROTTLE_MS = 1000;

export default function SettingsAutoSync({ version }: { version: string }) {
  const router = useRouter();
  const knownVersion = useRef(version);

  // 服务端组件每次渲染都会带来最新版本（含 router.refresh 之后），同步到 ref 供比对
  useEffect(() => {
    knownVersion.current = version;
  }, [version]);

  useEffect(() => {
    let stopped = false;
    const check = async (): Promise<void> => {
      if (stopped) {
        return;
      }
      try {
        const response = await fetch("/api/settings/version", { cache: "no-store" });
        if (!response.ok || stopped) {
          return;
        }
        const payload = (await response.json()) as { data?: { version?: string } };
        const latest = payload.data?.version;
        if (!latest || latest === knownVersion.current || stopped) {
          return;
        }
        // 先记下新版本再刷新：刷新期间轮询命中同一版本也不会反复触发
        knownVersion.current = latest;
        router.refresh();
      } catch {
        // 网络异常时忽略，等待下一轮比对
      }
    };
    // 明确的「回到页面」信号（可见性/焦点/页面恢复）不做限速，立即比对
    const onWake = (): void => void check();
    // 交互信号做限速：内置浏览器/被遮挡窗口可能既不投递 visibilitychange 也不触发 focus，
    // 此时用户回到页面后的第一次点击、滚轮或按键就是最可靠的唤醒信号，1 秒内即可比对出变化
    let lastActivityAt = 0;
    const onActivity = (): void => {
      const now = Date.now();
      if (now - lastActivityAt < ACTIVITY_THROTTLE_MS) {
        return;
      }
      lastActivityAt = now;
      void check();
    };
    const activityEvents = ["pointerdown", "wheel", "keydown", "touchstart"];
    void check();
    const timer = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    for (const name of activityEvents) {
      window.addEventListener(name, onActivity, { passive: true });
    }
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
      for (const name of activityEvents) {
        window.removeEventListener(name, onActivity);
      }
    };
  }, [router]);

  return null;
}