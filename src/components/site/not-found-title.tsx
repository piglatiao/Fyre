"use client";

import { useEffect } from "react";

// 修正嵌套 404 在客户端水合时被站点默认标题覆盖的问题
export default function NotFoundTitle({ siteName }: { siteName: string }) {
  useEffect(() => {
    const title = `404 · ${siteName}`;
    const applyTitle = () => {
      if (document.title !== title) {
        document.title = title;
      }
    };

    applyTitle();
    const observer = new MutationObserver(applyTitle);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [siteName]);

  return null;
}
