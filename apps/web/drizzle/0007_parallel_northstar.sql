ALTER TABLE `refund_request` ADD `kind` text DEFAULT 'refund' NOT NULL;--> statement-breakpoint
ALTER TABLE `refund_request` ADD `payment_id` text REFERENCES payment(id);