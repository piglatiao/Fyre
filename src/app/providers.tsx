"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import type { ThemeMode } from "@/types/theme-mode";

// 全局 Provider：明暗主题（默认值由后台设置决定，仍支持跟随系统与手动切换）
export default function Providers({ children, defaultTheme }: { children: ReactNode; defaultTheme: ThemeMode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem>
      {children}
    </ThemeProvider>
  );
}
