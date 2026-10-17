import WidgetCard from "./widget-card";

// 公告卡：纯文本按换行切分为段落展示
export default function AnnouncementCard({ text, delay = 50 }: { text: string; delay?: number }) {
  const paragraphs = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (paragraphs.length === 0) {
    return null;
  }
  return (
    <WidgetCard title="公告" delay={delay}>
      <div className="space-y-2">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-relaxed text-neutral-600 dark:text-neutral-300">
            {paragraph}
          </p>
        ))}
      </div>
    </WidgetCard>
  );
}