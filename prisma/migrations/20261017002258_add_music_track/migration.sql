-- CreateTable
CREATE TABLE `music_tracks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `artist` VARCHAR(200) NOT NULL DEFAULT '',
    `audioUrl` VARCHAR(500) NOT NULL,
    `coverUrl` VARCHAR(500) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `music_tracks_sortOrder_id_idx`(`sortOrder`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
