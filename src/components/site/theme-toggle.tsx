"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// 明暗主题切换按钮：图标显隐交给 CSS，避免服务端与客户端渲染不一致
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // 按当前生效主题取反；首次渲染前 resolvedTheme 尚未就绪，点击时已是最终值
  function toggleTheme(): void {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      aria-label="切换明暗主题"
      title="切换明暗主题"
      onClick={toggleTheme}
      className="btn-plain h-11 w-11 rounded-lg"
    >
      <Sun aria-hidden className="size-5 dark:hidden" />
      <Moon aria-hidden className="hidden size-5 dark:block" />
    </button>
  );
}
