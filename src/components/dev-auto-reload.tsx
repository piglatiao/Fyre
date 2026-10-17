"use client";

import { useEffect } from "react";

// 开发期自动刷新守门员：页面渲染时携带源码版本戳，客户端定时与服务器比对，
// 一旦发现源码已更新（长时间挂起的标签页没收到热更新）就自动刷新，避免停留在旧代码上
const CHECK_INTERVAL_MS = 15000;
const MIN_RELOAD_GAP_MS = 10000;

export default function DevAutoReload({ stamp }: { stamp: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !stamp || stamp === "prod") {
      return;
    }
    let stopped = false;
    let lastReloadAt = 0;
    // 页面是否处于“用户能看到”的状态：可见或有焦点。宿主把页面长期判为 hidden 时这里为 false
    const pageAwake = (): boolean => document.visibilityState === "visible" || document.hasFocus();
    // 源码已更新但页面当时在后台：先记下待刷新标记，等回到前台再刷新。
    // 隐藏状态下刷新出来的新页面会停在“不重绘、不加载媒体”的状态，横幅会一直空白
    let pendingReload = false;
    const reloadNow = (): void => {
      if (stopped || Date.now() - lastReloadAt < MIN_RELOAD_GAP_MS) {
        return;
      }
      lastReloadAt = Date.now();
      window.location.reload();
    };
    const check = async (): Promise<void> => {
      try {
        const response = await fetch("/api/dev/version", { cache: "no-store" });
        if (!response.ok || stopped) {
          return;
        }
        const payload = (await response.json()) as { data?: { stamp?: string } };
        const latest = payload.data?.stamp;
        if (!latest || latest === stamp || stopped) {
          return;
        }
        if (!pageAwake()) {
          pendingReload = true;
          return;
        }
        pendingReload = false;
        reloadNow();
      } catch {
        // 网络异常时忽略，等待下一轮比对
      }
    };
    // 回到前台/获得焦点时立即补刷一次（存在待刷新标记时）
    const onWake = (): void => {
      if (!pendingReload || !pageAwake()) {
        return;
      }
      pendingReload = false;
      reloadNow();
    };
    void check();
    const timer = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
    };
  }, [stamp]);

  return null;
}