import { redirect } from "next/navigation";
import { auth } from "@/auth";
import pool from "@/lib/db";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const colsRes = await pool.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_name IN ('users', 'stores')`
  );

  const tableCols = { users: [], stores: [] };
  for (const r of colsRes.rows) {
    tableCols[r.table_name]?.push(r.column_name);
  }

  const statusExpr =
    tableCols.stores.includes("status") && tableCols.users.includes("seller_status")
      ? "COALESCE(s.status, u.seller_status, 'pending')"
      : tableCols.stores.includes("status")
      ? "COALESCE(s.status, 'pending')"
      : "COALESCE(u.seller_status, 'pending')";

  const [sellersRes, bannersRes, buyersCountRes, ordersCountRes] =
    await Promise.all([
      pool.query(
        `SELECT u.id, u.name, u.email,
                ${statusExpr} AS seller_status,
                s.id AS store_id, s.name AS store_name, s.description AS store_description,
                COUNT(p.id)::int AS product_count
         FROM users u
         LEFT JOIN stores s ON s.user_id = u.id
         LEFT JOIN products p ON p.store_id = s.id
         WHERE u.role = 'seller'
         GROUP BY u.id, s.id
         ORDER BY
           CASE ${statusExpr}
             WHEN 'pending' THEN 1
             WHEN 'approved' THEN 2
             ELSE 3
           END,
           u.id DESC`
      ),
      pool.query("SELECT * FROM banners ORDER BY id DESC"),
      pool.query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'buyer'"),
      pool.query("SELECT COUNT(*)::int AS total FROM orders"),
    ]);

  return (
    <AdminDashboardClient
      initialSellers={sellersRes.rows}
      initialBanners={bannersRes.rows}
      stats={{
        totalBuyers: buyersCountRes.rows[0]?.total || 0,
        totalOrders: ordersCountRes.rows[0]?.total || 0,
      }}
    />
  );
}