import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const storeRes = await pool.query(
      "SELECT * FROM stores WHERE user_id = $1 LIMIT 1",
      [Number(session.user.id)]
    );

    if (storeRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Data toko tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ store: storeRes.rows[0] }, { status: 200 });
  } catch (error) {
    console.error("GET /api/seller/store error:", error);
    return NextResponse.json(
      { message: "Gagal memuat profil toko." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const name = body.name?.trim();
    const description = body.description?.trim() ?? "";

    if (!name) {
      return NextResponse.json(
        { message: "Nama toko wajib diisi." },
        { status: 400 }
      );
    }

    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'stores'`
    );
    const storeCols = colsRes.rows.map((r) => r.column_name);

    const setClauses = ["name = $1"];
    const values = [name];

    if (storeCols.includes("description")) {
      values.push(description);
      setClauses.push(`description = $${values.length}`);
    }

    if (storeCols.includes("updated_at")) {
      setClauses.push("updated_at = NOW()");
    }

    values.push(Number(session.user.id));

    const updateRes = await pool.query(
      `UPDATE stores
       SET ${setClauses.join(", ")}
       WHERE user_id = $${values.length}
       RETURNING *`,
      values
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Toko tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Profil toko berhasil diperbarui.",
        store: updateRes.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/seller/store error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui profil toko." },
      { status: 500 }
    );
  }
}