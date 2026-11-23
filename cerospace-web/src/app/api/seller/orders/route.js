import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

const ALLOWED_STATUSES = [
  "Menunggu Pembayaran",
  "Diproses",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];

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
      return NextResponse.json({ message: "Toko tidak ditemukan." }, { status: 404 });
    }

    const colsRes = await pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_name IN ('orders', 'order_items')`
    );

    const tableCols = { orders: [], order_items: [] };
    for (const r of colsRes.rows) {
      tableCols[r.table_name]?.push(r.column_name);
    }

    const orderBuyerCol = tableCols.orders.includes("buyer_id") ? "buyer_id" : "user_id";
    const orderTotalCol = tableCols.orders.includes("total_price")
      ? "total_price"
      : "total_amount";
    const itemPriceCol = tableCols.order_items.includes("price_at_purchase")
      ? "price_at_purchase"
      : "price";

    const ordersRes = await pool.query(
      `SELECT o.id, o.${orderTotalCol} AS total_amount,
              o.payment_method, o.status,
              u.name AS buyer_name, u.email AS buyer_email
       FROM orders o
       JOIN users u ON o.${orderBuyerCol} = u.id
       WHERE o.store_id = $1
       ORDER BY o.id DESC`,
      [store.id]
    );

    const orders = ordersRes.rows;
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const itemsRes = await pool.query(
        `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity,
                oi.${itemPriceCol} AS price,
                p.name AS product_name, p.image_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ANY($1::int[])
         ORDER BY oi.id ASC`,
        [orderIds]
      );

      for (const order of orders) {
        order.items = itemsRes.rows.filter((it) => it.order_id === order.id);
      }
    }

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/seller/orders error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar pesanan masuk." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const client = await pool.connect();
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const store = await getSellerStore(session.user.id);
    if (!store) {
      return NextResponse.json({ message: "Toko tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const orderId = Number(body.order_id);
    const nextStatus = body.status?.trim();

    if (!orderId || !ALLOWED_STATUSES.includes(nextStatus)) {
      return NextResponse.json(
        { message: "Data pesanan atau status tujuan tidak valid." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const orderRes = await client.query(
      "SELECT id, status FROM orders WHERE id = $1 AND store_id = $2 FOR UPDATE",
      [orderId, store.id]
    );

    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan di toko Anda." },
        { status: 404 }
      );
    }

    const currentStatus = orderRes.rows[0].status;
    if (currentStatus === "Selesai" || currentStatus === "Dibatalkan") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "Status pesanan yang sudah selesai atau dibatalkan tidak dapat diubah." },
        { status: 400 }
      );
    }

    if (nextStatus === "Dibatalkan") {
      const itemsRes = await client.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
        [orderId]
      );
      for (const item of itemsRes.rows) {
        await client.query(
          "UPDATE products SET stock = stock + $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query(
      "UPDATE orders SET status = $1 WHERE id = $2",
      [nextStatus, orderId]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      { message: "Status pesanan berhasil diperbarui.", status: nextStatus },
      { status: 200 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PATCH /api/seller/orders error:", error);
    return NextResponse.json(
      { message: `Gagal memperbarui status: ${error.detail || error.message}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}