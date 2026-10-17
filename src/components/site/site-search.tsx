"use client";

import { ArrowRight, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { requestJson } from "@/lib/api-client";
import type { SiteSearchHit } from "@/types/site-search-hit";

// 输入停顿时间：避免每次按键都请求搜索接口
const SEARCH_DELAY_MS = 250;

// 导航栏站内搜索：桌面直接输入，移动端展开浮层，结果在当前页面即时展示
export default function SiteSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SiteSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const keyword = query.trim();

  // 输入框变化时立即重置结果与加载态；空关键词直接关闭浮层
  function handleQueryChange(value: string): void {
    const nextKeyword = value.trim();
    setQuery(value);
    setResults([]);
    setSearched(false);
    setError("");
    setOpen(nextKeyword.length > 0);
    setLoading(nextKeyword.length > 0);
  }

  // 关键词变化后延迟请求；只采纳最后一次请求结果，避免旧响应覆盖新结果
  useEffect(() => {
    const currentRequest = ++requestId.current;
    if (!keyword) {
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        const response = await requestJson<SiteSearchHit[]>(
          `/api/search?q=${encodeURIComponent(keyword)}`,
        );
        if (currentRequest !== requestId.current) {
          return;
        }
        setLoading(false);
        setSearched(true);
        if (response.ok) {
          setResults(response.data);
        } else {
          setResults([]);
          setError(response.error.message);
        }
      })();
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  // 点击搜索区域外关闭浮层，不依赖铺满屏幕的遮罩按钮
  useEffect(() => {
    function handleOutside(event: PointerEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  // 移动端展开浮层后自动聚焦面板内的搜索框
  useEffect(() => {
    if (open && window.matchMedia("(max-width: 1023px)").matches) {
      mobileInputRef.current?.focus();
    }
  }, [open]);

  // 表单提交只保证结果浮层展开，不跳转独立搜索页
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (keyword) {
      setOpen(true);
    }
  }

  // 键盘 Esc 关闭结果浮层并释放焦点
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      setOpen(false);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }

  const visibleResults = results.slice(0, 5);

  return (
    <div ref={rootRef} onKeyDown={handleKeyDown} className="relative flex items-center" data-interactive>
      <form
        role="search"
        onSubmit={handleSubmit}
        className="mr-2 hidden h-11 w-40 items-center rounded-xl bg-black/4 transition-all focus-within:w-60 hover:bg-black/6 focus-within:bg-black/6 lg:flex dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10"
      >
        <div className="relative h-full w-full">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
          <input
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            aria-label="站内搜索"
            aria-controls="site-search-panel"
            autoComplete="off"
            placeholder="搜索"
            className="h-full w-full rounded-xl bg-transparent pr-3 pl-10 text-sm text-black/50 outline-none placeholder:text-black/30 dark:text-white/50 dark:placeholder:text-white/30"
          />
        </div>
      </form>

      <button
        type="button"
        aria-label="搜索"
        title="搜索"
        aria-controls="site-search-panel"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="btn-plain h-11 w-11 rounded-lg lg:hidden!"
      >
        <Search aria-hidden className="size-5" />
      </button>
      {open ? (
        <div
          id="site-search-panel"
          role="dialog"
          aria-label="站内搜索"
          className="float-panel fixed top-20 right-4 left-4 z-50 rounded-2xl p-2 shadow-2xl lg:absolute lg:top-full lg:right-0 lg:left-auto lg:mt-2 lg:w-[30rem]"
        >
          <form role="search" onSubmit={handleSubmit} className="relative mb-2 flex h-11 items-center rounded-xl bg-black/4 lg:hidden dark:bg-white/5">
            <label htmlFor="site-search-mobile" className="sr-only">
              站内搜索关键词
            </label>
            <Search aria-hidden className="pointer-events-none absolute left-3 size-4 text-black/30 dark:text-white/30" />
            <input
              ref={mobileInputRef}
              id="site-search-mobile"
              type="search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              autoComplete="off"
              placeholder="搜索"
              className="h-full w-full bg-transparent pr-3 pl-10 text-sm text-black/60 outline-none placeholder:text-black/30 dark:text-white/60 dark:placeholder:text-white/30"
            />
          </form>

          <div aria-live="polite" aria-busy={loading} className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p role="status" className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-(--content-meta)">
                <Loader2 aria-hidden className="size-4 animate-spin text-(--primary)" />
                正在搜索…
              </p>
            ) : error ? (
              <p role="alert" className="rounded-xl px-3 py-6 text-center text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : keyword === "" ? (
              <p className="px-3 py-6 text-center text-sm text-(--content-meta)">
                输入关键词开始搜索。
              </p>
            ) : searched && results.length === 0 ? (
              <p className="rounded-xl px-3 py-6 text-center text-sm text-(--content-meta)">
                找不到相关结果。
              </p>
            ) : (
              <>
                <ul className="space-y-1">
                  {visibleResults.map((hit) => (
                    <li key={hit.id}>
                      <Link
                        href={`/posts/${hit.slug}`}
                        onClick={() => setOpen(false)}
                        className="group block rounded-xl px-3 py-2.5 transition hover:bg-(--btn-plain-bg-hover) focus-visible:bg-(--btn-plain-bg-hover) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--primary)"
                      >
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-(--btn-content) transition group-hover:text-(--primary)">
                            {hit.title}
                          </span>
                          <ArrowRight aria-hidden className="size-3.5 shrink-0 text-(--primary)" />
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-(--content-meta)">
                          {hit.excerpt}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {results.length > 5 ? (
                  <Link
                    href={`/search?q=${encodeURIComponent(keyword)}`}
                    onClick={() => setOpen(false)}
                    className="mt-1 flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-(--primary) transition hover:bg-(--btn-plain-bg-hover)"
                  >
                    查看全部 {results.length} 条结果
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
