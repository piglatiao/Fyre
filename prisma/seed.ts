import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// 站点默认设置（value 统一以 JSON 字符串存储，便于后续类型化读取）
const defaultSettings: Record<string, unknown> = {
  siteName: "流萤",
  siteSubtitle: "记录技术与生活",
  siteDescription: "流萤动态博客：分享技术、生活与思考。",
  siteLogo: "",
  siteFavicon: "",
  footerText: "Powered by 流萤动态博客",
  icpNumber: "",
  socialLinks: [],
  seoKeywords: [],
  commentProvider: "",
  commentConfig: {},
  friendPageTitle: "友链",
  friendPageDescription: "这里是我的朋友们，欢迎互相访问交流",
  friendShowCustomContent: true,
  friendShowComment: true,
  friendContactEmail: "",
  friendNotes: [
    { title: "互换原则", content: "请先将本站添加到您的友链页面，确认后会添加您的友链" },
    { title: "链接维护", content: "友链网站长期无法访问或内容违规，将会被移除" },
    { title: "内容要求", content: "内容积极向上，不含有任何违法违规内容" },
    { title: "站点要求", content: "支持 HTTPS，以原创内容为主，能够正常访问且有持续更新" },
  ],
  sponsorUsage: "您的打赏将用于服务器维护、内容创作和功能开发，帮助我持续提供优质内容。",
  sponsorShowList: true,
  bilibiliEnabled: true,
  bilibiliUid: "38932988",
  bilibiliPageTitle: "哔哩哔哩",
  bilibiliPageDescription: "我的哔哩哔哩追番与追剧列表",
  bilibiliItemsPerPage: 24,
  bilibiliCacheMinutes: 60,
  bilibiliShowStats: true,
  bangumiEnabled: true,
  bangumiUsername: "1143164",
  bangumiApiUrl: "https://bgmapi.anibt.net",
  bangumiSubjectBaseUrl: "https://bgm.tv/subject",
  bangumiPageTitle: "番组计划",
  bangumiPageDescription: "我的 Bangumi 追番、读书、听歌与游戏收藏",
  bangumiItemsPerPage: 24,
  bangumiCacheMinutes: 60,
  bangumiNsfwMode: "hide",
  vndbEnabled: true,
  vndbUserId: "u358128",
  vndbApiToken: "",
  vndbApiUrl: "https://api.vndb.org/kana",
  vndbVnBaseUrl: "https://vndb.org",
  vndbPageTitle: "VNDB",
  vndbPageDescription: "我的视觉小说收藏与游玩记录",
  vndbItemsPerPage: 24,
  vndbCacheMinutes: 60,
  vndbNsfwMode: "hide",
  malEnabled: true,
  malUsername: "cuteleaf",
  malClientId: "0ef34371450f9c6c809deaadec6aa8f3",
  malApiUrl: "https://api.myanimelist.net/v2",
  malAnimeBaseUrl: "https://myanimelist.net/anime",
  malMangaBaseUrl: "https://myanimelist.net/manga",
  malPageTitle: "MyAnimeList",
  malPageDescription: "我的动画与漫画收藏",
  malItemsPerPage: 24,
  malCacheMinutes: 60,
  malNsfwMode: "hide",
  themeHue: 165,
  themeMode: "system",
  cardOpacity: 0.6,
  bannerTitle: "",
  bannerSubtitle: "记录技术与生活",
  bannerSubtitles: [] as string[],
  bannerImageDesktop: "",
  bannerImageMobile: "",
  bannerWaves: true,
  wallpaperMode: "banner",
  bannerHeightHome: 65,
  bannerHeightNonHome: 45,
  typewriterEnabled: true,
  showLeftSidebar: true,
  showRightSidebar: true,
  authorName: "站长",
  authorBio: "记录技术与生活，把想法写成文字。",
  authorAvatar: "",
  announcementText: "欢迎来到我的博客！",
  siteStartDate: "",
};

