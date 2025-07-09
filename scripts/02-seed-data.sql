-- Seed data for Predict2Deliver.AI
-- Run this after creating tables

-- Insert stores
INSERT INTO stores (name, address, latitude, longitude, capacity) VALUES
('Walmart Supercenter - Downtown', '123 Main St, Dallas, TX 75201', 32.7767, -96.7970, 2000),
('Walmart Neighborhood Market - Uptown', '456 Oak Ave, Dallas, TX 75204', 32.7877, -96.8089, 1500),
('Walmart Supercenter - North Dallas', '789 Elm St, Dallas, TX 75230', 32.8998, -96.7587, 2500),
('Walmart Express - East Dallas', '321 Pine Rd, Dallas, TX 75218', 32.7668, -96.7156, 1000),
('Walmart Supercenter - West Dallas', '654 Cedar Blvd, Dallas, TX 75212', 32.7668, -96.8667, 2200);

-- Insert products
INSERT INTO products (name, category, price, weight) VALUES
('Bananas (1 lb)', 'Fresh Produce', 0.68, 1.0),
('Milk (1 gallon)', 'Dairy', 3.48, 8.6),
('Bread (White Loaf)', 'Bakery', 1.28, 1.5),
('Eggs (12 count)', 'Dairy', 2.48, 1.5),
('Chicken Breast (1 lb)', 'Meat', 4.98, 1.0),
('Rice (5 lb bag)', 'Pantry', 3.98, 5.0),
('Apples (3 lb bag)', 'Fresh Produce', 2.98, 3.0),
('Ground Beef (1 lb)', 'Meat', 5.48, 1.0),
('Pasta (1 lb box)', 'Pantry', 1.48, 1.0),
('Yogurt (32 oz)', 'Dairy', 4.98, 2.0),
('Tomatoes (1 lb)', 'Fresh Produce', 1.98, 1.0),
('Cheese Slices (8 oz)', 'Dairy', 3.98, 0.5),
('Cereal (18 oz box)', 'Breakfast', 4.48, 1.2),
('Orange Juice (64 oz)', 'Beverages', 3.98, 4.0),
('Frozen Pizza', 'Frozen Foods', 2.98, 1.5);

-- Insert customers
INSERT INTO customers (name, email, address, latitude, longitude) VALUES
('John Smith', 'john.smith@email.com', '100 Commerce St, Dallas, TX 75202', 32.7758, -96.8085),
('Sarah Johnson', 'sarah.j@email.com', '200 Victory Ave, Dallas, TX 75219', 32.7903, -96.8103),
('Mike Davis', 'mike.davis@email.com', '300 Ross Ave, Dallas, TX 75201', 32.7813, -96.7969),
('Emily Wilson', 'emily.w@email.com', '400 Bryan St, Dallas, TX 75201', 32.7767, -96.7836),
('David Brown', 'david.brown@email.com', '500 Main St, Dallas, TX 75202', 32.7767, -96.7970),
('Lisa Garcia', 'lisa.garcia@email.com', '600 Elm St, Dallas, TX 75202', 32.7767, -96.7836),
('Robert Miller', 'robert.m@email.com', '700 Commerce St, Dallas, TX 75202', 32.7758, -96.8085),
('Jennifer Taylor', 'jennifer.t@email.com', '800 Main St, Dallas, TX 75202', 32.7767, -96.7970);

-- Insert delivery agents
INSERT INTO delivery_agents (name, phone, current_latitude, current_longitude, is_available, max_capacity) VALUES
('Agent Alpha', '+1-555-0101', 32.7767, -96.7970, true, 25),
('Agent Beta', '+1-555-0102', 32.7877, -96.8089, true, 20),
('Agent Gamma', '+1-555-0103', 32.8998, -96.7587, true, 30),
('Agent Delta', '+1-555-0104', 32.7668, -96.7156, false, 25),
('Agent Echo', '+1-555-0105', 32.7668, -96.8667, true, 20);

-- Insert smart lockers
INSERT INTO smart_lockers (location_name, address, latitude, longitude, total_compartments, available_compartments) VALUES
('Downtown Transit Center', '1401 Pacific Ave, Dallas, TX 75201', 32.7767, -96.8085, 60, 45),
('Uptown Shopping Plaza', '2500 McKinney Ave, Dallas, TX 75201', 32.7903, -96.8103, 40, 32),
('North Dallas Mall', '12000 North Central Expy, Dallas, TX 75243', 32.8998, -96.7587, 80, 65),
('East Dallas Community Center', '9009 Garland Rd, Dallas, TX 75218', 32.7668, -96.7156, 50, 38),
('West Dallas Hub', '1500 Singleton Blvd, Dallas, TX 75212', 32.7668, -96.8667, 45, 40);

-- Insert initial inventory for each store-product combination
INSERT INTO inventory (store_id, product_id, current_stock, reorder_threshold, max_capacity)
SELECT 
    s.id as store_id,
    p.id as product_id,
    FLOOR(RANDOM() * 80 + 20) as current_stock, -- Random stock between 20-100
    CASE 
        WHEN p.category = 'Fresh Produce' THEN 15
        WHEN p.category = 'Dairy' THEN 20
        WHEN p.category = 'Meat' THEN 10
        ELSE 12
    END as reorder_threshold,
    CASE 
        WHEN s.capacity > 2000 THEN 150
        WHEN s.capacity > 1500 THEN 120
        ELSE 100
    END as max_capacity
FROM stores s
CROSS JOIN products p;

-- Insert sample orders
INSERT INTO orders (customer_id, store_id, total_amount, status, order_date) 
SELECT 
    c.id,
    s.id,
    ROUND((RANDOM() * 50 + 10)::numeric, 2),
    CASE FLOOR(RANDOM() * 4)
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'processing'
        WHEN 2 THEN 'delivered'
        ELSE 'cancelled'
    END,
    NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30)
FROM customers c
CROSS JOIN stores s
WHERE RANDOM() < 0.3 -- Only create orders for 30% of customer-store combinations
LIMIT 50;

-- Insert demand forecasts
INSERT INTO demand_forecasts (product_id, store_id, predicted_demand, confidence_score, forecast_date)
SELECT 
    p.id,
    s.id,
    FLOOR(RANDOM() * 100 + 20) as predicted_demand,
    ROUND((RANDOM() * 0.3 + 0.7)::numeric, 2) as confidence_score, -- Between 0.7-1.0
    CURRENT_DATE + INTERVAL '1 day' * FLOOR(RANDOM() * 7) as forecast_date
FROM products p
CROSS JOIN stores s
WHERE RANDOM() < 0.8; -- Generate forecasts for 80% of product-store combinations
