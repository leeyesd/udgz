-- Execute the entire file atomically in one D1 batch, after backup and status counts.
-- Do not replay on an already migrated database.
CREATE TABLE `places_workflow_new` (
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
	`reservation_required` integer,
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
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
 `research_status` text NOT NULL DEFAULT 'hold' CHECK (research_status IN ('hold','incomplete','review_required')),
 `review_status` text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
 `is_public` integer NOT NULL DEFAULT 0 CHECK (is_public IN (0,1))
);
INSERT INTO places_workflow_new (`id`, `name`, `branch_name`, `category`, `full_address`, `address_key`, `province`, `city`, `district`, `weekly_hours`, `holiday_hours`, `reservation_required`, `reservation_open_rule`, `reservation_url`, `age_restriction`, `prices`, `time_surcharge`, `themes`, `environment`, `parking_type`, `parking_fee`, `parking_support`, `nursing_room`, `changing_table`, `official_sources`, `image_url`, `image_source_url`, `summary`, `reasons`, `caution`, `age_hint`, `score`, `ticket_candidate`, `affiliate_url`, `status`, `duplicate_of_id`, `reviewer`, `ai_researched`, `last_verified_at`, `created_at`, `updated_at`, research_status, review_status, is_public) SELECT `id`, `name`, `branch_name`, `category`, `full_address`, `address_key`, `province`, `city`, `district`, `weekly_hours`, `holiday_hours`, `reservation_required`, `reservation_open_rule`, `reservation_url`, `age_restriction`, `prices`, `time_surcharge`, `themes`, `environment`, `parking_type`, `parking_fee`, `parking_support`, `nursing_room`, `changing_table`, `official_sources`, `image_url`, `image_source_url`, `summary`, `reasons`, `caution`, `age_hint`, `score`, `ticket_candidate`, `affiliate_url`, `status`, `duplicate_of_id`, `reviewer`, `ai_researched`, `last_verified_at`, `created_at`, `updated_at`, CASE WHEN status = 'published' THEN 'review_required' ELSE 'hold' END, CASE WHEN status = 'published' THEN 'approved' ELSE 'pending' END, CASE WHEN status = 'published' THEN 1 ELSE 0 END FROM places;
DROP TABLE places;
ALTER TABLE places_workflow_new RENAME TO places;
CREATE INDEX idx_places_status ON places(status);
CREATE INDEX idx_places_address_key ON places(address_key);
CREATE INDEX idx_places_region ON places(province, city, district);
CREATE INDEX idx_places_public ON places(is_public);
