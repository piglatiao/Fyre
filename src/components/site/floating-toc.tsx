"use client";

import { List, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getFloatingTocItems, subscribeFloatingToc } from "@/lib/floating-toc-store";

// 悬浮目录：从共享状态读取目录条目，按钮展开面板并在滚动时高亮当前章节
export default function FloatingToc() {
  const items = useSyncExternalStore(subscribeFloatingToc, getFloatingTocItems, getFloatingTocItems);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");

  // 监听标题可见性，标记当前阅读位置
  useEffect(() => {
    if (items.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: [0, 1] },
    );
    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    }
    return () => observer.disconnect();
  }, [items]);

  // 面板打开时支持 Esc 关闭
  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (items.length === 0) {
    return null;
  }

  // 顶层条目（h2）按出现顺序编号，次级条目（h3）使用圆点徽标
  const numberById = new Map(items.filter((item) => item.level === 2).map((item, index) => [item.id, index + 1]));

  return (
    <div className="floating-toc-wrapper">
      <div
        className={
          "floating-toc-panel card-base w-[calc(100vw-2rem)] rounded-2xl border border-white/20 py-3 shadow-2xl backdrop-blur-lg dark:border-white/10 md:w-80 " +
          (open ? "show" : "hide")
        }
      >
        <div className="toc-scroll-container px-3">
          <nav aria-label="文章目录" className="toc-content">
            {items.map((item) => {
              const number = numberById.get(item.id);
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  title={item.text}
                  aria-label={item.text}
                  data-active={activeId === item.id ? "" : undefined}
                  className={`toc-item toc-level-${item.level - 2}`}
                  onClick={() => setOpen(false)}
                >
                  {number !== undefined ? (
                    <div className="toc-badge toc-badge-index">{number}</div>
                  ) : (
                    <div className="toc-badge">
                      <span className="toc-badge-dot" />
                    </div>
                  )}
                  <div className="toc-label toc-label-primary">{item.text}</div>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
      <button
        type="button"
        aria-label={open ? "收起目录" : "展开目录"}
        title={open ? "收起目录" : "目录"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="card-base floating-btn"
      >
        {open ? <X aria-hidden /> : <List aria-hidden />}
      </button>
    </div>
  );
}