// 创建初始管理员：已存在则跳过，保证 seed 幂等
async function seedAdminUser(): Promise<void> {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("缺少环境变量 ADMIN_PASSWORD，无法创建管理员");
  }
  const existed = await prisma.user.findUnique({ where: { username } });
  if (existed) {
    console.log(`管理员 ${username} 已存在，跳过创建`);
    return;
  }
  await prisma.user.create({
    data: {
      username,
      passwordHash: await hash(password, 10),
      nickname: "站长",
      role: "admin",
    },
  });
  console.log(`已创建管理员账号：${username}`);
}

// 写入站点默认设置：仅补缺失项，不覆盖已有值
async function seedSettings(): Promise<void> {
  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value) },
    });
  }
  console.log(`站点默认设置已就绪（${Object.keys(defaultSettings).length} 项）`);
}

// 示例动态：仅在表为空时写入，保证 seed 幂等
async function seedDynamics(): Promise<void> {
  const total = await prisma.dynamic.count();
  if (total > 0) {
    console.log(`动态已有 ${total} 条，跳过示例数据`);
    return;
  }
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const samples = [
    {
      content: "站点上线公告：流萤动态博客正式启用，前台与后台一体的动态博客。",
      location: "",
      pinned: true,
      publishedAt: new Date(now - 24 * hour),
    },
    {
      content: "**动态模块**已上线：支持 Markdown 排版、配图、位置与置顶，可在后台「动态」页维护。",
      location: "",
      pinned: false,
      publishedAt: new Date(now - 8 * hour),
    },
    {
      content: "随手记：今天把动态页补齐了，接下来还会继续打磨更多细节。",
      location: "广西",
      pinned: false,
      publishedAt: new Date(now - hour),
    },
  ];
  for (const sample of samples) {
    await prisma.dynamic.create({
      data: {
        content: sample.content,
        images: [],
        location: sample.location,
        pinned: sample.pinned,
        publishedAt: sample.publishedAt,
      },
    });
  }
  console.log(`已写入 ${samples.length} 条示例动态`);
}

// 示例友链：仅在表为空时写入，避免覆盖后台已有数据
async function seedFriendLinks(): Promise<void> {
  const total = await prisma.friendLink.count();
  if (total > 0) {
    console.log(`友链已有 ${total} 条，跳过示例数据`);
    return;
  }
  const samples = [
    {
      title: "夏夜流萤",
      avatarUrl:
        "https://weavatar.com/avatar/d252655d40d6874417a720bad0a6c5f77f8f6a1fd2f882f8f338402dc37e4190?s=640",
      description: "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
      siteUrl: "https://blog.cuteleaf.cn",
      tags: ["Blog"],
      weight: 10,
    },
    {
      title: "Firefly Docs",
      avatarUrl: "https://docs-firefly.cuteleaf.cn/logo.png",
      description: "Firefly 主题模板文档",
      siteUrl: "https://docs-firefly.cuteleaf.cn",
      tags: ["Docs"],
      weight: 9,
    },
    {
      title: "Astro",
      avatarUrl: "https://avatars.githubusercontent.com/u/44914786?v=4&s=640",
      description: "The web framework for content-driven websites.",
      siteUrl: "https://github.com/withastro/astro",
      tags: ["Framework", "Open Source"],
      weight: 8,
    },
  ];
  for (const sample of samples) {
    await prisma.friendLink.create({ data: sample });
  }
  console.log(`已写入 ${samples.length} 条示例友链`);
}

// 留言页内容：复用自定义页面表，便于后台「页面」模块直接编辑
async function seedGuestbookPage(): Promise<void> {
  const existed = await prisma.page.findUnique({ where: { slug: "guestbook" } });
  if (existed) {
    console.log("留言页内容已存在，跳过创建");
    return;
  }
  await prisma.page.create({
    data: {
      title: "留言",
      slug: "guestbook",
      published: true,
      content: [
        "- 请保持友善和尊重，营造良好的交流氛围",
        "- 欢迎分享你的想法，也可以提出对网站的建议",
        "- 你的每一条留言都是对我最大的支持 ✨",
      ].join("\n"),
    },
  });
  console.log("已创建留言页内容");
}

