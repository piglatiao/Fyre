"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// 兼容非安全上下文的复制实现：优先使用 Clipboard API，失败时回退到临时文本框
async function writeClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

// 通用复制按钮：成功后短暂显示对勾，并通过 aria-live 告知辅助技术
export default function CopyButton({
  value,
  label = "复制",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 执行复制并重置提示计时，避免连续点击时状态提前消失
  async function handleCopy(): Promise<void> {
    const success = await writeClipboard(value);
    setCopied(success);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={copied ? "已复制" : label}
      title={copied ? "已复制" : label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-black/8 text-(--btn-content) transition hover:bg-black/12 focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:outline-none dark:bg-white/10 dark:hover:bg-white/15 ${className}`}
    >
      {copied ? (
        <Check aria-hidden className="size-3.5 text-emerald-500" />
      ) : (
        <Copy aria-hidden className="size-3.5" />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "已复制到剪贴板" : ""}
      </span>
    </button>
  );
}
