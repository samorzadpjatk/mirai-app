CREATE TABLE "challenge_qr_code" (
	"challenge_id" varchar(36) PRIMARY KEY NOT NULL,
	"expected_value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_text" (
	"challenge_id" varchar(36) PRIMARY KEY NOT NULL,
	"expected_phrase" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenge_qr_code" ADD CONSTRAINT "challenge_qr_code_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_text" ADD CONSTRAINT "challenge_text_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "challenge_qr_code" ("challenge_id", "expected_value")
SELECT cl."challenge_id", cl."expected_value"
FROM "challenge_location" cl
JOIN "challenges" c ON cl."challenge_id" = c."id"
WHERE c."submission_type" = 'QR_CODE';--> statement-breakpoint
INSERT INTO "challenge_text" ("challenge_id", "expected_phrase")
SELECT cl."challenge_id", cl."expected_value"
FROM "challenge_location" cl
JOIN "challenges" c ON cl."challenge_id" = c."id"
WHERE c."submission_type" = 'TEXT';--> statement-breakpoint
ALTER TABLE "challenge_location" DROP COLUMN "expected_value";