// 示例书签导航：仅在分组表为空时写入
async function seedBookmarks(): Promise<void> {
  const total = await prisma.bookmarkGroup.count();
  if (total > 0) {
    console.log(`书签分组已有 ${total} 个，跳过示例数据`);
    return;
  }
  const groups = [
    {
      name: "开发",
      slug: "dev",
      icon: "💻",
      description: "写代码时离不开的站点",
      weight: 100,
      items: [
        { title: "GitHub", url: "https://github.com", description: "全球最大的代码托管平台", weight: 10 },
        { title: "MDN Web Docs", url: "https://developer.mozilla.org", description: "最权威的 Web 技术文档", weight: 9 },
        { title: "Astro", url: "https://astro.build", description: "内容驱动型网站的 Web 框架", weight: 8 },
        { title: "Svelte", url: "https://svelte.dev", description: "把组件编译成高效原生 JS 的框架", weight: 7 },
        { title: "Tailwind CSS", url: "https://tailwindcss.com", description: "功能强大的 CSS 框架", weight: 6 },
      ],
    },
    {
      name: "项目",
      slug: "opensource",
      icon: "🚀",
      description: "好用的开源项目",
      weight: 90,
      items: [
        {
          title: "Firefly",
          url: "https://github.com/CuteLeaf/Firefly",
          description: "清晰美观的 Astro 个人博客主题模板",
          icon: "/favicon/firefly-32.png",
          weight: 10,
        },
      ],
    },
    {
      name: "设计",
      slug: "design",
      icon: "🎨",
      description: "配色、图标与灵感来源",
      weight: 90,
      items: [
        { title: "Iconify", url: "https://icon-sets.iconify.design", description: "海量开源图标集合搜索", weight: 10 },
        { title: "iconfont", url: "https://www.iconfont.cn", description: "阿里巴巴矢量图标库", weight: 9 },
      ],
    },
    {
      name: "工具",
      slug: "tools",
      icon: "🛠️",
      description: "顺手的在线小工具",
      weight: 80,
      items: [
        { title: "TinyPNG", url: "https://tinypng.com", description: "在线压缩 PNG / JPEG 图片", weight: 10 },
        { title: "Squoosh", url: "https://squoosh.app", description: "图片压缩与格式转换", weight: 9 },
        { title: "Carbon", url: "https://carbon.now.sh", description: "把代码片段生成漂亮的图片", weight: 8 },
      ],
    },
    {
      name: "资源",
      slug: "resources",
      icon: "📚",
      description: "文档、教程与阅读",
      weight: 70,
      items: [
        {
          title: "Firefly Docs",
          url: "https://docs-firefly.cuteleaf.cn",
          description: "Firefly 主题模板文档",
          icon: "https://docs-firefly.cuteleaf.cn/logo.png",
          weight: 10,
        },
        { title: "夏夜流萤", url: "https://blog.cuteleaf.cn", description: "飞萤之火自无梦的长夜亮起", weight: 9 },
      ],
    },
  ];
  for (const group of groups) {
    await prisma.bookmarkGroup.create({
      data: {
        name: group.name,
        slug: group.slug,
        icon: group.icon,
        description: group.description,
        weight: group.weight,
        bookmarks: { create: group.items },
      },
    });
  }
  console.log(`已写入 ${groups.length} 个示例书签分组`);
}

