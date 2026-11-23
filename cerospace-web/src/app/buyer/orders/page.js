import { redirect } from "next/navigation";
import { auth } from "@/auth";
import pool from "@/lib/db";
import BuyerOrdersClient from "@/components/BuyerOrdersClient";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage({ searchParams }) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "buyer") {
    redirect("/");
  }

  const buyerId = Number(session.user.id);

  const colsRes = await pool.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_name IN ('orders', 'order_items', 'reviews')`
  );

  const tableCols = { orders: [], order_items: [], reviews: [] };
  for (const r of colsRes.rows) {
    tableCols[r.table_name]?.push(r.column_name);
  }

  const orderBuyerCol = tableCols.orders.includes("buyer_id")
    ? "buyer_id"
    : "user_id";
  const orderTotalCol = tableCols.orders.includes("total_amount")
    ? "total_amount"
    : "total_price";
  const itemPriceCol = tableCols.order_items.includes("price_at_purchase")
    ? "price_at_purchase"
    : "price";

  const ordersRes = await pool.query(
    `SELECT o.id, o.store_id, o.${orderTotalCol} AS total_amount,
            o.payment_method, o.status,
            s.name AS store_name
     FROM orders o
     JOIN stores s ON o.store_id = s.id
     WHERE o.${orderBuyerCol} = $1
     ORDER BY o.id DESC`,
    [buyerId]
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

    const reviewUserCol = tableCols.reviews.includes("buyer_id")
      ? "buyer_id"
      : tableCols.reviews.includes("user_id")
      ? "user_id"
      : null;
    const hasReviewOrderId = tableCols.reviews.includes("order_id");

    const reviewedByOrder = new Set();
    const reviewedByProductFallback = new Set();

    if (reviewUserCol) {
      if (hasReviewOrderId) {
        const revRes = await pool.query(
          `SELECT order_id, product_id FROM reviews WHERE ${reviewUserCol} = $1`,
          [buyerId]
        );
        for (const r of revRes.rows) {
          if (r.order_id !== null && r.order_id !== undefined) {
            reviewedByOrder.add(`${Number(r.order_id)}-${Number(r.product_id)}`);
          }
        }
      } else {
        const revRes = await pool.query(
          `SELECT product_id FROM reviews WHERE ${reviewUserCol} = $1`,
          [buyerId]
        );
        for (const r of revRes.rows) {
          reviewedByProductFallback.add(Number(r.product_id));
        }
      }
    }

    for (const order of orders) {
      order.items = itemsRes.rows
        .filter((it) => it.order_id === order.id)
        .map((it) => ({
          ...it,
          reviewed: hasReviewOrderId
            ? reviewedByOrder.has(`${order.id}-${Number(it.product_id)}`)
            : reviewedByProductFallback.has(Number(it.product_id)),
        }));
    }
  }

  return (
    <BuyerOrdersClient
      initialOrders={orders}
      showSuccessBanner={params?.checkout === "success"}
    />
  );
}