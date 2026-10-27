CREATE TABLE `contact_message` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`topic` text NOT NULL,
	`message` text NOT NULL,
	`ip_address` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `login_event` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ip_address` text,
	`country` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `login_event_user_idx` ON `login_event` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `refund_request` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount_micros` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reason` text,
	`ip_address` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `refund_request_user_idx` ON `refund_request` (`user_id`);--> statement-breakpoint
ALTER TABLE `payment` ADD `ip_address` text;--> statement-breakpoint
ALTER TABLE `payment` ADD `country` text;--> statement-breakpoint
ALTER TABLE `payment` ADD `user_agent` text;--> statement-breakpoint
ALTER TABLE `payment` ADD `waiver_at` integer;