-- Add trip rating column (manager-assigned, 0–100, nullable until rated)
ALTER TABLE "trips"
    ADD COLUMN "rating" INTEGER;

-- Add CHECK constraint for rating range
ALTER TABLE "trips"
    ADD CONSTRAINT "chk_trips_rating_range"
    CHECK ("rating" IS NULL OR ("rating" >= 0 AND "rating" <= 100));

-- Add user profile fields (phone, bio, location)
ALTER TABLE "users"
    ADD COLUMN "phone"    VARCHAR(30),
    ADD COLUMN "bio"      TEXT,
    ADD COLUMN "location" VARCHAR(120);
