-- AlterTable
ALTER TABLE `posts` ADD COLUMN `encrypted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `passwordHash` VARCHAR(100) NULL;
