CREATE TABLE `request_content` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`request` text NOT NULL,
	`response` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `request_log`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `request_content_user_idx` ON `request_content` (`user_id`);--> statement-breakpoint
CREATE INDEX `request_content_created_idx` ON `request_content` (`created_at`);--> statement-breakpoint
ALTER TABLE `user` ADD `log_content` integer DEFAULT false NOT NULL;