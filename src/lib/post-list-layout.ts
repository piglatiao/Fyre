// 文章列表布局偏好（列表 / 网格）：使用与官网主题同名的 localStorage 键，
// 并通过 <html data-post-list-layout> 暴露给 CSS —— 首屏解析阶段即可生效，不会出现布局跳变

export type PostListLayoutPreference = "auto" | "list" | "grid";

// 本地存储键：沿用官网命名，访客换站时习惯一致
export const POST_LIST_LAYOUT_KEY = "postListLayout";
// 根元素属性名：CSS 依据它决定文章列表使用列表还是网格
export const POST_LIST_LAYOUT_ATTR = "data-post-list-layout";

// 读取访客保存的布局偏好；未保存或值非法时返回 auto（由 CSS 按屏幕宽度自动选择）
export function readPostListLayout(): PostListLayoutPreference {
  if (typeof window === "undefined") {
    return "auto";
  }
  try {
    const stored = window.localStorage.getItem(POST_LIST_LAYOUT_KEY);
    return stored === "list" || stored === "grid" ? stored : "auto";
  } catch {
    return "auto";
  }
}

// 应用布局偏好：写入根元素属性并同步本地存储（auto 表示清除保存值、恢复自动）
export function applyPostListLayout(preference: PostListLayoutPreference): void {
  if (typeof window === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (preference === "auto") {
    root.removeAttribute(POST_LIST_LAYOUT_ATTR);
  } else {
    root.setAttribute(POST_LIST_LAYOUT_ATTR, preference);
  }
  try {
    if (preference === "auto") {
      window.localStorage.removeItem(POST_LIST_LAYOUT_KEY);
    } else {
      window.localStorage.setItem(POST_LIST_LAYOUT_KEY, preference);
    }
  } catch {
    // 隐私模式等场景下 localStorage 可能不可用，忽略即可
  }
}

// 首屏内联脚本：在 HTML 解析阶段应用偏好，避免列表从自动布局再跳变
export const POST_LIST_LAYOUT_INIT_SCRIPT =
  'try{var l=localStorage.getItem("postListLayout");if(l==="list"||l==="grid"){document.documentElement.setAttribute("data-post-list-layout",l);}}catch(e){}';