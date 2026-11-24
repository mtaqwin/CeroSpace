import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const bannerId = Number(id);
    if (!bannerId) {
      return NextResponse.json({ message: "ID banner tidak valid." }, { status: 400 });
    }

    const body = await request.json();

    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'banners'`
    );
    const bannerCols = colsRes.rows.map((r) => r.column_name);

    const setClauses = [];
    const values = [];

    if (body.title !== undefined) {
      values.push(body.title.trim() || "CeroSpace Collection");
      setClauses.push(`title = $${values.length}`);
    }
    if (body.subtitle !== undefined && bannerCols.includes("subtitle")) {
      values.push(body.subtitle.trim());
      setClauses.push(`subtitle = $${values.length}`);
    }
    if (body.image_url !== undefined) {
      values.push(body.image_url.trim());
      setClauses.push(`image_url = $${values.length}`);
    }
    if (body.link_url !== undefined && bannerCols.includes("link_url")) {
      values.push(body.link_url.trim() || "/products");
      setClauses.push(`link_url = $${values.length}`);
    }
    if (body.is_active !== undefined) {
      if (bannerCols.includes("is_active")) {
        values.push(Boolean(body.is_active));
        setClauses.push(`is_active = $${values.length}`);
      } else if (bannerCols.includes("active")) {
        values.push(Boolean(body.is_active));
        setClauses.push(`active = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ message: "Tidak ada data yang diubah." }, { status: 400 });
    }

    values.push(bannerId);

    const updateRes = await pool.query(
      `UPDATE banners
       SET ${setClauses.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ message: "Banner tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Banner berhasil diperbarui.",
        banner: updateRes.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/admin/banners/[id] error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui banner." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const bannerId = Number(id);
    if (!bannerId) {
      return NextResponse.json({ message: "ID banner tidak valid." }, { status: 400 });
    }

    await pool.query("DELETE FROM banners WHERE id = $1", [bannerId]);

    return NextResponse.json(
      { message: "Banner berhasil dihapus." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/admin/banners/[id] error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus banner." },
      { status: 500 }
    );
  }
}