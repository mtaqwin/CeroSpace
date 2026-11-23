import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "buyer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const orderId = Number(body.order_id);

    if (!orderId) {
      return NextResponse.json(
        { message: "ID pesanan tidak valid." },
        { status: 400 }
      );
    }

    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'`
    );
    const orderCols = colsRes.rows.map((r) => r.column_name);
    const buyerCol = orderCols.includes("buyer_id") ? "buyer_id" : "user_id";

    const updateRes = await pool.query(
      `UPDATE orders
       SET status = 'Selesai'
       WHERE id = $1 AND ${buyerCol} = $2
       RETURNING id, status`,
      [orderId, Number(session.user.id)]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Pesanan dikonfirmasi telah diterima!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/buyer/orders error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui status pesanan." },
      { status: 500 }
    );
  }
}