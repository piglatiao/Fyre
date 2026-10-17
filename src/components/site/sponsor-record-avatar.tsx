"use client";

import { useState } from "react";

// 打赏者头像：图片加载失败时自动回退到名称首字
export default function SponsorRecordAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--btn-regular-bg) text-sm font-bold text-(--primary)">
      <span aria-hidden>{name.trim().charAt(0) || "赏"}</span>
      {avatarUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- 头像来自后台上传或外部地址
        <img
          src={avatarUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}
