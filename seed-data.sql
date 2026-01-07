-- Insert test categories
INSERT INTO categories (name, status, created_at, updated_at) VALUES
('Restaurants', true, NOW(), NOW()),
('Coffee Shops', true, NOW(), NOW()),
('Fitness & Gym', true, NOW(), NOW()),
('Beauty & Spa', true, NOW(), NOW()),
('Auto Services', true, NOW(), NOW()),
('Retail Shopping', true, NOW(), NOW()),
('Entertainment', true, NOW(), NOW()),
('Healthcare', false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert test zipcodes
INSERT INTO zipcodes (zipcode, location, status, deleted, created_at, updated_at) VALUES
('10001', 'New York, NY', true, false, NOW(), NOW()),
('10002', 'New York, NY', true, false, NOW(), NOW()),
('90001', 'Los Angeles, CA', true, false, NOW(), NOW()),
('60601', 'Chicago, IL', true, false, NOW(), NOW()),
('77001', 'Houston, TX', true, false, NOW(), NOW()),
('33101', 'Miami, FL', true, false, NOW(), NOW()),
('00000', 'Test Location', false, false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert test conveniences
INSERT INTO conveniences (name, created_at, updated_at) VALUES
('Free WiFi', NOW(), NOW()),
('Parking Available', NOW(), NOW()),
('Credit Cards Accepted', NOW(), NOW()),
('Outdoor Seating', NOW(), NOW()),
('Pet Friendly', NOW(), NOW()),
('Wheelchair Accessible', NOW(), NOW()),
('Air Conditioned', NOW(), NOW()),
('Delivery Available', NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT 'Seed data inserted successfully!' as message;
