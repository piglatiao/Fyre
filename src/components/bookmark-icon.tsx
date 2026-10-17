"use client";

import { useState } from "react";

// 从书签地址提取域名，非法地址返回空串
function readDomain(url: string): string {
  if (!url) {
    return "";
  }
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// 书签/分组图标：支持 emoji、图片地址；条目未填图标时自动取目标站 favicon
export default function BookmarkIcon({
  icon,
  title,
  url,
  className = "",
}: {
  icon: string;
  title: string;
  url?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const trimmedIcon = icon.trim();
  const domain = readDomain(url ?? "");
  const resolved = trimmedIcon || (domain ? `https://a.favicon.im/${encodeURIComponent(domain)}` : "");
  const isImage = /^https?:\/\//i.test(resolved) || resolved.startsWith("/");
  const letter = (title.trim().charAt(0) || "?").toUpperCase();

  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden ${className}`}>
      <span aria-hidden className="text-(--primary)">
        {trimmedIcon && !isImage ? trimmedIcon : letter}
      </span>
      {isImage && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- 图标地址来自后台，可能是任意站点
        <img
          src={resolved}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}
