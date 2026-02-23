-- =========================================
-- TechTalks IMS - MySQL Setup + Seed Script
-- =========================================

DROP DATABASE IF EXISTS tecktalks_inventory;

CREATE DATABASE tecktalks_inventory
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE tecktalks_inventory;

-- =========================================
-- TABLES
-- =========================================

CREATE TABLE inventories (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stocks (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    inventory_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NULL,
    location VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_stocks_inventory_name UNIQUE (inventory_id, name),
    CONSTRAINT fk_stocks_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES inventories(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    stock_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NULL,
    price DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    quantity INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uq_products_stock_sku UNIQUE (stock_id, sku),
    CONSTRAINT fk_products_stock
        FOREIGN KEY (stock_id)
        REFERENCES stocks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    stock_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_pos_stock_name UNIQUE (stock_id, name),
    CONSTRAINT fk_pos_stock
        FOREIGN KEY (stock_id)
        REFERENCES stocks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pos_sessions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    pos_id INT UNSIGNED NOT NULL,
    status ENUM('OPEN', 'CLOSED') NOT NULL,
    opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    PRIMARY KEY (id),
    INDEX idx_pos_sessions_pos_id (pos_id),
    INDEX idx_pos_sessions_status (status),
    CONSTRAINT fk_pos_sessions_pos
        FOREIGN KEY (pos_id)
        REFERENCES pos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- SAMPLE SEED DATA
-- =========================================

INSERT INTO inventories (id, name) VALUES
(1, 'Main Inventory'),
(2, 'Secondary Inventory'),
(3, 'Electronics Inventory'),
(4, 'Grocery Inventory'),
(5, 'Pharmacy Inventory');

INSERT INTO stocks (id, inventory_id, name, category, location) VALUES
(1, 1, 'Warehouse A', 'General', 'Beirut'),
(2, 2, 'Warehouse B', 'Accessories', 'Jounieh'),
(3, 3, 'Electronics Rack', 'Electronics', 'Tripoli'),
(4, 4, 'Cold Storage', 'Food', 'Saida'),
(5, 5, 'Pharmacy Shelf', 'Health', 'Hamra');

INSERT INTO products (id, stock_id, name, sku, price, quantity) VALUES
(1, 1, 'A4 Printer Paper', 'PAPER-A4-001', 6.50, 40),
(2, 2, 'USB-C Cable', 'USBC-001', 8.99, 25),
(3, 3, 'Mechanical Keyboard', 'KB-MECH-001', 45.00, 10),
(4, 4, 'Water Bottle Pack', 'WATER-6PK-001', 3.75, 60),
(5, 5, 'Vitamin C 1000mg', 'VITC-1000-001', 12.50, 18);

INSERT INTO pos (id, stock_id, name) VALUES
(1, 1, 'POS-MainDesk'),
(2, 2, 'POS-Accessories'),
(3, 3, 'POS-Electronics'),
(4, 4, 'POS-Grocery'),
(5, 5, 'POS-Pharmacy');

INSERT INTO pos_sessions (id, pos_id, status, opened_at, closed_at) VALUES
(1, 1, 'OPEN',   '2026-02-21 08:00:00', NULL),
(2, 2, 'CLOSED', '2026-02-21 08:15:00', '2026-02-21 16:30:00'),
(3, 3, 'OPEN',   '2026-02-21 09:00:00', NULL),
(4, 4, 'CLOSED', '2026-02-21 07:45:00', '2026-02-21 15:20:00'),
(5, 5, 'OPEN',   '2026-02-21 10:00:00', NULL);

-- =========================================
-- QUICK CHECKS
-- =========================================
SELECT * FROM inventories;
SELECT * FROM stocks;
SELECT * FROM products;
SELECT * FROM pos;
SELECT * FROM pos_sessions;