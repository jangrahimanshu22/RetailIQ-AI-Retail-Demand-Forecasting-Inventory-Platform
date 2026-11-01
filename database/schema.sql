-- ============================================================
-- Retail Demand Forecasting System - MySQL Schema
-- ============================================================
CREATE DATABASE IF NOT EXISTS retail_forecast_db;
USE retail_forecast_db;

-- ---------- USERS (role-based access) ----------
CREATE TABLE IF NOT EXISTS users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('Admin', 'Manager', 'Analyst') NOT NULL DEFAULT 'Analyst',
    email         VARCHAR(150),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- STORES ----------
CREATE TABLE IF NOT EXISTS stores (
    store_id   VARCHAR(10) PRIMARY KEY,
    location   VARCHAR(100) NOT NULL
);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
    product_id   VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category     VARCHAR(100) NOT NULL,
    unit_price   DECIMAL(10, 2) NOT NULL
);

-- ---------- SALES (fact table) ----------
CREATE TABLE IF NOT EXISTS sales (
    sale_id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_date         DATE NOT NULL,
    product_id        VARCHAR(10) NOT NULL,
    store_id          VARCHAR(10) NOT NULL,
    customer_id       VARCHAR(20),
    sales_quantity    INT NOT NULL,
    unit_price        DECIMAL(10, 2) NOT NULL,
    revenue           DECIMAL(12, 2) NOT NULL,
    promotion         TINYINT(1) DEFAULT 0,
    discount          DECIMAL(5, 2) DEFAULT 0,
    holiday_indicator TINYINT(1) DEFAULT 0,
    season            VARCHAR(20),
    inventory_level   INT,
    weather           VARCHAR(30),
    competitor_price  DECIMAL(10, 2),
    fuel_price        DECIMAL(10, 2),
    economic_index    DECIMAL(10, 2),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    INDEX idx_sales_date (sale_date),
    INDEX idx_sales_product_store (product_id, store_id)
);

-- ---------- FORECASTS ----------
CREATE TABLE IF NOT EXISTS forecasts (
    forecast_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    generated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    product_id        VARCHAR(10) NOT NULL,
    store_id          VARCHAR(10) NOT NULL,
    forecast_date     DATE NOT NULL,
    horizon_label     VARCHAR(20),
    predicted_demand  DECIMAL(10, 2) NOT NULL,
    model_used        VARCHAR(50),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    INDEX idx_forecast_date (forecast_date)
);

-- ---------- MODEL PREDICTIONS / EVALUATION LOG ----------
CREATE TABLE IF NOT EXISTS predictions (
    prediction_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_name     VARCHAR(50) NOT NULL,
    trained_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mae            DECIMAL(10, 4),
    rmse           DECIMAL(10, 4),
    mape           DECIMAL(10, 4),
    r2_score       DECIMAL(10, 4),
    is_best_model  TINYINT(1) DEFAULT 0
);

-- ---------- INVENTORY RECOMMENDATIONS ----------
CREATE TABLE IF NOT EXISTS inventory_recommendations (
    rec_id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id         VARCHAR(10) NOT NULL,
    store_id           VARCHAR(10) NOT NULL,
    generated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_inventory  INT,
    safety_stock       DECIMAL(10, 2),
    reorder_point      DECIMAL(10, 2),
    recommended_restock DECIMAL(10, 2),
    alert_status       VARCHAR(30),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id)
);

-- Sample seed data
INSERT IGNORE INTO stores (store_id, location) VALUES
 ('S01', 'Delhi'), ('S02', 'Mumbai'), ('S03', 'Bangalore'), ('S04', 'Chennai');

INSERT IGNORE INTO products (product_id, product_name, category, unit_price) VALUES
 ('P001', 'Wireless Mouse', 'Electronics', 1200),
 ('P002', 'Bluetooth Speaker', 'Electronics', 1200),
 ('P003', 'Office Chair', 'Furniture', 4500),
 ('P004', 'Study Desk', 'Furniture', 4500),
 ('P005', 'Running Shoes', 'Footwear', 1800),
 ('P006', 'Formal Shoes', 'Footwear', 1800),
 ('P007', 'Cotton T-Shirt', 'Apparel', 700),
 ('P008', 'Denim Jeans', 'Apparel', 700),
 ('P009', 'Green Tea', 'Grocery', 120),
 ('P010', 'Instant Noodles', 'Grocery', 120);
