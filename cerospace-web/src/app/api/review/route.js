import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "buyer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const orderId = Number(body.order_id);
    const productId = Number(body.product_id);
    const rating = Number(body.rating);
    const comment = body.comment?.trim() || "";

    if (!orderId || !productId || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating (1-5) dan data produk wajib diisi." },
        { status: 400 }
      );
    }

    const colsRes = await pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_name IN ('orders', 'reviews')`
    );

    const tableCols = { orders: [], reviews: [] };
    for (const r of colsRes.rows) {
      tableCols[r.table_name]?.push(r.column_name);
    }

    const orderBuyerCol = tableCols.orders.includes("buyer_id")
      ? "buyer_id"
      : "user_id";
    const buyerId = Number(session.user.id);

    const orderCheck = await pool.query(
      `SELECT id FROM orders
       WHERE id = $1 AND ${orderBuyerCol} = $2 AND status IN ('Selesai', 'delivered')`,
      [orderId, buyerId]
    );

    if (orderCheck.rows.length === 0) {
      return NextResponse.json(
        {
          message:
            "Ulasan hanya dapat diberikan setelah pesanan berstatus Selesai.",
        },
        { status: 400 }
      );
    }

    const reviewUserCol = tableCols.reviews.includes("buyer_id")
      ? "buyer_id"
      : tableCols.reviews.includes("user_id")
      ? "user_id"
      : null;
    const hasOrderIdCol = tableCols.reviews.includes("order_id");

    // Cegah ulasan ganda hanya untuk order_id & product_id yang sama
    if (hasOrderIdCol && reviewUserCol) {
      const dupCheck = await pool.query(
        `SELECT id FROM reviews
         WHERE order_id = $1 AND product_id = $2 AND ${reviewUserCol} = $3`,
        [orderId, productId, buyerId]
      );
      if (dupCheck.rows.length > 0) {
        return NextResponse.json(
          { message: "Produk pada pesanan ini sudah pernah Anda ulas." },
          { status: 400 }
        );
      }
    }

    const insertCols = ["product_id", "rating"];
    const insertVals = [productId, rating];

    if (hasOrderIdCol) {
      insertCols.push("order_id");
      insertVals.push(orderId);
    }
    if (reviewUserCol) {
      insertCols.push(reviewUserCol);
      insertVals.push(buyerId);
    }

    if (tableCols.reviews.includes("comment")) {
      insertCols.push("comment");
      insertVals.push(comment);
    } else if (tableCols.reviews.includes("review_text")) {
      insertCols.push("review_text");
      insertVals.push(comment);
    } else if (tableCols.reviews.includes("review")) {
      insertCols.push("review");
      insertVals.push(comment);
    }

    const placeholders = insertVals.map((_, idx) => `$${idx + 1}`).join(", ");

    await pool.query(
      `INSERT INTO reviews (${insertCols.join(", ")}) VALUES (${placeholders})`,
      insertVals
    );

    return NextResponse.json(
      { message: "Terima kasih! Ulasan Anda berhasil dipublikasikan." },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/review error:", error);
    return NextResponse.json(
      { message: `Gagal menyimpan ulasan: ${error.detail || error.message}` },
      { status: 500 }
    );
  }
}