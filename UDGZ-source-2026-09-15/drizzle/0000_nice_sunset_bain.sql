CREATE TABLE `places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`branch_name` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '체험' NOT NULL,
	`full_address` text DEFAULT '' NOT NULL,
	`address_key` text DEFAULT '' NOT NULL,
	`province` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`district` text DEFAULT '' NOT NULL,
	`weekly_hours` text NOT NULL,
	`holiday_hours` text DEFAULT '확인 필요' NOT NULL,
	`reservation_required` integer DEFAULT false NOT NULL,
	`reservation_open_rule` text DEFAULT '' NOT NULL,
	`reservation_url` text DEFAULT '' NOT NULL,
	`age_restriction` text DEFAULT '없음' NOT NULL,
	`prices` text NOT NULL,
	`time_surcharge` text DEFAULT '' NOT NULL,
	`themes` text NOT NULL,
	`environment` text DEFAULT '혼합' NOT NULL,
	`parking_type` text DEFAULT '확인 필요' NOT NULL,
	`parking_fee` text DEFAULT '' NOT NULL,
	`parking_support` text DEFAULT '' NOT NULL,
	`nursing_room` text DEFAULT '확인 필요' NOT NULL,
	`changing_table` text DEFAULT '확인 필요' NOT NULL,
	`official_sources` text NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`image_source_url` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`reasons` text NOT NULL,
	`caution` text DEFAULT '' NOT NULL,
	`age_hint` text DEFAULT '영유아부터' NOT NULL,
	`score` integer DEFAULT 80 NOT NULL,
	`ticket_candidate` integer DEFAULT false NOT NULL,
	`affiliate_url` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`duplicate_of_id` integer,
	`reviewer` text DEFAULT '' NOT NULL,
	`ai_researched` integer DEFAULT false NOT NULL,
	`last_verified_at` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_places_status` ON `places` (`status`);--> statement-breakpoint
CREATE INDEX `idx_places_address_key` ON `places` (`address_key`);--> statement-breakpoint
CREATE INDEX `idx_places_region` ON `places` (`province`,`city`,`district`);--> statement-breakpoint
CREATE TABLE `research_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`query` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
