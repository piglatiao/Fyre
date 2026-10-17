-- CreateTable
CREATE TABLE `gallery_albums` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `description` VARCHAR(500) NOT NULL DEFAULT '',
    `coverUrl` VARCHAR(500) NOT NULL DEFAULT '',
    `eventDate` DATETIME(3) NULL,
    `location` VARCHAR(200) NOT NULL DEFAULT '',
    `tags` JSON NOT NULL,
    `passwordHash` VARCHAR(255) NULL,
    `passwordHint` VARCHAR(255) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gallery_albums_slug_key`(`slug`),
    INDEX `gallery_albums_enabled_sortOrder_eventDate_idx`(`enabled`, `sortOrder`, `eventDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `albumId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `caption` VARCHAR(300) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `gallery_photos_albumId_sortOrder_id_idx`(`albumId`, `sortOrder`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gallery_photos` ADD CONSTRAINT `gallery_photos_albumId_fkey` FOREIGN KEY (`albumId`) REFERENCES `gallery_albums`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
