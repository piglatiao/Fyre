"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

// 复制按钮图标：复制与成功打勾，样式由 globals.css 的 .code-copy-btn 控制
const ICON_COPY =
  '<svg class="icon-copy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 19a2 2 0 0 1-1-2V2a2 2 0 0 1 1-1h13a2 2 0 0 1 2 1"/><rect x="6" y="5" width="16" height="18" rx="1.5" ry="1.5"/></svg>';
const ICON_CHECK =
  '<svg class="icon-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

// 代码块复制按钮：服务端渲染的 HTML 不可交互，挂载后给每个代码块挂一个官方同款右上角图标按钮
export default function ArticleCodeCopy({
  rootRef,
  contentKey,
}: {
  rootRef?: RefObject<HTMLElement | null>;
  contentKey: string;
}) {
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const root = rootRef?.current ?? document;
    const figures = root.querySelectorAll<HTMLElement>("figure[data-rehype-pretty-code-figure]");
    for (const figure of figures) {
      const code = figure.querySelector("pre code");
      if (!code || figure.querySelector("[data-code-copy]")) {
        continue;
      }

      // 取原始代码文本：逐行读取代码列（行号栏不参与复制），保留换行
      const readCode = (): string => {
        const cells = Array.from(code.querySelectorAll<HTMLElement>(".ec-code"));
        if (cells.length > 0) {
          return cells.map((cell) => cell.textContent ?? "").join("\n");
        }
        return code.textContent ?? "";
      };

      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-code-copy", "");
      button.setAttribute("aria-label", "复制代码");
      button.className = "code-copy-btn";
      button.innerHTML = ICON_COPY + ICON_CHECK;
      let resetTimer = 0;
      const onClick = (): void => {
        window.clearTimeout(resetTimer);
        void navigator.clipboard
          .writeText(readCode())
          .then(() => {
            button.setAttribute("data-copied", "true");
          })
          .catch(() => undefined)
          .finally(() => {
            resetTimer = window.setTimeout(() => {
              button.removeAttribute("data-copied");
            }, 1600);
          });
      };
      button.addEventListener("click", onClick);
      figure.appendChild(button);
      cleanups.push(() => {
        window.clearTimeout(resetTimer);
        button.removeEventListener("click", onClick);
        button.remove();
      });
    }
    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [rootRef, contentKey]);

  return null;
}
