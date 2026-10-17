"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// 把页面级内容挂载到壁纸横幅的浮层插槽（文章页标题、独立页面标题等）
export default function BannerPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("banner-overlay-slot"));
  }, []);

  if (!target) {
    return null;
  }
  return createPortal(children, target);
}