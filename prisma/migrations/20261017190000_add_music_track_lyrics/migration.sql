-- 本地曲库歌词：保存 LRC 文本，空值表示暂无歌词
ALTER TABLE `music_tracks` ADD COLUMN `lyrics` LONGTEXT NULL;
