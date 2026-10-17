import type { TocItem } from "@/types/toc-item";

// 悬浮目录的跨组件共享状态：文章页写入目录条目，站点悬浮控件订阅渲染

let items: TocItem[] = [];
const listeners = new Set<() => void>();

// 覆盖写入目录条目（页面切换时由注册器调用），并通知所有订阅者
export function setFloatingTocItems(next: TocItem[]): void {
  items = next;
  for (const listener of listeners) {
    listener();
  }
}

// 读取当前目录条目（useSyncExternalStore 的快照来源，引用保持稳定）
export function getFloatingTocItems(): TocItem[] {
  return items;
}

// 订阅目录条目变化
export function subscribeFloatingToc(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}