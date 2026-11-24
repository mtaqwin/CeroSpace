import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const res = await pool.query("SELECT * FROM banners ORDER BY id DESC");
    return NextResponse.json({ banners: res.rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/banners error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar banner." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const title = body.title?.trim() || "CeroSpace Collection";
    const subtitle = body.subtitle?.trim() || "";
    const imageUrl = body.image_url?.trim();
    const linkUrl = body.link_url?.trim() || "/products";
    const isActive = body.is_active !== false;

    if (!imageUrl) {
      return NextResponse.json(
        { message: "Gambar banner wajib diunggah terlebih dahulu." },
        { status: 400 }
      );
    }

    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'banners'`
    );
    const bannerCols = colsRes.rows.map((r) => r.column_name);

    const insertCols = ["title", "image_url"];
    const insertVals = [title, imageUrl];

    if (bannerCols.includes("subtitle")) {
      insertCols.push("subtitle");
      insertVals.push(subtitle);
    }
    if (bannerCols.includes("link_url")) {
      insertCols.push("link_url");
      insertVals.push(linkUrl);
    }
    if (bannerCols.includes("is_active")) {
      insertCols.push("is_active");
      insertVals.push(isActive);
    } else if (bannerCols.includes("active")) {
      insertCols.push("active");
      insertVals.push(isActive);
    }

    const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");

    const insertRes = await pool.query(
      `INSERT INTO banners (${insertCols.join(", ")})
       VALUES (${placeholders})
       RETURNING *`,
      insertVals
    );

    return NextResponse.json(
      {
        message: "Banner baru berhasil ditambahkan.",
        banner: insertRes.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/banners error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan banner." },
      { status: 500 }
    );
  }
}