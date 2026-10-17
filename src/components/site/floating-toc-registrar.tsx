"use client";

import { useEffect } from "react";
import type { TocItem } from "@/types/toc-item";
import { setFloatingTocItems } from "@/lib/floating-toc-store";

// 目录注册器：文章页/自定义页面把目录条目写入共享状态，悬浮控件组按需渲染目录按钮
export default function FloatingTocRegistrar({ items }: { items: TocItem[] }) {
  useEffect(() => {
    setFloatingTocItems(items);
    return () => setFloatingTocItems([]);
  }, [items]);
  return null;
}