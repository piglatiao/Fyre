"use client";

import { useEffect, useRef, useState } from "react";

// 横幅副标题打字机效果：逐字输入、停顿后逐字删除，循环播放
export default function BannerTypewriter({
  texts,
  enabled = true,
  speed = 100,
  deleteSpeed = 50,
  pauseTime = 2000,
}: {
  texts: string[];
  enabled?: boolean;
  speed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
}) {
  const [text, setText] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // 关闭打字机时直接展示第一条副标题
    if (!enabled) {
      setText(texts[0] ?? "");
      return;
    }
    if (texts.length === 0) {
      return;
    }
    let textIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let cancelled = false;

    // 按可见字符（处理 emoji 等组合字符）推进
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const graphemes = (value: string): string[] =>
      [...segmenter.segment(value)].map((item) => item.segment);

    function tick(): void {
      if (cancelled) {
        return;
      }
      const current = graphemes(texts[textIndex] ?? "");
      if (deleting) {
        charIndex -= 1;
        setText(current.slice(0, Math.max(0, charIndex)).join(""));
        if (charIndex <= 0) {
          deleting = false;
          textIndex = (textIndex + 1) % texts.length;
          timerRef.current = window.setTimeout(tick, speed);
        } else {
          timerRef.current = window.setTimeout(tick, deleteSpeed);
        }
        return;
      }
      charIndex += 1;
      setText(current.slice(0, charIndex).join(""));
      if (charIndex >= current.length) {
        if (texts.length === 1) {
          return;
        }
        deleting = true;
        timerRef.current = window.setTimeout(tick, pauseTime);
      } else {
        timerRef.current = window.setTimeout(tick, speed);
      }
    }

    timerRef.current = window.setTimeout(tick, speed);
    return () => {
      cancelled = true;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [texts, enabled, speed, deleteSpeed, pauseTime]);

  return <span className="typewriter-caret">{text}</span>;
}
