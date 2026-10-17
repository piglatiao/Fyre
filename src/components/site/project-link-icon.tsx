"use client";

import { BookOpen, Globe2, Link2, Package, PlayCircle } from "lucide-react";
import { useState } from "react";

// 官网同款 GitHub / Gitee 品牌图形，避免外链图标依赖第三方图片
const brandIcons = {
  github: {
    viewBox: "0 0 640 640",
    path: "M280.5 426.5c-66-8-112.5-55.5-112.5-117c0-25 9-52 24-70c-6.5-16.5-5.5-51.5 2-66c20-2.5 47 8 63 22.5c19-6 39-9 63.5-9s44.5 3 62.5 8.5c15.5-14 43-24.5 63-22c7 13.5 8 48.5 1.5 65.5c16 19 24.5 44.5 24.5 70.5c0 61.5-46.5 108-113.5 116.5c17 11 28.5 35 28.5 62.5v52c0 15 12.5 23.5 27.5 17.5C505 523.5 576 433 576 321c0-141.5-115-257-256.5-257S64 179.5 64 321c0 111 70.5 203 165.5 237.5c13.5 5 26.5-4 26.5-17.5v-40c-7 3-16 5-24 5c-33 0-52.5-18-66.5-51.5c-5.5-13.5-11.5-21.5-23-23c-6-.5-8-3-8-6c0-6 10-10.5 20-10.5c14.5 0 27 9 40 27.5c10 14.5 20.5 21 33 21s20.5-4.5 32-16c8.5-8.5 15-16 21-21",
  },
  gitee: {
    viewBox: "0 0 640 640",
    path: "M320 576C178.6 576 64 461.4 64 320S178.6 64 320 64s256 114.6 256 256s-114.6 256-256 256m129.6-398.2h-177c-52.4 0-94.8 42.4-94.8 94.8v177c0 7 5.7 12.6 12.6 12.6h186.5c47.1 0 85.3-38.2 85.3-85.3v-72.7c0-7-5.7-12.6-12.6-12.6H304.2c-7 0-12.6 5.7-12.6 12.6v31.6c0 6.6 5.1 12.1 11.6 12.6h89.5c6.6 0 12.1 5.1 12.6 11.6v7.3c0 20.9-17 37.9-37.9 37.9H247.3c-7 0-12.6-5.7-12.6-12.6V272.5c0-20.4 16.1-37.1 36.4-37.9h178.6c7 0 12.6-5.7 12.6-12.6v-31.6c0-7-5.6-12.6-12.6-12.6z",
  },
} as const;

// 从后台填写的 astro-icon 名或品牌别名中识别常用品牌
function resolveBrand(icon: string) {
  const normalized = icon.toLowerCase();
  if (normalized.includes("github")) {
    return brandIcons.github;
  }
  if (normalized.includes("gitee")) {
    return brandIcons.gitee;
  }
  return null;
}

// 项目外链图标：支持品牌别名、图片地址与首字兜底
export default function ProjectLinkIcon({
  icon,
  label,
  className = "size-4",
}: {
  icon: string;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const trimmed = icon.trim();
  const normalized = trimmed.toLowerCase();
  const brand = resolveBrand(trimmed);
  const isImage = /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/");
  const letter = (label.trim().charAt(0) || "?").toUpperCase();
  const FallbackIcon = /(book|doc|readme)/.test(normalized)
    ? BookOpen
    : /(play|demo|preview)/.test(normalized)
      ? PlayCircle
      : /(package|npm|module)/.test(normalized)
        ? Package
        : /(globe|website|home)/.test(normalized)
          ? Globe2
          : /(link|url)/.test(normalized)
            ? Link2
            : null;

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      {brand ? (
        <svg aria-hidden viewBox={brand.viewBox} className="size-full fill-current">
          <path d={brand.path} />
        </svg>
      ) : FallbackIcon ? (
        <FallbackIcon aria-hidden className="size-full" />
      ) : isImage && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- 图标可来自后台上传或任意外链
        <img
          src={trimmed}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden className="text-[0.9em] font-bold leading-none">{letter}</span>
      )}
    </span>
  );
}