// 示例打赏方式与打赏记录：仅在表为空时写入
async function seedSponsors(): Promise<void> {
  const methodCount = await prisma.sponsorMethod.count();
  if (methodCount === 0) {
    await prisma.sponsorMethod.createMany({
      data: [
        {
          name: "支付宝",
          icon: "alipay",
          qrCodeUrl: "/assets/images/sponsor/alipay.png",
          description: "使用 支付宝 扫码打赏",
          sortOrder: 40,
        },
        {
          name: "微信",
          icon: "wechat",
          qrCodeUrl: "/assets/images/sponsor/wechat.png",
          description: "使用 微信 扫码打赏",
          sortOrder: 30,
        },
        {
          name: "爱发电",
          icon: "afdian",
          linkUrl: "https://ifdian.net/a/cuteleaf",
          description: "通过爱发电支持持续创作",
          sortOrder: 20,
        },
        {
          name: "Ko-fi",
          icon: "kofi",
          linkUrl: "https://ko-fi.com/cuteleaf",
          description: "Buy a Coffee for Firefly",
          sortOrder: 10,
        },
      ],
    });
  }
  const recordCount = await prisma.sponsorRecord.count();
  if (recordCount === 0) {
    await prisma.sponsorRecord.createMany({
      data: [
        {
          name: "夏叶",
          avatarUrl:
            "https://weavatar.com/avatar/d252655d40d6874417a720bad0a6c5f77f8f6a1fd2f882f8f338402dc37e4190?s=640",
          amount: "¥50",
          message: "感谢持续产出优质内容",
          sponsoredAt: "2025-10-01",
          sortOrder: 10,
        },
        {
          name: "匿名用户",
          amount: "¥20",
          sponsoredAt: "2025-10-01",
          sortOrder: 9,
        },
      ],
    });
  }
  console.log(`打赏方式 ${methodCount === 0 ? "已初始化" : "已存在"}，打赏记录 ${recordCount === 0 ? "已初始化" : "已存在"}`);
}

// 示例项目：仅在项目表为空时写入，正文作为项目详情页 README
async function seedProjects(): Promise<void> {
  const total = await prisma.project.count();
  if (total > 0) {
    console.log(`项目已有 ${total} 个，跳过示例数据`);
    return;
  }
  const samples = [
    {
      title: "Firefly 动态博客",
      slug: "firefly-dynamic",
      description:
        "基于 Next.js、TypeScript 与 Prisma 构建的动态博客，包含完整前台、后台、媒体库与主题配置能力。",
      coverUrl: "/assets/images/projects/firefly.avif",
      status: "published",
      tags: ["Next.js", "TypeScript", "TailwindCSS", "Prisma"],
      links: [
        { label: "官网", icon: "globe", value: "https://firefly.cuteleaf.cn/" },
        { label: "GitHub", icon: "github", value: "https://github.com/CuteLeaf/Firefly" },
      ],
      publishedAt: new Date("2025-10-01T00:00:00.000Z"),
      sortOrder: 100,
      content: [
        "## 项目简介",
        "",
        "流萤动态博客在保留官网视觉语言的基础上，补齐了数据库驱动的内容管理、后台编辑与实时前台展示。",
        "",
        "## 核心能力",
        "",
        "- 文章、分类、标签、系列、动态与自定义页面",
        "- 文章 Markdown 导入导出、定时发布、置顶与独立密码",
        "- 媒体库上传索引、横幅图片 / GIF / MP4 / WebM 壁纸",
        "- 友链、留言、书签导航、打赏与项目展示",
        "- 后台可配置主题色相、暗色模式、横幅高度与侧栏开关",
        "",
        "## 设计原则",
        "",
        "前台延续 Firefly 的卡片、玻璃质感与柔和动效；后台复用同一套设计令牌，保证主题色修改后前后台同步生效。",
      ].join("\n"),
    },
    {
      title: "项目内容维护指南",
      slug: "project-guide",
      description:
        "介绍如何在后台维护项目封面、状态、标签、外链、排序与 Markdown README。",
      coverUrl: "",
      status: "developing",
      tags: ["指南", "后台"],
      links: [{ label: "项目列表", icon: "link", value: "/projects" }],
      publishedAt: new Date("2025-10-02T00:00:00.000Z"),
      sortOrder: 90,
      content: [
        "## 如何添加项目",
        "",
        "进入后台「项目」页面，填写项目名称、标识、简介、状态、标签和 Markdown 正文即可。",
        "",
        "### 字段说明",
        "",
        "- **项目标识**：用于详情页地址 `/projects/[slug]`，仅支持小写字母、数字与连字符",
        "- **项目状态**：计划中、开发中、已发布、已归档",
        "- **项目外链**：支持 GitHub、Gitee、文档、演示地址与站内路径",
        "- **封面图**：可从媒体库上传，也可以填写外链地址",
        "- **排序**：数值越大越靠前",
        "",
        "> 保存后前台立即生效，无需重新构建。",
      ].join("\n"),
    },
  ];
  for (const sample of samples) {
    await prisma.project.create({ data: sample });
  }
  console.log(`已写入 ${samples.length} 个示例项目`);
}

