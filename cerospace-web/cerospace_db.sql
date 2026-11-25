-- Database: cerospace_db
-- Catatan: Buat database cerospace_db dulu di pgAdmin, lalu jalankan query ini di Query Tool

-- Ekstensi untuk dukungan enkripsi dan hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Pembuatan Tabel

-- Tabel pengguna (admin, seller, buyer)
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel kategori produk
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel produk
CREATE TABLE IF NOT EXISTS products (
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
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255),
    image_url VARCHAR(255) NOT NULL,
    link_url VARCHAR(255) DEFAULT '/products',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel item keranjang belanja
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (buyer_id, product_id)
);

-- Tabel pesanan (1 pesanan per toko)
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase INTEGER NOT NULL CHECK (price_at_purchase >= 0)
);

-- Tabel ulasan produk
CREATE TABLE IF NOT EXISTS reviews (
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
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_banners_active_order ON banners(is_active, display_order ASC);

-- 2. Data Awal

-- Akun admin, buyer, dan 5 seller resmi
-- Password: admin = admin123 | buyer = buyer123 | semua seller = seller123
INSERT INTO users (name, email, password_hash, role, seller_status) VALUES
    ('Admin CeroSpace', 'admin@cerospace.com', crypt('admin123', gen_salt('bf', 10)), 'admin', NULL),
    ('Budi Buyer', 'buyer@cerospace.com', crypt('buyer123', gen_salt('bf', 10)), 'buyer', NULL),
    ('Uniqlo Indonesia', 'uniqlo@cerospace.com', crypt('seller123', gen_salt('bf', 10)), 'seller', 'approved'),
    ('H&M Indonesia', 'hm@cerospace.com', crypt('seller123', gen_salt('bf', 10)), 'seller', 'approved'),
    ('Nike Indonesia', 'nike@cerospace.com', crypt('seller123', gen_salt('bf', 10)), 'seller', 'approved'),
    ('Crocs Indonesia', 'crocs@cerospace.com', crypt('seller123', gen_salt('bf', 10)), 'seller', 'approved'),
    ('New Era Indonesia', 'newera@cerospace.com', crypt('seller123', gen_salt('bf', 10)), 'seller', 'approved')
ON CONFLICT (email) DO NOTHING;

-- Profil 5 toko resmi beserta logo
INSERT INTO stores (user_id, name, description, image_url) VALUES
    ((SELECT id FROM users WHERE email = 'uniqlo@cerospace.com'), 'Uniqlo Official', 'Pakaian esensial harian LifeWear dengan material nyaman dan desain minimalis.', '/uploads/stores/uniqlo.jpg'),
    ((SELECT id FROM users WHERE email = 'hm@cerospace.com'), 'H&M Official', 'Koleksi fashion kasual dan streetwear modern untuk gaya sehari-hari.', '/uploads/stores/hm.jpg'),
    ((SELECT id FROM users WHERE email = 'nike@cerospace.com'), 'Nike Official', 'Sneakers, footwear, dan apparel olahraga resmi berstandar internasional.', '/uploads/stores/nike.jpg'),
    ((SELECT id FROM users WHERE email = 'crocs@cerospace.com'), 'Crocs Official', 'Alas kaki kasual ikonik yang ringan, empuk, dan nyaman untuk segala aktivitas.', '/uploads/stores/crocs.jpg'),
    ((SELECT id FROM users WHERE email = 'newera@cerospace.com'), 'New Era Official', 'Topi headwear resmi MLB, NBA, dan aksesoris streetwear otentik.', '/uploads/stores/newera.jpg')
ON CONFLICT (user_id) DO NOTHING;

-- 4 kategori utama
INSERT INTO categories (name, slug) VALUES
    ('Atasan', 'baju-jaket'),
    ('Bawahan', 'celana-rok'),
    ('Alas Kaki', 'sepatu-sendal'),
    ('Aksesoris', 'aksesoris')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 11 produk awal sesuai file di public/uploads/products
INSERT INTO products (store_id, category_id, name, description, price, stock, image_url) VALUES
    (
        (SELECT id FROM stores WHERE name = 'Uniqlo Official'),
        (SELECT id FROM categories WHERE slug = 'baju-jaket'),
        'Uniqlo AIRism Cotton Oversized T-Shirt',
        'Kaos lengan setengah potongan oversized dengan bahan AIRism yang sejuk dan lembut di kulit.',
        199000,
        25,
        '/uploads/products/uniqlo-airism-tee.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'Uniqlo Official'),
        (SELECT id FROM categories WHERE slug = 'baju-jaket'),
        'Uniqlo Utility Short Blouson Jacket',
        'Jaket hoodie resleting bergaya kasual dengan saku fungsional dan bahan nyaman dipakai harian.',
        699000,
        15,
        '/uploads/products/uniqlo-zip-hoodie.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'H&M Official'),
        (SELECT id FROM categories WHERE slug = 'celana-rok'),
        'H&M Relaxed Fit Cargo Trousers',
        'Celana kargo katun twill dengan banyak kantong samping dan potongan kaki rileks.',
        549000,
        20,
        '/uploads/products/hm-cargo-trousers.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'H&M Official'),
        (SELECT id FROM categories WHERE slug = 'celana-rok'),
        'H&M Pleated Midi Skirt',
        'Rok lipit midi bergaya elegan dengan bahan jatuh yang ringan dan mudah dipadukan.',
        449000,
        18,
        '/uploads/products/hm-pleated-skirt.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'Nike Official'),
        (SELECT id FROM categories WHERE slug = 'sepatu-sendal'),
        'Nike Dunk Low Retro Panda',
        'Sneakers klasik Nike Dunk Low kombinasi hitam dan putih dengan material kulit premium.',
        1549000,
        10,
        '/uploads/products/nike-dunk-low.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'Nike Official'),
        (SELECT id FROM categories WHERE slug = 'sepatu-sendal'),
        'Nike Air Force 1 ''07 White',
        'Sepatu ikonik Air Force 1 serba putih dengan bantalan Nike Air yang empuk sepanjang hari.',
        1549000,
        14,
        '/uploads/products/nike-af1-white.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'Crocs Official'),
        (SELECT id FROM categories WHERE slug = 'sepatu-sendal'),
        'Crocs Classic Clog',
        'Sandal clog ikonik berbahan Croslite yang sangat ringan, tahan air, dan mudah dibersihkan.',
        999000,
        30,
        '/uploads/products/crocs-classic-clog.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'Crocs Official'),
        (SELECT id FROM categories WHERE slug = 'sepatu-sendal'),
        'Crocs Echo Clog',
        'Sandal clog modern dengan desain tegas dan bantalan LiteRide ekstra empuk.',
        1199000,
        16,
        '/uploads/products/crocs-echo-clog.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'New Era Official'),
        (SELECT id FROM categories WHERE slug = 'aksesoris'),
        'New Era 9FORTY New York Yankees Black',
        'Topi baseball resmi MLB New York Yankees warna hitam dengan strap belakang yang dapat diatur.',
        599000,
        20,
        '/uploads/products/newera-9forty-ny.jpg'
    ),
    (
        (SELECT id FROM stores WHERE name = 'New Era Official'),
        (SELECT id FROM categories WHERE slug = 'aksesoris'),
        'New Era 59FIFTY Los Angeles Dodgers Cream Navy',
        'Topi fitted ikonik LA Dodgers perpaduan warna krem dan navy dengan bordir logo timbul.',
        799000,
        15,
        '/uploads/products/newera-59fifty-la.jpg'
    );

-- 2 banner homepage (rasio 8:3 sesuai file di public/uploads/banners)
INSERT INTO banners (title, subtitle, image_url, link_url, display_order, is_active, created_by) VALUES
    (
        'New Arrival',
        'Temukan koleksi terbaru dari brand resmi pilihan di CeroSpace.',
        '/uploads/banners/banner-new-arrival.jpg',
        '/products',
        1,
        TRUE,
        (SELECT id FROM users WHERE email = 'admin@cerospace.com')
    ),
    (
        'Order Online is Easy',
        'Belanja cepat, aman, dan praktis dengan dukungan COD maupun Transfer.',
        '/uploads/banners/banner-order-online.jpg',
        '/products',
        2,
        TRUE,
        (SELECT id FROM users WHERE email = 'admin@cerospace.com')
    );

    