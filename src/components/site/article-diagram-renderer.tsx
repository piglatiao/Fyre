"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, type RefObject } from "react";

// 图表缩放上下限：避免把图表缩到不可读或放大到失控
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

// Mermaid 主题解析器不支持 oklch：借助画布转换为兼容的 RGB 颜色
function resolveCssColor(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return undefined;
  }
  const sentinel = "#010203";
  context.fillStyle = sentinel;
  context.fillStyle = value;
  if (context.fillStyle === sentinel) {
    return undefined;
  }
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${red}, ${green}, ${blue})`;
}

// 从图表容器读取缩放比例
function readScale(container: HTMLElement): number {
  const value = Number.parseFloat(container.dataset.diagramScale ?? "1");
  return Number.isFinite(value) ? value : 1;
}

// 把缩放比例写回舞台，CSS 负责平滑过渡
function applyScale(container: HTMLElement, scale: number): void {
  const stage = container.querySelector<HTMLElement>(".diagram-stage");
  if (!stage) {
    return;
  }
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  container.dataset.diagramScale = String(next);
  stage.style.transform = next === 1 ? "" : `scale(${next})`;
  const zoomOut = container.querySelector<HTMLButtonElement>('[data-diagram-action="zoom-out"]');
  const zoomIn = container.querySelector<HTMLButtonElement>('[data-diagram-action="zoom-in"]');
  if (zoomOut) {
    zoomOut.disabled = next <= MIN_SCALE;
  }
  if (zoomIn) {
    zoomIn.disabled = next >= MAX_SCALE;
  }
}

// 通过图表内的状态区域向读屏用户播报缩放与全屏状态
function announce(container: HTMLElement, message: string): void {
  const status = container.querySelector<HTMLElement>(".diagram-status");
  if (status) {
    status.hidden = false;
    status.dataset.state = "info";
    status.textContent = message;
  }
}

// 更新全屏按钮标签，让视觉文案与当前状态一致
function updateFullscreenButton(container: HTMLElement, active: boolean): void {
  const button = container.querySelector<HTMLButtonElement>('[data-diagram-action="fullscreen"]');
  if (!button) {
    return;
  }
  const label = active ? "退出全屏" : "全屏查看图表";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("aria-pressed", String(active));
  button.textContent = active ? "退出" : "全屏";
}

// 标记 Mermaid 渲染失败：展开源码并保留错误提示，便于作者定位语法问题
function markMermaidError(container: HTMLElement): void {
  container.dataset.diagramState = "error";
  const status = container.querySelector<HTMLElement>(".diagram-status");
  if (status) {
    status.hidden = false;
    status.dataset.state = "error";
    status.textContent = "Mermaid 图表渲染失败，请检查下方源码";
  }
  const source = container.querySelector<HTMLDetailsElement>(".diagram-source");
  if (source) {
    source.open = true;
  }
}

// 文章图表交互：按需渲染 Mermaid、监听 PlantUML 加载状态并提供缩放与全屏控制
export default function ArticleDiagramRenderer({
  containerRef,
  contentKey,
}: {
  containerRef: RefObject<HTMLElement | null>;
  contentKey: string;
}) {
  const { resolvedTheme } = useTheme();
  const renderVersion = useRef(0);

  // Mermaid 体积较大：只有正文实际包含图表时才动态加载，并在主题切换后重新渲染
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !resolvedTheme) {
      return;
    }
    const diagrams = Array.from(root.querySelectorAll<HTMLElement>(".mermaid-diagram-container"));
    if (diagrams.length === 0) {
      return;
    }

    let cancelled = false;
    const version = ++renderVersion.current;
    const theme = resolvedTheme === "dark" ? "dark" : "default";

    async function renderDiagrams(): Promise<void> {
      try {
        const { default: mermaid } = await import("mermaid");
        if (cancelled) {
          return;
        }
        const primary = resolveCssColor(getComputedStyle(document.documentElement).getPropertyValue("--primary"));
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          suppressErrorRendering: true,
          theme,
          fontFamily: getComputedStyle(document.body).fontFamily,
          themeVariables: {
            primaryColor: primary || undefined,
            primaryBorderColor: primary || undefined,
            lineColor: primary || undefined,
          },
        });

        for (const [index, container] of diagrams.entries()) {
          if (cancelled) {
            return;
          }
          const source = container.querySelector<HTMLElement>(".diagram-source-code")?.textContent ?? "";
          const output = container.querySelector<HTMLElement>(".diagram-output");
          const status = container.querySelector<HTMLElement>(".diagram-status");
          if (!source.trim() || !output) {
            markMermaidError(container);
            continue;
          }

          container.dataset.diagramState = "loading";
          if (status) {
            status.hidden = false;
            status.dataset.state = "info";
            status.textContent = "正在渲染 Mermaid 图表…";
          }
          try {
            const result = await mermaid.render(`markdown-mermaid-${version}-${index}`, source);
            if (cancelled) {
              return;
            }
            output.innerHTML = result.svg;
            output.dataset.ready = "true";
            container.dataset.diagramState = "ready";
            if (status) {
              status.hidden = true;
              status.textContent = "";
            }
            if (result.bindFunctions) {
              result.bindFunctions(output);
            }
          } catch {
            if (!cancelled) {
              markMermaidError(container);
            }
          }
        }
      } catch {
        for (const container of diagrams) {
          markMermaidError(container);
        }
      }
    }

    void renderDiagrams();
    return () => {
      cancelled = true;
    };
  }, [containerRef, resolvedTheme, contentKey]);

  // PlantUML 图片已由服务端生成亮暗两套：只监听当前主题对应的图片加载状态
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !resolvedTheme) {
      return;
    }
    const isDark = resolvedTheme === "dark";
    const cleanups: (() => void)[] = [];

    for (const container of root.querySelectorAll<HTMLElement>(".plantuml-diagram-container")) {
      const selector = isDark ? ".plantuml-image-dark" : ".plantuml-image-light";
      const image = container.querySelector<HTMLImageElement>(selector);
      const status = container.querySelector<HTMLElement>(".diagram-status");
      if (!image) {
        continue;
      }

      const showReady = (): void => {
        container.dataset.diagramState = "ready";
        if (status) {
          status.hidden = true;
          status.textContent = "";
        }
      };
      const showError = (): void => {
        container.dataset.diagramState = "error";
        if (status) {
          status.hidden = false;
          status.dataset.state = "error";
          status.textContent = "PlantUML 图表加载失败，请检查下方源码或网络";
        }
        const source = container.querySelector<HTMLDetailsElement>(".diagram-source");
        if (source) {
          source.open = true;
        }
      };

      if (image.complete) {
        if (image.naturalWidth > 0) {
          showReady();
        } else {
          showError();
        }
        continue;
      }

      image.addEventListener("load", showReady);
      image.addEventListener("error", showError);
      cleanups.push(() => {
        image.removeEventListener("load", showReady);
        image.removeEventListener("error", showError);
      });
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [containerRef, resolvedTheme, contentKey]);

  // 图表工具栏：事件委托处理缩放、复位、全屏与降级全屏
  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }

    const handleClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const button = target.closest<HTMLButtonElement>("[data-diagram-action]");
      const container = button?.closest<HTMLElement>(".diagram-container");
      if (!button || !container || !root.contains(container)) {
        return;
      }

      const action = button.dataset.diagramAction;
      if (action === "zoom-in") {
        const next = Math.min(MAX_SCALE, readScale(container) + SCALE_STEP);
        applyScale(container, next);
        announce(container, `图表缩放 ${Math.round(next * 100)}%`);
        return;
      }
      if (action === "zoom-out") {
        const next = Math.max(MIN_SCALE, readScale(container) - SCALE_STEP);
        applyScale(container, next);
        announce(container, `图表缩放 ${Math.round(next * 100)}%`);
        return;
      }
      if (action === "reset") {
        applyScale(container, 1);
        announce(container, "图表已恢复原始大小");
        return;
      }
      if (action === "fullscreen") {
        if (document.fullscreenElement === container) {
          void document.exitFullscreen();
          return;
        }
        if (container.classList.contains("is-expanded")) {
          container.classList.remove("is-expanded");
          document.body.style.overflow = "";
          updateFullscreenButton(container, false);
          return;
        }
        if (container.requestFullscreen) {
          void container.requestFullscreen().catch(() => {
            container.classList.add("is-expanded");
            document.body.style.overflow = "hidden";
            updateFullscreenButton(container, true);
          });
        } else {
          container.classList.add("is-expanded");
          document.body.style.overflow = "hidden";
          updateFullscreenButton(container, true);
        }
      }
    };

    const handleFullscreenChange = (): void => {
      for (const container of root.querySelectorAll<HTMLElement>(".diagram-container")) {
        const active = document.fullscreenElement === container;
        updateFullscreenButton(container, active || container.classList.contains("is-expanded"));
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }
      const expanded = root.querySelector<HTMLElement>(".diagram-container.is-expanded");
      if (expanded) {
        expanded.classList.remove("is-expanded");
        document.body.style.overflow = "";
        updateFullscreenButton(expanded, false);
      }
    };

    root.addEventListener("click", handleClick);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      root.removeEventListener("click", handleClick);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, contentKey]);

  return null;
}
