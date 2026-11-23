import { redirect } from "next/navigation";
import { auth } from "@/auth";
import pool from "@/lib/db";
import CartClient from "@/components/CartClient";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "buyer") {
    redirect("/");
  }

  const colsRes = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'cart_items'`
  );
  const cols = colsRes.rows.map((r) => r.column_name);
  const userCol = cols.includes("buyer_id") ? "buyer_id" : "user_id";

  const cartRes = await pool.query(
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
    [Number(session.user.id)]
  );

  return <CartClient initialItems={cartRes.rows} />;
}