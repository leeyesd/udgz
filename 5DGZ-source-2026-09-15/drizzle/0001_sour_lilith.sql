ALTER TABLE `places` ADD `parent_place_id` integer;--> statement-breakpoint
ALTER TABLE `places` ADD `name_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `places` ADD `aesthetic_score` integer;--> statement-breakpoint
ALTER TABLE `places` ADD `activity_score` integer;--> statement-breakpoint
ALTER TABLE `places` ADD `rarity_score` integer;--> statement-breakpoint
ALTER TABLE `places` ADD `tag_evidence` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_places_parent_name` ON `places` (`parent_place_id`,`name_key`);