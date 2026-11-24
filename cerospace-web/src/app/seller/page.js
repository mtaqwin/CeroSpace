import { redirect } from "next/navigation";
import { auth } from "@/auth";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SellerIndexPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "seller") {
    redirect("/");
  }

  const userRes = await pool.query(
    "SELECT seller_status FROM users WHERE id = $1 LIMIT 1",
    [Number(session.user.id)]
  );

  if (userRes.rows[0]?.seller_status === "approved") {
    redirect("/seller/dashboard");
  }

  redirect("/seller/pending");
}