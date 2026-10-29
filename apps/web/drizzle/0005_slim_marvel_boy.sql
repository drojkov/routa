ALTER TABLE `api_key` ADD `blocked_at` integer;--> statement-breakpoint
ALTER TABLE `payment` ADD `method` text DEFAULT 'card' NOT NULL;--> statement-breakpoint
ALTER TABLE `payment` ADD `billing_details` text;--> statement-breakpoint
ALTER TABLE `payment` ADD `waiver_text` text;--> statement-breakpoint
ALTER TABLE `request_log` ADD `ip_address` text;--> statement-breakpoint
ALTER TABLE `user` ADD `closed_at` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `suspended_at` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `suspend_reason` text;--> statement-breakpoint
ALTER TABLE `user` ADD `blocked_models` text;