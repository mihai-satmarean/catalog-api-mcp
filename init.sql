-- Initial database setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a simple users table for demonstration
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on product name for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Create product requests table
CREATE TABLE IF NOT EXISTS product_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    personalization_remarks TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_requests_product_id ON product_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_requests(status);

-- Create provider quotes table
CREATE TABLE IF NOT EXISTS provider_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES product_requests(id),
    provider_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    delivery_days INTEGER NOT NULL,
    reliability_score DECIMAL(5, 2) NOT NULL,
    response_time INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for provider quotes
CREATE INDEX IF NOT EXISTS idx_provider_quotes_request_id ON provider_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_provider_quotes_provider_name ON provider_quotes(provider_name);
