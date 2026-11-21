import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const minPrice = searchParams.get("minPrice")?.trim() || "";
    const maxPrice = searchParams.get("maxPrice")?.trim() || "";
    const sort = searchParams.get("sort")?.trim() || "newest";

    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`p.name ILIKE $${values.length}`);
    }

    if (category && category !== "all") {
      values.push(category);
      conditions.push(`c.slug = $${values.length}`);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      values.push(Number(minPrice));
      conditions.push(`p.price >= $${values.length}`);
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      values.push(Number(maxPrice));
      conditions.push(`p.price <= $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderBy = "ORDER BY p.id DESC";
    if (sort === "price_asc") {
      orderBy = "ORDER BY p.price ASC, p.id DESC";
    } else if (sort === "price_desc") {
      orderBy = "ORDER BY p.price DESC, p.id DESC";
    }

    const query = `
      SELECT p.id, p.name, p.price, p.stock, p.image_url,
             s.name AS store_name,
             s.image_url AS store_image,
             c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN stores s ON p.store_id = s.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ${orderBy}
    `;

    const result = await pool.query(query, values);

    return NextResponse.json({ products: result.rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar produk." },
      { status: 500 }
    );
  }
}