-- Add transport_legs JSONB column to trip_stops for multi-leg transport support
ALTER TABLE trip_stops ADD COLUMN IF NOT EXISTS transport_legs JSONB;
