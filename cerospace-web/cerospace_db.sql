-- Ekstensi untuk dukungan enkripsi dan hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabel pengguna (admin, seller, buyer)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'seller', 'buyer')),
    seller_status VARCHAR(20) DEFAULT NULL CHECK (seller_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel toko (1 toko per seller)
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel kategori produk
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel produk
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel banner slider beranda (dikelola admin)
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255),
    image_url VARCHAR(255) NOT NULL,
    link_url VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel item keranjang belanja
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (buyer_id, product_id)
);

-- Tabel pesanan (1 pesanan per toko)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    total_price INTEGER NOT NULL CHECK (total_price >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('transfer', 'cod')),
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu Pembayaran' CHECK (
        status IN ('Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Selesai')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel detail item pesanan
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase INTEGER NOT NULL CHECK (price_at_purchase >= 0)
);

-- Tabel ulasan produk
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_id, product_id, buyer_id)
);

-- Index untuk mempercepat query filter, pencarian, dan dasbor
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_banners_active_order ON banners(is_active, display_order ASC);

-- Data awal akun (admin, buyer, dan 5 seller resmi)
INSERT INTO users (name, email, password_hash, role, seller_status) VALUES
    ('Admin CeroSpace', 'admin@cerospace.com', '$2b$10$CJN617tJSUPbQQWdgxafneYzHt/I8zfETPsz2BW7GtUfWQHM2l7Je', 'admin', NULL),
    ('Budi Buyer', 'buyer@cerospace.com', '$2b$10$kN44TQuuPVd4m4eMebTGKumwTFY/ua2VklnBxtBLX5RY7RmG.L7Nq', 'buyer', NULL),
    ('Uniqlo Official', 'uniqlo@cerospace.com', '$2a$10$deeyqVnofQg4aCTut0pl.uJW4zKoadvycHn3OUaz01NqaUfz9P4WK', 'seller', 'approved'),
    ('H&M Official', 'hm@cerospace.com', '$2a$10$9FWDCLL9ONpjuj8d90KTvu4vF.ifIfQlaF71zHIoB8K6lwqCvIz