import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import BannerPortal from "@/components/site/banner-portal";
import GalleryAlbumHero from "@/components/site/gallery-album-hero";
import GalleryPhotoMasonry from "@/components/site/gallery-photo-masonry";
import GalleryUnlock from "@/components/site/gallery-unlock";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { formatDate } from "@/lib/format-date";
import { decodePathSegment } from "@/lib/decode-path-segment";
import { galleryUnlockCookieName, verifyGalleryUnlockToken } from "@/server/auth/gallery-unlock";
import { createSiteServices } from "@/server/services/service-container";

// 相册详情 metadata：只使用公开元信息，不泄露照片内容
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { galleryService } = createSiteServices();
  const album = await galleryService.getAlbum(slug, false);
  if (!album) {
    return { title: "相册不存在" };
  }
  return {
    title: album.title,
    description: album.description || "记录光影、旅途与值得收藏的瞬间",
    keywords: album.tags,
    openGraph: {
      type: "article",
      title: album.title,
      description: album.description,
      images: album.coverUrl ? [album.coverUrl] : undefined,
    },
  };
}

// 相册详情页：加密相册先验证独立 Cookie，通过后才下发照片数据
export default async function GalleryAlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { galleryService } = createSiteServices();
  const access = await galleryService.getAlbumAccess(slug);
  if (!access) {
    notFound();
  }

  const cookieStore = await cookies();
  const unlocked = access.encrypted
    ? Boolean(
        access.passwordHash &&
          verifyGalleryUnlockToken(
            access.id,
            access.passwordHash,
            cookieStore.get(galleryUnlockCookieName(access.id))?.value ?? "",
          ),
      )
    : true;
  const album = await galleryService.getAlbum(slug, unlocked);
  if (!album) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <GalleryAlbumHero
        title={album.title}
        description={album.description}
        coverUrl={album.coverUrl}
        dateLabel={album.eventDate ? formatDate(album.eventDate) : ""}
        location={album.location}
        photoCount={album.photoCount}
        tags={album.tags}
        encrypted={album.encrypted}
      />

      <section className="card-base mb-4 w-full overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-6">
        {album.encrypted && !unlocked ? (
          <GalleryUnlock albumId={album.id} passwordHint={album.passwordHint} />
        ) : (
          <GalleryPhotoMasonry photos={album.photos} />
        )}
      </section>

      <BannerPortal>
        <PageBannerOverlay title={album.title} />
      </BannerPortal>
    </div>
  );
}
