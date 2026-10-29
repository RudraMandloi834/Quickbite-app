ALTER TABLE restaurant ADD COLUMN delivery_time_minutes INTEGER DEFAULT 30;
CREATE INDEX IF NOT EXISTS idx_restaurant_cuisine ON restaurant(cuisine);
CREATE INDEX idx_restaurant_coordinates ON restaurant(latitude, longitude);