// 示例相册：仅在相册表为空时写入，并附带两张本地官方示例图
async function seedGallery(): Promise<void> {
  const total = await prisma.galleryAlbum.count();
  if (total > 0) {
    console.log(`相册已有 ${total} 个，跳过示例数据`);
    return;
  }
  const samples = [
    {
      title: "可爱流萤",
      slug: "firefly-2026",
      description: "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
      coverUrl: "/gallery/firefly-2026/cover.avif",
      eventDate: new Date("2026-01-01T00:00:00.000Z"),
      location: "崩坏：星穹铁道",
      tags: ["崩坏星穹铁道", "流萤"],
      passwordHash: null,
      passwordHint: "",
      sortOrder: 100,
      enabled: true,
      photos: {
        create: [
          { imageUrl: "/gallery/firefly-2026/cover.avif", caption: "流萤 · 封面", sortOrder: 20 },
          { imageUrl: "/gallery/firefly-2026/1.avif", caption: "流萤 · 光影", sortOrder: 10 },
        ],
      },
    },
    {
      title: "加密相册示例",
      slug: "encrypted-test",
      description: "这是一个加密相册示例，只有输入正确密码后才能查看其中的照片。",
      coverUrl: "/gallery/firefly-2026/cover.avif",
      eventDate: new Date("2026-02-01T00:00:00.000Z"),
      location: "崩坏：星穹铁道",
      tags: ["加密相册", "示例"],
      passwordHash: await hash("123456", 10),
      passwordHint: "示例密码123456",
      sortOrder: 90,
      enabled: true,
      photos: {
        create: [
          { imageUrl: "/gallery/firefly-2026/cover.avif", caption: "加密相册照片一", sortOrder: 20 },
          { imageUrl: "/gallery/firefly-2026/1.avif", caption: "加密相册照片二", sortOrder: 10 },
        ],
      },
    },
  ];
  for (const sample of samples) {
    await prisma.galleryAlbum.create({ data: sample });
  }
  console.log(`已写入 ${samples.length} 个示例相册`);
}

// 把「项目」入口补进实际数据库导航；已有入口或缺少「我的」分组时保持原配置
async function seedProjectNavLink(): Promise<void> {
  const row = await prisma.setting.findUnique({
    where: { key: "navLinks" },
    select: { value: true },
  });
  if (!row) {
    return;
  }
  let links: unknown;
  try {
    links = JSON.parse(row.value);
  } catch {
    return;
  }
  if (!Array.isArray(links)) {
    return;
  }
  const myGroup = links.find(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).label === "我的",
  );
  if (typeof myGroup !== "object" || myGroup === null) {
    return;
  }
  const groupRecord = myGroup as Record<string, unknown>;
  if (!Array.isArray(groupRecord.children)) {
    return;
  }
  const children = groupRecord.children;
  const hasProject = children.some(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).href === "/projects",
  );
  if (hasProject) {
    return;
  }
  const projectChild = { label: "项目", href: "/projects" };
  const dynamicIndex = children.findIndex(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).href === "/dynamic",
  );
  if (dynamicIndex >= 0) {
    children.splice(dynamicIndex + 1, 0, projectChild);
  } else {
    children.push(projectChild);
  }
  await prisma.setting.update({
    where: { key: "navLinks" },
    data: { value: JSON.stringify(links) },
  });
  console.log("导航已加入「项目」入口");
}

