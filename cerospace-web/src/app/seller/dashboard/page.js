import { redirect } from "next/navigation";
import { auth } from "@/auth";
import pool from "@/lib/db";
import SellerDashboardClient from "@/components/SellerDashboardClient";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "seller") {
    redirect("/");
  }

  const userId = Number(session.user.id);

  const userRes = await pool.query(
    "SELECT name, seller_status FROM users WHERE id = $1 LIMIT 1",
    [userId]
  );

  if (userRes.rows[0]?.seller_status !== "approved") {
    redirect("/seller/pending");
  }

  let storeRes = await pool.query(
    "SELECT * FROM stores WHERE user_id = $1 LIMIT 1",
    [userId]
  );

  // Jika akun seller approved belum punya baris di tabel stores, buat otomatis
  if (storeRes.rows.length === 0) {
    storeRes = await pool.query(
      "INSERT INTO stores (user_id, name, description) VALUES ($1, $2, $3) RETURNING *",
      [userId, userRes.rows[0].name, `Official store ${userRes.rows[0].name} di CeroSpace.`]
    );
  }

  const store = storeRes.rows[0];

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

  const [productsRes, categoriesRes, ordersRes] = await Promise.all([
    pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.store_id = $1
       ORDER BY p.id DESC`,
      [store.id]
    ),
    pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC"),
    pool.query(
      `SELECT o.id, o.${orderTotalCol} AS total_amount,
              o.payment_method, o.status,
              u.name AS buyer_name, u.email AS buyer_email
       FROM orders o
       JOIN users u ON o.${orderBuyerCol} = u.id
       WHERE o.store_id = $1
       ORDER BY o.id DESC`,
      [store.id]
    ),
  ]);

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

  return (
    <SellerDashboardClient
      initialStore={store}
      initialProducts={productsRes.rows}
      initialOrders={orders}
      categories={categoriesRes.rows}
    />
  );
}