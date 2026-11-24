import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
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

    const res = await pool.query(
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
    );

    return NextResponse.json({ sellers: res.rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/sellers error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar seller." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const client = await pool.connect();
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const userId = Number(body.user_id);
    const status = body.status?.trim();

    if (!userId || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { message: "Parameter user_id atau status tidak valid." },
        { status: 400 }
      );
    }

    const colsRes = await client.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_name IN ('users', 'stores')`
    );

    const tableCols = { users: [], stores: [] };
    for (const r of colsRes.rows) {
      tableCols[r.table_name]?.push(r.column_name);
    }

    await client.query("BEGIN");

    const userCheck = await client.query(
      "SELECT id, name FROM users WHERE id = $1 AND role = 'seller'",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "Akun Seller tidak ditemukan." },
        { status: 404 }
      );
    }

    if (tableCols.users.includes("seller_status")) {
      await client.query(
        "UPDATE users SET seller_status = $1 WHERE id = $2",
        [status, userId]
      );
    }

    if (tableCols.stores.includes("status")) {
      const storeCheck = await client.query(
        "SELECT id FROM stores WHERE user_id = $1",
        [userId]
      );

      if (storeCheck.rows.length > 0) {
        await client.query(
          "UPDATE stores SET status = $1 WHERE user_id = $2",
          [status, userId]
        );
      } else {
        await client.query(
          "INSERT INTO stores (user_id, name, status) VALUES ($1, $2, $3)",
          [userId, userCheck.rows[0].name, status]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        message: `Status seller berhasil diubah menjadi ${status}.`,
        seller: { ...userCheck.rows[0], seller_status: status },
      },
      { status: 200 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PATCH /api/admin/sellers error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui status seller." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}