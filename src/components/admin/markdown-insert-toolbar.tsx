"use client";

import { Braces, Link2, Network, Sigma, Workflow } from "lucide-react";

// 高级语法插入项：caretOffset 用于把光标定位到占位内容处
const INSERT_ACTIONS = [
  {
    label: "公式",
    title: "插入行内公式",
    snippet: "$公式$",
    caretOffset: 1,
    Icon: Sigma,
  },
  {
    label: "块公式",
    title: "插入块级公式",
    snippet: "$$\n公式\n$$",
    caretOffset: 3,
    Icon: Braces,
  },
  {
    label: "Mermaid",
    title: "插入 Mermaid 图表",
    snippet: "```mermaid\nflowchart LR\n  A[开始] --> B[结束]\n```",
    caretOffset: undefined,
    Icon: Workflow,
  },
  {
    label: "PlantUML",
    title: "插入 PlantUML 图表",
    snippet: "```plantuml\n@startuml\nAlice -> Bob: Hello\n@enduml\n```",
    caretOffset: undefined,
    Icon: Network,
  },
  {
    label: "双链",
    title: "插入 Wiki Link",
    snippet: "[[文章 slug]]",
    caretOffset: 2,
    Icon: Link2,
  },
] as const;

// 后台 Markdown 工具栏：向正文光标处插入常用高级语法模板
export default function MarkdownInsertToolbar({
  onInsert,
}: {
  onInsert: (snippet: string, caretOffset?: number) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 bg-zinc-50/80 px-5 py-2 dark:border-zinc-800 dark:bg-zinc-950/40"
      aria-label="高级 Markdown 插入工具"
    >
      <span className="mr-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">高级语法</span>
      {INSERT_ACTIONS.map(({ label, title, snippet, caretOffset, Icon }) => (
        <button
          key={label}
          type="button"
          title={title}
          aria-label={title}
          onClick={() => onInsert(snippet, caretOffset)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Icon aria-hidden className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
