"use client";

import { Moon, Palette, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { ThemeMode } from "@/types/theme-mode";
import {
  applyPostListLayout,
  readPostListLayout,
  type PostListLayoutPreference,
} from "@/lib/post-list-layout";

// 本地存储键：与后台默认值分离，访客可临时调整卡片透明度
const OPACITY_STORAGE_KEY = "firefly-card-opacity";

// 读取本地存储中的数值偏好；缺失、非法或不可用时回退到后台默认值
function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const stored = Number.parseFloat(window.localStorage.getItem(key) ?? "");
    return Number.isFinite(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

// 显示设置：主题模式、卡片透明度与文章列表布局（配色固定取后台设置）
export default function DisplaySettings({
  defaultCardOpacity,
}: {
  defaultCardOpacity: number;
}) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  // 访客偏好一律懒初始化读取本地存储（面板内容打开后才渲染，服务端与客户端首屏输出一致，不会产生水合差异）；
  // 后台默认值变化时，site-header 传入的 key 会触发重新挂载并重新读取
  const [opacity, setOpacity] = useState<number>(() => readStoredNumber(OPACITY_STORAGE_KEY, defaultCardOpacity));
  // 文章列表布局偏好：auto 表示跟随屏幕宽度（窄屏网格、宽屏列表）
  const [layout, setLayout] = useState<PostListLayoutPreference>(readPostListLayout);

  // 把访客偏好同步到根元素 CSS 变量（仅卡片透明度）
  useEffect(() => {
    document.documentElement.style.setProperty("--card-transparent-opacity", String(opacity));
  }, [opacity]);

  // 更新文章列表布局：写入根元素属性与本地存储（auto 恢复按屏幕宽度自动选择）
  function updateLayout(value: PostListLayoutPreference): void {
    setLayout(value);
    applyPostListLayout(value);
  }

  // 更新卡片透明度并写入本地存储
  function updateOpacity(value: number): void {
    setOpacity(value);
    document.documentElement.style.setProperty("--card-transparent-opacity", String(value));
    window.localStorage.setItem(OPACITY_STORAGE_KEY, String(value));
  }

  // 恢复后台配置的默认卡片透明度
  function resetDefaults(): void {
    updateOpacity(defaultCardOpacity);
  }

  const layoutOptions: { value: PostListLayoutPreference; label: string }[] = [
    { value: "auto", label: "自动" },
    { value: "list", label: "列表" },
    { value: "grid", label: "网格" },
  ];

  const modeOptions: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: "亮色", Icon: Sun },
    { value: "dark", label: "暗色", Icon: Moon },
    { value: "system", label: "跟随系统", Icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="显示设置"
        title="显示设置"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="btn-plain h-11 w-11 rounded-lg"
      >
        <Palette aria-hidden className="size-5" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="关闭显示设置"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="float-panel absolute right-0 top-full z-50 mt-2 w-72 p-4">
            <p className="mb-2 text-sm font-bold">主题模式</p>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {modeOptions.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={
                    "flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition " +
                    (theme === value
                      ? "bg-(--btn-content) text-white"
                      : "bg-(--btn-regular-bg) text-(--btn-content) hover:bg-(--btn-regular-bg-hover)")
                  }
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </button>
              ))}
            </div>
            <div className="mb-3">
              <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                <span>卡片透明度</span>
                <span className="text-xs font-normal text-(--btn-content)">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={opacity}
                aria-label="卡片透明度"
                onChange={(event) => updateOpacity(Number.parseFloat(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-(--btn-regular-bg)"
              />
            </div>
            <div className="mb-3">
              <p className="mb-1.5 text-sm font-bold">文章列表布局</p>
              <div className="grid grid-cols-3 gap-2">
                {layoutOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateLayout(value)}
                    aria-pressed={layout === value}
                    className={
                      "h-9 rounded-lg text-xs font-medium transition " +
                      (layout === value
                        ? "bg-(--btn-content) text-white"
                        : "bg-(--btn-regular-bg) text-(--btn-content) hover:bg-(--btn-regular-bg-hover)")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={resetDefaults}
              className="w-full rounded-lg bg-(--btn-regular-bg) py-2 text-xs font-medium text-(--btn-content) transition hover:bg-(--btn-regular-bg-hover)"
            >
              恢复后台默认透明度
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
