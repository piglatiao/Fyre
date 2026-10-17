"use client";

import { MessagesSquare } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

// 读取评论配置中的字符串字段
function readConfigString(config: Record<string, unknown>, key: string, fallback: string): string {
  const value = config[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

// Giscus 评论容器：挂载官方客户端脚本，并在明暗主题切换时同步 iframe 配色
function GiscusComments({
  config,
}: {
  config: Record<string, unknown>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const repo = readConfigString(config, "repo", "");
  const repoId = readConfigString(config, "repoId", "");
  const category = readConfigString(config, "category", "");
  const categoryId = readConfigString(config, "categoryId", "");

  // 创建 Giscus 脚本；配置或页面路径变化时重新挂载
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !repo || !repoId || !category || !categoryId) {
      return;
    }
    container.replaceChildren();
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    const attributes: Record<string, string> = {
      "data-repo": repo,
      "data-repo-id": repoId,
      "data-category": category,
      "data-category-id": categoryId,
      "data-mapping": readConfigString(config, "mapping", "pathname"),
      "data-strict": readConfigString(config, "strict", "0"),
      "data-reactions-enabled": readConfigString(config, "reactionsEnabled", "1"),
      "data-emit-metadata": readConfigString(config, "emitMetadata", "0"),
      "data-input-position": readConfigString(config, "inputPosition", "top"),
      "data-theme": resolvedTheme === "dark" ? "dark_dimmed" : "light",
      "data-lang": readConfigString(config, "lang", "zh-CN"),
      "data-loading": readConfigString(config, "loading", "lazy"),
    };
    for (const [name, value] of Object.entries(attributes)) {
      script.setAttribute(name, value);
    }
    container.appendChild(script);
    return () => {
      container.replaceChildren();
    };
  }, [category, categoryId, config, repo, repoId, resolvedTheme]);

  // 仅同步主题，避免切换明暗模式时整块评论重新加载
  useEffect(() => {
    const frame = containerRef.current?.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    frame?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: resolvedTheme === "dark" ? "dark_dimmed" : "light" } } },
      "https://giscus.app",
    );
  }, [resolvedTheme]);

  if (!repo || !repoId || !category || !categoryId) {
    return <p className="py-8 text-center text-sm text-(--content-meta)">Giscus 配置不完整，请在后台补充仓库与分类信息。</p>;
  }
  return <div ref={containerRef} className="giscus" />;
}

// 全站评论挂载位：当前支持 Giscus，其他服务保留清晰的配置提示
export default function SiteComments({
  provider,
  config,
  path,
  title,
}: {
  provider: string;
  config: Record<string, unknown>;
  path: string;
  title: string;
}) {
  if (!provider) {
    return null;
  }
  const providerConfig =
    typeof config[provider] === "object" && config[provider] !== null && !Array.isArray(config[provider])
      ? (config[provider] as Record<string, unknown>)
      : config;

  return (
    <section
      id="comments"
      data-comment-path={path}
      className="card-base relative mt-4 overflow-x-clip overflow-y-visible rounded-(--radius-large) p-8"
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-linear-to-b from-(--primary) to-transparent" />
          <h3 className="text-xl font-bold text-(--btn-content)">评论</h3>
        </div>
        <p className="ml-4 text-sm text-(--content-meta)">欢迎留下你的想法，友善交流，共同成长。</p>
      </div>
      <div className="relative z-10 px-2">
        {provider === "giscus" ? (
          <GiscusComments config={providerConfig} />
        ) : (
          <div className="py-8 text-center text-(--content-meta)">
            <MessagesSquare aria-hidden className="mx-auto mb-3 size-8 text-(--primary)" />
            <p className="text-sm">已启用评论服务「{provider}」，当前版本支持 Giscus。</p>
            <p className="mt-1 text-xs opacity-75">可在后台站点设置中切换为 Giscus，或等待后续接入该评论服务。</p>
          </div>
        )}
      </div>
      <span className="sr-only">页面：{title}</span>
    </section>
  );
}
