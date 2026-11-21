import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { message: "ID produk tidak valid." },
        { status: 400 }
      );
    }

    const productRes = await pool.query(
      `SELECT p.*,
              s.name AS store_name,
              s.image_url AS store_image,
              c.name AS category_name,
              c.slug AS category_slug
       FROM products p
       JOIN stores s ON p.store_id = s.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [Number(id)]
    );

    if (productRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'reviews'`
    );
    const reviewCols = colsRes.rows.map((row) => row.column_name);

    let reviewsQuery = `
      SELECT r.*, 'Pembeli CeroSpace' AS user_name
      FROM reviews r
      WHERE r.product_id = $1
      ORDER BY r.id DESC
    `;

    if (reviewCols.includes("buyer_id")) {
      reviewsQuery = `
        SELECT r.*, u.name AS user_name
        FROM reviews r
        JOIN users u ON r.buyer_id = u.id
        WHERE r.product_id = $1
        ORDER BY r.id DESC
      `;
    } else if (reviewCols.includes("user_id")) {
      reviewsQuery = `
        SELECT r.*, u.name AS user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = $1
        ORDER BY r.id DESC
      `;
    } else if (reviewCols.includes("order_id")) {
      reviewsQuery = `
        SELECT r.*, u.name AS user_name
        FROM reviews r
        JOIN orders o ON r.order_id = o.id
        JOIN users u ON o.buyer_id = u.id
        WHERE r.product_id = $1
        ORDER BY r.id DESC
      `;
    }

    const reviewsRes = await pool.query(reviewsQuery, [Number(id)]);

    const reviews = reviewsRes.rows;
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    return NextResponse.json(
      {
        product: productRes.rows[0],
        reviews,
        averageRating,
        totalReviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { message: "Gagal memuat detail produk." },
      { status: 500 }
    );
  }
}