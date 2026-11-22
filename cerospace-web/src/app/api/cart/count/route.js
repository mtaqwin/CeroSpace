import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "buyer") {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'cart_items'`
    );
    const cols = colsRes.rows.map((r) => r.column_name);
    const userCol = cols.includes("buyer_id") ? "buyer_id" : "user_id";

    const countRes = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0)::int AS total
       FROM cart_items
       WHERE ${userCol} = $1`,
      [Number(session.user.id)]
    );

    return NextResponse.json(
      { count: countRes.rows[0]?.total || 0 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}