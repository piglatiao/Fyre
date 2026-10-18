import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "katex/dist/katex.min.css";
import "./globals.css";
import Providers from "./providers";
import { getSiteUrl } from "@/lib/site-url";
import { createSiteServices } from "@/server/services/service-container";

// 全站按请求动态渲染：保证后台发布、修改后前台立即生效
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: "/favicon/firefly-32.png",
    apple: "/favicon/firefly-32.png",
  },
  title: {
    default: "流萤",
    template: "%s · 流萤",
  },
  description: "流萤动态博客：分享技术、生活与思考。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // 主题变量在服务端渲染时注入，避免首帧闪烁；色相与卡片透明度均来自后台设置
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  const themeStyle = {
    "--hue": String(settings.themeHue),
    "--card-transparent-opacity": String(settings.cardOpacity),
    "--banner-height-home": `${settings.bannerHeightHome}vh`,
    "--banner-height-non-home": `${settings.bannerHeightNonHome}vh`,
    "--overlay-blur": `${settings.overlayBlur}px`,
    "--fullscreen-blur": `${settings.fullscreenBlur}px`,
  } as CSSProperties;

  return (
    <html lang="zh-CN" style={themeStyle} suppressHydrationWarning>
      <body className="antialiased">
        <Providers defaultTheme={settings.themeMode}>{children}</Providers>
      </body>
    </html>
  );
}
