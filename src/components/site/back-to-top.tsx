"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

// 返回顶部按钮：滚动超过 200px 后显示（与官网阈值一致），定位由悬浮控件组容器承载
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll(): void {
      setVisible(window.scrollY > 200);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="返回顶部"
      title="返回顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={"card-base floating-btn" + (visible ? "" : " hide")}
    >
      <ChevronUp aria-hidden />
    </button>
  );
}