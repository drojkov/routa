CREATE TABLE `request_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`api_key_id` text,
	`model` text NOT NULL,
	`provider` text,
	`status` integer NOT NULL,
	`error_code` text,
	`stream` integer DEFAULT false NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`cost_micros` integer DEFAULT 0 NOT NULL,
	`estimated` integer DEFAULT false NOT NULL,
	`latency_ms` integer,
	`ttft_ms` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`api_key_id`) REFERENCES `api_key`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `request_log_user_idx` ON `request_log` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `request_log_key_idx` ON `request_log` (`api_key_id`,`created_at`);