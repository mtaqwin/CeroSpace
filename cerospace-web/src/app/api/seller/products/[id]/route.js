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

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const productId = Number(id);
    if (!productId) {
      return NextResponse.json({ message: "ID produk tidak valid." }, { status: 400 });
    }

    const store = await getSellerStore(session.user.id);
    if (!store) {
      return NextResponse.json({ message: "Toko tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const name = body.name?.trim();
    const categoryId = Number(body.category_id);
    const description = body.description?.trim() || "";
    const price = Number(body.price);
    const stock = Number(body.stock);
    const imageUrl = body.image_url?.trim();

    if (!name || !categoryId || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0 || !imageUrl) {
      return NextResponse.json(
        { message: "Semua data produk dan foto wajib diisi dengan lengkap." },
        { status: 400 }
      );
    }

    const updateRes = await pool.query(
      `UPDATE products
       SET category_id = $1,
           name = $2,
           description = $3,
           price = $4,
           stock = $5,
           image_url = $6,
           updated_at = NOW()
       WHERE id = $7 AND store_id = $8
       RETURNING *`,
      [categoryId, name, description, price, stock, imageUrl, productId, store.id]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan atau bukan milik toko Anda." },
        { status: 404 }
      );
    }

    const catRes = await pool.query(
      "SELECT name, slug FROM categories WHERE id = $1",
      [categoryId]
    );

    return NextResponse.json(
      {
        message: "Produk berhasil diperbarui.",
        product: {
          ...updateRes.rows[0],
          category_name: catRes.rows[0]?.name || "",
          category_slug: catRes.rows[0]?.slug || "",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/seller/products/[id] error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui produk." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const productId = Number(id);
    if (!productId) {
      return NextResponse.json({ message: "ID produk tidak valid." }, { status: 400 });
    }

    const store = await getSellerStore(session.user.id);
    if (!store) {
      return NextResponse.json({ message: "Toko tidak ditemukan." }, { status: 404 });
    }

    const deleteRes = await pool.query(
      "DELETE FROM products WHERE id = $1 AND store_id = $2 RETURNING id",
      [productId, store.id]
    );

    if (deleteRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan atau bukan milik toko Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Produk berhasil dihapus." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/seller/products/[id] error:", error);
    if (error.code === "23503") {
      return NextResponse.json(
        { message: "Produk tidak dapat dihapus karena sudah tercatat dalam riwayat pesanan pembeli." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}