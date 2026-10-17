"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

// 后台实时时钟：按 Asia/Shanghai 显示时分秒，首帧占位避免水合不一致
export default function DashboardLiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const text = now
    ? new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(now)
    : "--:--:--";

  return (
    <span className="admin-clock" title="当前时间（Asia/Shanghai）">
      <Clock className="size-3.5 text-(--primary)" aria-hidden />
      <span className="tabular-nums font-medium">{text}</span>
      <span className="text-[10px] opacity-60">UTC+8</span>
    </span>
  );
}
