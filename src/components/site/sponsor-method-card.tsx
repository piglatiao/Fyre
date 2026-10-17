"use client";

import { ExternalLink, ImageOff } from "lucide-react";
import { useState } from "react";
import type { SponsorMethod } from "@/types/sponsor-method";
import SponsorMethodIcon from "./sponsor-method-icon";

// 打赏方式卡片：收款码、外部链接与品牌图标，二维码加载失败时保留占位
export default function SponsorMethodCard({ method }: { method: SponsorMethod }) {
  const [qrFailed, setQrFailed] = useState(false);
  return (
    <article className="flex flex-col items-center rounded-lg border border-neutral-200 bg-white/60 p-6 transition-colors hover:border-(--primary) dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="mb-4 flex items-center gap-3">
        <SponsorMethodIcon
          icon={method.icon}
          title={method.name}
          className="size-8 text-2xl text-neutral-900 dark:text-neutral-100"
        />
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{method.name}</h2>
      </div>
      {method.description ? (
        <p className="mb-4 text-center text-sm text-neutral-600 dark:text-neutral-400">{method.description}</p>
      ) : null}
      {method.qrCodeUrl ? (
        <div className="relative mb-4 aspect-square w-full max-w-[200px] overflow-hidden rounded-lg bg-white p-4 shadow-md">
          {qrFailed ? (
            <div className="flex size-full flex-col items-center justify-center gap-2 rounded-md bg-neutral-50 text-xs text-neutral-400">
              <ImageOff aria-hidden className="size-6" />
              收款码暂不可用
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- 收款码来自后台上传或外部地址
            <img
              src={method.qrCodeUrl}
              alt={`${method.name} 收款码`}
              loading="lazy"
              decoding="async"
              className="relative size-full object-contain"
              onError={() => setQrFailed(true)}
            />
          )}
        </div>
      ) : null}
      {method.linkUrl ? (
        <a
          href={method.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 rounded-lg bg-(--primary) px-4 py-2 font-medium text-white transition-all hover:bg-(--primary)/90 active:scale-95 dark:text-black/70"
        >
          前往打赏
          <ExternalLink aria-hidden className="size-4" />
        </a>
      ) : null}
    </article>
  );
}
