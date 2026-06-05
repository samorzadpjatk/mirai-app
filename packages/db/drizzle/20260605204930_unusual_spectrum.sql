ALTER TABLE "challenge_location" RENAME TO "challenge_location_match";--> statement-breakpoint
ALTER TABLE "challenge_location_match" DROP CONSTRAINT "challenge_location_latitude_valid";--> statement-breakpoint
ALTER TABLE "challenge_location_match" DROP CONSTRAINT "challenge_location_longitude_valid";--> statement-breakpoint
ALTER TABLE "challenge_location_match" DROP CONSTRAINT "challenge_location_challenge_id_challenges_id_fk";
--> statement-breakpoint
ALTER TABLE "challenge_location_match" ADD CONSTRAINT "challenge_location_match_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_location_match" ADD CONSTRAINT "challenge_location_match_latitude_valid" CHECK ("challenge_location_match"."target_latitude" between -90 and 90);--> statement-breakpoint
ALTER TABLE "challenge_location_match" ADD CONSTRAINT "challenge_location_match_longitude_valid" CHECK ("challenge_location_match"."target_longitude" between -180 and 180);