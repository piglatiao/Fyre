"use client";

import { useEffect, useState } from "react";

// 页面下滚超过该距离后隐藏指示器（与官网行为一致）
const HIDE_AFTER_PX = 100;

// 向下滚动指示器：只在「全屏壁纸 + 首页」渲染（由 site-shell 控制），
// 这里只负责跟随滚动状态淡出，避免遮挡正文
export default function ScrollDownIndicator() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // 依据当前滚动位置刷新显示状态（节流到状态真正变化时才 setState）
    const update = (): void => {
      const offset = window.pageYOffset || document.documentElement.scrollTop || 0;
      const next = offset > HIDE_AFTER_PX;
      setHidden((prev) => (prev === next ? prev : next));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <a
      href="#main-grid"
      aria-label="向下滚动"
      className={`scroll-down-indicator${hidden ? " hide" : ""}`}
    >
      <svg width="2rem" height="2rem" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M11.6 14.9a1 1 0 0 1-.3-.2l-4.6-4.6a1 1 0 1 1 1.4-1.4l3.9 3.9 3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.1.2Z" />
      </svg>
    </a>
  );
}
