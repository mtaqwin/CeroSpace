import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

async function getSellerStore(userId) {
  const res = await pool.query(
    "SELECT * FROM stores WHERE user_id = $1 LIMIT 1",
    [Number(userId)]
  );
  return res.rows[0] || null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const store = await getSellerStore(session.user.id);
    if (!store) {
      return NextResponse.json(
        { message: "Toko tidak ditemukan." },
        { status: 404 }
      );
    }

    const productsRes = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.store_id = $1
       ORDER BY p.id DESC`,
      [store.id]
    );

    return NextResponse.json({ products: productsRes.rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/seller/products error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar produk toko." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const store = await getSellerStore(session.user.id);
    if (!store) {
      return NextResponse.json(
        { message: "Toko tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const name = body.name?.trim();
    const categoryId = Number(body.category_id);
    const description = body.description?.trim() || "";
    const price = Number(body.price);
    const stock = Number(body.stock);
    const imageUrl = body.image_url?.trim();

    if (!name || !categoryId || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
      return NextResponse.json(
        { message: "Nama, kategori, harga (> 0), dan stok (>= 0) wajib diisi dengan benar." },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { message: "Foto produk wajib diunggah terlebih dahulu." },
        { status: 400 }
      );
    }

    const insertRes = await pool.query(
      `INSERT INTO products (store_id, category_id, name, description, price, stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [store.id, categoryId, name, description, price, stock, imageUrl]
    );

    const newProduct = insertRes.rows[0];
    const catRes = await pool.query(
      "SELECT name, slug FROM categories WHERE id = $1",
      [categoryId]
    );

    return NextResponse.json(
      {
        message: "Produk baru berhasil ditambahkan.",
        product: {
          ...newProduct,
          category_name: catRes.rows[0]?.name || "",
          category_slug: catRes.rows[0]?.slug || "",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/seller/products error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan produk baru." },
      { status: 500 }
    );
  }
}