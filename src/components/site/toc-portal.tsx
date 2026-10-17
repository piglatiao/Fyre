"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// 把文章目录挂载到主栅格右侧栏插槽（插槽仅在 xl 断点可见）
export default function TocPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("right-sidebar-dynamic"));
  }, []);

  if (!target) {
    return null;
  }
  return createPortal(children, target);
}