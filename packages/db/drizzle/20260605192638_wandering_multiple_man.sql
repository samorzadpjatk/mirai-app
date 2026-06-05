ALTER TABLE "user_agents" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_agents" CASCADE;--> statement-breakpoint
ALTER TABLE "challenge_location" ADD CONSTRAINT "challenge_location_latitude_valid" CHECK ("challenge_location"."target_latitude" between -90 and 90);--> statement-breakpoint
ALTER TABLE "challenge_location" ADD CONSTRAINT "challenge_location_longitude_valid" CHECK ("challenge_location"."target_longitude" between -180 and 180);--> statement-breakpoint
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_awarded_points_non_negative" CHECK ("challenge_submissions"."awarded_points" >= 0);--> statement-breakpoint
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_bonus_points_non_negative" CHECK ("challenge_submissions"."bonus_points" >= 0);--> statement-breakpoint
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_vote_position_positive" CHECK ("challenge_votes"."vote_position" > 0);--> statement-breakpoint
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_vote_points_positive" CHECK ("challenge_votes"."vote_points" > 0);--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_time_valid" CHECK ("challenges"."end_time" > "challenges"."start_time" OR "challenges"."end_time" IS NULL);--> statement-breakpoint
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_amount_non_zero" CHECK ("coin_transactions"."amount" <> 0);--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_coins_non_negative" CHECK ("groups"."coins" >= 0);--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_latitude_valid" CHECK ("locations"."latitude" BETWEEN -90 AND 90);--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_longitude_valid" CHECK ("locations"."longitude" BETWEEN -180 AND 180);--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_quantity_positive" CHECK ("rewards"."available_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_coin_cost_positive" CHECK ("rewards"."coin_cost" >= 0);--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_height_positive" CHECK ("sponsors"."height" >= 0);--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_offset_x_positive" CHECK ("sponsors"."offset_x" >= 0);--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_offset_y_positive" CHECK ("sponsors"."offset_y" >= 0);--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_dates_valid" CHECK ("trips"."end_date" > "trips"."start_date");