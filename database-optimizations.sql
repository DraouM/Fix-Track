-- Database Performance Optimizations for Fixary
-- Run this script to add indexes and optimize database performance

-- Create indexes for repairs table
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_customer ON repairs(customer_name);
CREATE INDEX IF NOT EXISTS idx_repairs_created_at ON repairs(created_at);
CREATE INDEX IF NOT EXISTS idx_repairs_updated_at ON repairs(updated_at);
CREATE INDEX IF NOT EXISTS idx_repairs_device_type ON repairs(device_type);

-- Create indexes for inventory table
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity) WHERE quantity < 10;

-- Create indexes for payments table (if it exists)
CREATE INDEX IF NOT EXISTS idx_payments_repair_id ON payments(repair_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Optimize database performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;

-- Update table statistics for query optimizer
ANALYZE;

-- Vacuum to optimize database file
VACUUM;