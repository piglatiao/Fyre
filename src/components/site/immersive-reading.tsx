"use client";

import { BookOpen, List, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { getFloatingTocItems, subscribeFloatingToc } from "@/lib/floating-toc-store";

// 沉浸式阅读：隐藏横幅、导航与侧栏，只保留正文，并提供常驻目录栏（对齐官网 ImmersiveReading）
export default function ImmersiveReading() {
  const items = useSyncExternalStore(subscribeFloatingToc, getFloatingTocItems, getFloatingTocItems);
  const [immersive, setImmersive] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [desktop, setDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const previousScroll = useRef(0);

  // 官网仅在 1024px 以上提供沉浸式阅读入口
  useEffect(() => {
    setMounted(true);
    const query = window.matchMedia("(min-width: 1024px)");
    function sync(): void {
      setDesktop(query.matches);
    }
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // 同步 body 上的布局类名（沉浸态 + 目录展开态）
  useEffect(() => {
    document.body.classList.toggle("immersive-reading", immersive);
    document.body.classList.toggle("immersive-toc-open", immersive && tocOpen);
  }, [immersive, tocOpen]);

  // 卸载（如切换路由）时清理全局类名，避免影响其他页面
  useEffect(() => {
    return () => {
      document.body.classList.remove("immersive-reading", "immersive-toc-open");
    };
  }, []);

  // 离开文章页后目录被清空，自动退出沉浸态
  useEffect(() => {
    if (immersive && items.length === 0) {
      setImmersive(false);
      setTocOpen(false);
    }
  }, [immersive, items.length]);

  // 沉浸态下按 Esc 退出，并恢复进入前的滚动位置
  useEffect(() => {
    if (!immersive) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setImmersive(false);
        setTocOpen(false);
        window.scrollTo(0, previousScroll.current);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [immersive]);

  // 目录高亮：跟随可视区域内的标题
  useEffect(() => {
    if (!immersive || items.length === 0) {
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
  }, [immersive, items]);

  // 进入沉浸阅读：记录滚动位置并回到顶部，默认展开目录栏
  function enterImmersive(): void {
    previousScroll.current = window.scrollY;
    setImmersive(true);
    setTocOpen(true);
    window.scrollTo(0, 0);
  }

  // 退出沉浸阅读：恢复进入前的滚动位置
  function exitImmersive(): void {
    setImmersive(false);
    setTocOpen(false);
    window.scrollTo(0, previousScroll.current);
  }

  if (!desktop || items.length === 0) {
    return null;
  }

  // 顶层条目（h2）按出现顺序编号，次级条目（h3）使用圆点徽标
  const numberById = new Map(items.filter((item) => item.level === 2).map((item, index) => [item.id, index + 1]));

  const tocPanel = (
    <aside
      id="immersive-toc"
      className={"immersive-toc" + (tocOpen ? " open" : "")}
      data-position="left"
      aria-label="文章目录"
    >
      <div className="immersive-toc-header">
        <span className="immersive-toc-title">文章目录</span>
        <button type="button" className="immersive-toc-toggle" aria-label="收起目录" onClick={() => setTocOpen(false)}>
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="toc-scroll-container custom-scrollbar">
        <nav id="immersive-toc-content" className="toc-content">
          {items.map((item) => {
            const number = numberById.get(item.id);
            return (
              <a
                key={item.id}
                href={"#" + item.id}
                title={item.text}
                aria-label={item.text}
                data-active={activeId === item.id ? "" : undefined}
                className={"toc-item toc-level-" + (item.level - 2)}
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
    </aside>
  );

  return (
    <>
      {/* 进入/退出沉浸阅读：官网 #immersive-reading-btn */}
      <button
        type="button"
        id="immersive-reading-btn"
        aria-label={immersive ? "退出沉浸阅读" : "进入沉浸阅读"}
        title={immersive ? "退出沉浸阅读" : "进入沉浸阅读"}
        aria-pressed={immersive}
        onClick={immersive ? exitImmersive : enterImmersive}
        className="card-base floating-btn"
      >
        <BookOpen aria-hidden />
      </button>
      {/* 沉浸态下的目录开关：官网 #immersive-toc-toggle-btn */}
      {immersive ? (
        <button
          type="button"
          id="immersive-toc-toggle-btn"
          aria-label="切换目录"
          title={tocOpen ? "收起目录" : "展开目录"}
          aria-expanded={tocOpen}
          onClick={() => setTocOpen((value) => !value)}
          className="card-base floating-btn"
        >
          <List aria-hidden />
        </button>
      ) : null}
      {mounted && immersive ? createPortal(tocPanel, document.body) : null}
    </>
  );
}
