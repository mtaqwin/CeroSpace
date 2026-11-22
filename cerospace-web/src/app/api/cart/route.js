import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

async function getCartUserColumn() {
  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'cart_items'`
  );
  const cols = res.rows.map((r) => r.column_name);
  return cols.includes("buyer_id") ? "buyer_id" : "user_id";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "buyer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const userCol = await getCartUserColumn();
    const userId = Number(session.user.id);

    const res = await pool.query(
      `SELECT ci.id, ci.product_id, ci.quantity,
              p.name, p.price, p.stock, p.image_url, p.store_id,
              s.name AS store_name,
              c.name AS category_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN stores s ON p.store_id = s.id
       JOIN categories c ON p.category_id = c.id
       WHERE ci.${userCol} = $1
       ORDER BY s.id ASC, ci.id DESC`,
      [userId]
    );

    return NextResponse.json({ items: res.rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json(
      { message: "Gagal memuat keranjang belanja." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "buyer") {
      return NextResponse.json(
        { message: "Silakan login sebagai Buyer untuk berbelanja." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const productId = Number(body.product_id);
    const quantity = Number(body.quantity || 1);

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { message: "Data produk atau jumlah tidak valid." },
        { status: 400 }
      );
    }

    const prodRes = await pool.query(
      "SELECT id, stock FROM products WHERE id = $1",
      [productId]
    );

    if (prodRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const product = prodRes.rows[0];
    if (product.stock < quantity) {
      return NextResponse.json(
        { message: `Stok tidak mencukupi. Tersisa ${product.stock} unit.` },
        { status: 400 }
      );
    }

    const userCol = await getCartUserColumn();
    const userId = Number(session.user.id);

    const existingRes = await pool.query(
      `SELECT id, quantity FROM cart_items WHERE ${userCol} = $1 AND product_id = $2`,
      [userId, productId]
    );

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      const newQty = existing.quantity + quantity;

      if (newQty > product.stock) {
        return NextResponse.json(
          {
            message: `Jumlah melebihi stok tersedia (${product.stock} unit).`,
          },
          { status: 400 }
        );
      }

      await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE id = $2",
        [newQty, existing.id]
      );
    } else {
      await pool.query(
        `INSERT INTO cart_items (${userCol}, product_id, quantity) VALUES ($1, $2, $3)`,
        [userId, productId, quantity]
      );
    }

    return NextResponse.json(
      { message: "Produk berhasil ditambahkan ke keranjang." },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan produk ke keranjang." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "buyer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const cartItemId = Number(body.id);
    const quantity = Number(body.quantity);

    if (!cartItemId || quantity < 1) {
      return NextResponse.json(
        { message: "Jumlah minimal adalah 1 unit." },
        { status: 400 }
      );
    }

    const userCol = await getCartUserColumn();
    const userId = Number(session.user.id);

    const checkRes = await pool.query(
      `SELECT ci.id, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1 AND ci.${userCol} = $2`,
      [cartItemId, userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Item keranjang tidak ditemukan." },
        { status: 404 }
      );
    }

    if (quantity > checkRes.rows[0].stock) {
      return NextResponse.json(
        { message: `Stok maksimal tersedia ${checkRes.rows[0].stock} unit.` },
        { status: 400 }
      );
    }

    await pool.query("UPDATE cart_items SET quantity = $1 WHERE id = $2", [
      quantity,
      cartItemId,
    ]);

    return NextResponse.json(
      { message: "Jumlah produk diperbarui." },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/cart error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui jumlah item." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "buyer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = Number(searchParams.get("id"));

    if (!cartItemId) {
      return NextResponse.json(
        { message: "ID item tidak valid." },
        { status: 400 }
      );
    }

    const userCol = await getCartUserColumn();
    const userId = Number(session.user.id);

    await pool.query(
      `DELETE FROM cart_items WHERE id = $1 AND ${userCol} = $2`,
      [cartItemId, userId]
    );

    return NextResponse.json(
      { message: "Item dihapus dari keranjang." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus item keranjang." },
      { status: 500 }
    );
  }
}