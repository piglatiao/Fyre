"use client";

import { ClipboardList, Info, Mail } from "lucide-react";
import CopyButton from "./copy-button";
import type { FriendPageNote } from "@/types/friend-page-note";

// 友链申请指南：复刻官网的信息卡、三步流程、申请模板与注意事项
export default function FriendGuide({
  siteName,
  siteDescription,
  siteUrl,
  avatarUrl,
  email,
  notes,
}: {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  avatarUrl: string;
  email: string;
  notes: FriendPageNote[];
}) {
  const siteFields = [
    { label: "站点名称", value: siteName },
    { label: "站点描述", value: siteDescription },
    { label: "站点链接", value: siteUrl },
    { label: "头像链接", value: avatarUrl },
  ];
  const applicationTemplate = [
    "站点名称：您的站点名称",
    "站点描述：您的站点描述",
    "站点链接：您的站点链接",
    "头像链接：您的站点头像",
  ].join("\n");

  return (
    <div className="not-prose space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex flex-col overflow-hidden rounded-2xl border border-(--line-divider)">
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-xl bg-(--btn-regular-bg) text-xl font-bold text-(--primary) ring-2 ring-(--primary)/20">
                  {siteName.trim().charAt(0) || "友"}
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 头像由后台配置任意地址
                    <img
                      src={avatarUrl}
                      alt={`${siteName} 的头像`}
                      className="absolute inset-0 size-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
                <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-(--primary) text-white shadow">
                  <Mail aria-hidden className="size-3" />
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold">{siteName}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-(--content-meta)">{siteDescription}</p>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {siteFields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between gap-2 rounded-lg bg-black/4 px-3 py-2 dark:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="mb-0.5 text-[0.65rem] text-(--content-meta)">{field.label}</p>
                    <p className="truncate text-xs font-medium" title={field.value}>
                      {field.value || "未配置"}
                    </p>
                  </div>
                  <CopyButton value={field.value} label={`复制${field.label}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-2xl border border-(--line-divider)">
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <span className="flex size-7 items-center justify-center rounded-lg bg-(--primary)/10 text-(--primary)">
                <ClipboardList aria-hidden className="size-4" />
              </span>
              申请友链
            </h3>

            <div className="flex-1">
              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--primary) text-xs font-bold text-white">
                    1
                  </span>
                  <span className="my-1.5 w-0.5 flex-1 bg-(--line-divider)" />
                </div>
                <div className="pb-4">
                  <p className="mb-1 text-sm font-semibold">添加本站友链</p>
                  <p className="text-xs leading-relaxed text-(--content-meta)">
                    请先在您的网站友链页面添加本站信息，可直接复制左侧各字段
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--primary) text-xs font-bold text-white">
                    2
                  </span>
                  <span className="my-1.5 w-0.5 flex-1 bg-(--line-divider)" />
                </div>
                <div className="min-w-0 flex-1 pb-4">
                  <p className="mb-1 text-sm font-semibold">
                    评论区留言或发送申请邮件
                    {email ? (
                      <>
                        {" "}至：<code className="rounded bg-black/5 px-1.5 py-0.5 text-[0.7rem] dark:bg-white/10">{email}</code>
                      </>
                    ) : null}
                  </p>
                  <p className="mb-2 text-xs leading-relaxed text-(--content-meta)">
                    复制下方模板，填写后到评论区或邮件中发送
                  </p>
                  <div className="relative overflow-x-auto rounded-lg bg-black/4 p-4 pr-11 text-[0.7rem] leading-relaxed whitespace-pre dark:bg-white/5">
                    <CopyButton
                      value={applicationTemplate}
                      label="复制友链申请模板"
                      className="absolute top-2 right-2"
                    />
                    {applicationTemplate}
                  </div>
                  {email ? (
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent("友链申请")}`}
                      className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-(--primary) transition hover:bg-(--btn-plain-bg-hover)"
                    >
                      <Mail aria-hidden className="size-3.5" />
                      发送邮件
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--primary) text-xs font-bold text-white">
                    3
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold">等待审核</p>
                  <p className="text-xs leading-relaxed text-(--content-meta)">确认信息无误后会尽快添加您的友链</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {notes.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-(--line-divider)">
          <div className="p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
              <Info aria-hidden className="size-4.5 text-(--primary)" />
              注意事项
            </h3>
            <div className="space-y-3 text-sm text-(--content-meta)">
              {notes.map((note, index) => (
                <div key={`${note.title}-${index}`} className="flex items-baseline gap-2.5">
                  <span className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-(--primary)" />
                  <p>
                    <strong className="text-neutral-800 dark:text-neutral-200">{note.title}</strong>：{note.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
