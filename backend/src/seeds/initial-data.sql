-- Insert subscription plans
INSERT INTO subscription_plan (id, name, description, price, type, duration, status, "isPublic", "trialPeriod", features) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Basic Plan', 'Perfect for small restaurants', 29.99, 'monthly', 30, 'active', true, 15, '{"maxTables": 10, "maxUsers": 5, "maxMenuItems": 100, "analytics": false, "customReports": false, "prioritySupport": false}'),
('550e8400-e29b-41d4-a716-446655440002', 'Professional Plan', 'Great for growing restaurants', 59.99, 'monthly', 30, 'active', true, 15, '{"maxTables": 25, "maxUsers": 15, "maxMenuItems": 500, "analytics": true, "customReports": true, "prioritySupport": false}'),
('550e8400-e29b-41d4-a716-446655440003', 'Enterprise Plan', 'For large restaurant chains', 99.99, 'monthly', 30, 'active', true, 15, '{"maxTables": -1, "maxUsers": -1, "maxMenuItems": -1, "analytics": true, "customReports": true, "prioritySupport": true}'),
('550e8400-e29b-41d4-a716-446655440004', 'Basic Annual', 'Basic plan with annual billing', 299.99, 'yearly', 365, 'active', true, 15, '{"maxTables": 10, "maxUsers": 5, "maxMenuItems": 100, "analytics": false, "customReports": false, "prioritySupport": false}'),
('550e8400-e29b-41d4-a716-446655440005', 'Professional Annual', 'Professional plan with annual billing', 599.99, 'yearly', 365, 'active', true, 15, '{"maxTables": 25, "maxUsers": 15, "maxMenuItems": 500, "analytics": true, "customReports": true, "prioritySupport": false}');

-- Insert demo tenant
INSERT INTO tenant (id, name, schema, subdomain, "displayName", "contactEmail", "contactPhone", country, currency, status, "preferredPaymentProvider") VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Demo Restaurant', 'demo_restaurant', 'demo', 'Demo Restaurant & Cafe', 'demo@restaurant.com', '+1-555-0123', 'United States', 'usd', 'trial', 'stripe');

-- Insert demo user (admin)
INSERT INTO "user" (id, username, password, "fullName", email, role, "tenantId", "isSuperAdmin") VALUES
('550e8400-e29b-41d4-a716-446655440020', 'admin', '$2b$10$K7L/8Y1t85jzrSP8s1J8/.Hn8eGHqJ9n7J8s1J8/.Hn8eGHqJ9n7J8', 'Admin User', 'admin@demo.com', 'admin', '550e8400-e29b-41d4-a716-446655440010', false);

-- Insert demo categories
INSERT INTO category (id, name, description, "displayOrder", "isActive", "tenantId") VALUES
('550e8400-e29b-41d4-a716-446655440030', 'Appetizers', 'Start your meal with our delicious appetizers', 1, true, '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440031', 'Main Courses', 'Our signature main dishes', 2, true, '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440032', 'Desserts', 'Sweet endings to your meal', 3, true, '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440033', 'Beverages', 'Refreshing drinks and beverages', 4, true, '550e8400-e29b-41d4-a716-446655440010');

-- Insert demo menu items
INSERT INTO menu_item (id, name, description, price, "isAvailable", "categoryId") VALUES
('550e8400-e29b-41d4-a716-446655440040', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 12.99, true, '550e8400-e29b-41d4-a716-446655440030'),
('550e8400-e29b-41d4-a716-446655440041', 'Grilled Chicken', 'Tender grilled chicken breast with herbs', 18.99, true, '550e8400-e29b-41d4-a716-446655440031'),
('550e8400-e29b-41d4-a716-446655440042', 'Chocolate Cake', 'Rich chocolate cake with vanilla ice cream', 8.99, true, '550e8400-e29b-41d4-a716-446655440032'),
('550e8400-e29b-41d4-a716-446655440043', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, true, '550e8400-e29b-41d4-a716-446655440033');

-- Insert demo tables
INSERT INTO "table" (id, number, capacity, status) VALUES
('550e8400-e29b-41d4-a716-446655440050', 1, 4, 'available'),
('550e8400-e29b-41d4-a716-446655440051', 2, 2, 'available'),
('550e8400-e29b-41d4-a716-446655440052', 3, 6, 'available'),
('550e8400-e29b-41d4-a716-446655440053', 4, 4, 'available');

-- Insert Turkish demo tenant
INSERT INTO tenant (id, name, schema, subdomain, "displayName", "contactEmail", "contactPhone", country, currency, status, "preferredPaymentProvider") VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Turkish Restaurant', 'turkish_restaurant', 'turkish-demo', 'Turkish Delight Restaurant', 'info@turkishrestaurant.com', '+90-555-0123', 'Turkey', 'try', 'trial', 'iyzico');

-- Insert Turkish demo user (admin)
INSERT INTO "user" (id, username, password, "fullName", email, role, "tenantId", "isSuperAdmin") VALUES
('550e8400-e29b-41d4-a716-446655440021', 'turkish-admin', '$2b$10$K7L/8Y1t85jzrSP8s1J8/.Hn8eGHqJ9n7J8s1J8/.Hn8eGHqJ9n7J8', 'Turkish Admin', 'admin@turkishrestaurant.com', 'admin', '550e8400-e29b-41d4-a716-446655440011', false);
