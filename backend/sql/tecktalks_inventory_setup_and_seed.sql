USE tecktalks_inventory_clean;

START TRANSACTION;

-- users (Epic A)
INSERT INTO users (id, email, role, hashed_password) VALUES
(1, 'admin@tecktalks.local', 'admin', 'temp_admin_hash'),
(2, 'cashier1@tecktalks.local', 'cashier', 'temp_cashier_hash'),
(3, 'cashier2@tecktalks.local', 'cashier', 'temp_cashier_hash');

-- inventories
INSERT INTO inventories (id, name) VALUES
(1, 'Main Inventory'),
(2, 'Secondary Inventory'),
(3, 'Electronics Inventory'),
(4, 'Grocery Inventory'),
(5, 'Pharmacy Inventory');

-- stocks
INSERT INTO stocks (id, inventory_id, name, category, location) VALUES
(1, 1, 'Warehouse A', 'General', 'Beirut'),
(2, 2, 'Warehouse B', 'Accessories', 'Jounieh'),
(3, 3, 'Electronics Rack', 'Electronics', 'Tripoli'),
(4, 4, 'Cold Storage', 'Food', 'Saida'),
(5, 5, 'Pharmacy Shelf', 'Health', 'Hamra');

-- products
INSERT INTO products (id, stock_id, name, sku, price, quantity) VALUES
(1, 1, 'A4 Printer Paper', 'PAPER-A4-001', 6.50, 40),
(2, 2, 'USB-C Cable', 'USBC-001', 8.99, 25),
(3, 3, 'Mechanical Keyboard', 'KB-MECH-001', 45.00, 10),
(4, 4, 'Water Bottle Pack', 'WATER-6PK-001', 3.75, 60),
(5, 5, 'Vitamin C 1000mg', 'VITC-1000-001', 12.50, 18);

-- POS terminals
INSERT INTO pos (id, stock_id, name) VALUES
(1, 1, 'POS-MainDesk'),
(2, 2, 'POS-Accessories'),
(3, 3, 'POS-Electronics'),
(4, 4, 'POS-Grocery'),
(5, 5, 'POS-Pharmacy');

-- POS sessions
INSERT INTO pos_sessions (id, pos_id, status, opened_at, closed_at) VALUES
(1, 1, 'OPEN',   '2026-02-21 08:00:00', NULL),
(2, 2, 'CLOSED', '2026-02-21 08:15:00', '2026-02-21 16:30:00'),
(3, 3, 'OPEN',   '2026-02-21 09:00:00', NULL),
(4, 4, 'CLOSED', '2026-02-21 07:45:00', '2026-02-21 15:20:00'),
(5, 5, 'OPEN',   '2026-02-21 10:00:00', NULL);

COMMIT;
-- =========================================
-- QUICK CHECKS
-- =========================================
SELECT * FROM inventories;
SELECT * FROM stocks;
SELECT * FROM products;
SELECT * FROM pos;
SELECT * FROM pos_sessions;
SELECT * FROM users;