// 把「相册」入口补进实际数据库导航；已有入口或缺少「我的」分组时保持原配置
async function seedGalleryNavLink(): Promise<void> {
  const row = await prisma.setting.findUnique({
    where: { key: "navLinks" },
    select: { value: true },
  });
  if (!row) {
    return;
  }
  let links: unknown;
  try {
    links = JSON.parse(row.value);
  } catch {
    return;
  }
  if (!Array.isArray(links)) {
    return;
  }
  const myGroup = links.find(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).label === "我的",
  );
  if (typeof myGroup !== "object" || myGroup === null) {
    return;
  }
  const groupRecord = myGroup as Record<string, unknown>;
  if (!Array.isArray(groupRecord.children)) {
    return;
  }
  const children = groupRecord.children;
  const hasGallery = children.some(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).href === "/gallery",
  );
  if (hasGallery) {
    return;
  }
  const galleryChild = { label: "相册", href: "/gallery" };
  const projectIndex = children.findIndex(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).href === "/projects",
  );
  const dynamicIndex = children.findIndex(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).href === "/dynamic",
  );
  if (projectIndex >= 0) {
    children.splice(projectIndex + 1, 0, galleryChild);
  } else if (dynamicIndex >= 0) {
    children.splice(dynamicIndex + 1, 0, galleryChild);
  } else {
    children.push(galleryChild);
  }
  await prisma.setting.update({
    where: { key: "navLinks" },
    data: { value: JSON.stringify(links) },
  });
  console.log("导航已加入「相册」入口");
}

// 把番组计划、VNDB、MyAnimeList 补进「我的」分组，并保持紧随哔哩哔哩的顺序
async function seedMediaNavLinks(): Promise<void> {
  const row = await prisma.setting.findUnique({
    where: { key: "navLinks" },
    select: { value: true },
  });
  if (!row) {
    return;
  }
  let links: unknown;
  try {
    links = JSON.parse(row.value);
  } catch {
    return;
  }
  if (!Array.isArray(links)) {
    return;
  }
  const myGroup = links.find(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).label === "我的",
  );
  if (typeof myGroup !== "object" || myGroup === null) {
    return;
  }
  const groupRecord = myGroup as Record<string, unknown>;
  if (!Array.isArray(groupRecord.children)) {
    return;
  }
  const children = groupRecord.children;
  const desiredLinks = [
    { label: "番组计划", href: "/bangumi" },
    { label: "VNDB", href: "/vndb" },
    { label: "MyAnimeList", href: "/myanimelist" },
  ];
  let insertIndex = children.findIndex(
    (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).href === "/bilibili",
  );
  if (insertIndex >= 0) {
    insertIndex += 1;
  } else {
    const searchIndex = children.findIndex(
      (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).href === "/search",
    );
    insertIndex = searchIndex >= 0 ? searchIndex : children.length;
  }
  let inserted = 0;
  for (const link of desiredLinks) {
    const exists = children.some(
      (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).href === link.href,
    );
    if (exists) {
      continue;
    }
    children.splice(insertIndex, 0, link);
    insertIndex += 1;
    inserted += 1;
  }
  if (inserted === 0) {
    return;
  }
  await prisma.setting.update({
    where: { key: "navLinks" },
    data: { value: JSON.stringify(links) },
  });
  console.log(`导航已加入 ${inserted} 个媒体收藏入口`);
}

async function main(): Promise<void> {
  await seedAdminUser();
  await seedSettings();
  await seedDynamics();
  await seedFriendLinks();
  await seedGuestbookPage();
  await seedBookmarks();
  await seedSponsors();
  await seedProjects();
  await seedProjectNavLink();
  await seedGallery();
  await seedGalleryNavLink();
  await seedMediaNavLinks();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("seed 执行失败：", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
