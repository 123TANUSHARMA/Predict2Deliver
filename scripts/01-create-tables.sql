-- Create tables for Predict2Deliver.AI
-- Run this script to set up the database schema

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    weight DECIMAL(8, 2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reorder_threshold INTEGER NOT NULL DEFAULT 10,
    max_capacity INTEGER NOT NULL DEFAULT 100,
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(store_id, product_id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    phone varchar(20) NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT NOW(),
    delivery_date TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

-- Demand forecasts table
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    predicted_demand INTEGER NOT NULL,
    confidence_score DECIMAL(3, 2) DEFAULT 0.85,
    forecast_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery agents table
CREATE TABLE IF NOT EXISTS delivery_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    is_available BOOLEAN DEFAULT true,
    max_capacity INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Smart lockers table
CREATE TABLE IF NOT EXISTS smart_lockers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    total_compartments INTEGER DEFAULT 50,
    available_compartments INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Locker pickups table
CREATE TABLE IF NOT EXISTS locker_pickups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    locker_id UUID REFERENCES smart_lockers(id) ON DELETE CASCADE,
    compartment_number INTEGER NOT NULL,
    pickup_code VARCHAR(10) NOT NULL,
    qr_code TEXT,
    otp_code VARCHAR(6) NOT NULL,
    otp_verified BOOLEAN DEFAULT false,
    is_picked_up BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery routes table
CREATE TABLE IF NOT EXISTS delivery_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES delivery_agents(id) ON DELETE CASCADE,
    route_date DATE NOT NULL,
    total_distance DECIMAL(8, 2),
    estimated_duration INTEGER, -- in minutes
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Route stops table
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID REFERENCES delivery_routes(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);
