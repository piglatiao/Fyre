"use client";

import { House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BackToTop from "./back-to-top";
import FloatingToc from "./floating-toc";
import ImmersiveReading from "./immersive-reading";

// 悬浮控件组：目录（有目录时）/ 主页（非首页）/ 返回顶部（滚动后），固定右下角纵向排列
export default function FloatingControls() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <div className="floating-controls-container">
      <ImmersiveReading />
      <FloatingToc />
      <Link
        href="/"
        aria-label="回到主页"
        title="主页"
        className={`card-base floating-btn${onHome ? " hide" : ""}`}
      >
        <House aria-hidden />
      </Link>
      <BackToTop />
    </div>
  );
}