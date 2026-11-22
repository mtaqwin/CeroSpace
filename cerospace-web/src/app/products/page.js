import pool from "@/lib/db";
import CatalogClient from "@/components/CatalogClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search?.trim() || "";
  const category = params?.category?.trim() || "all";
  const minPrice = params?.minPrice?.trim() || "";
  const maxPrice = params?.maxPrice?.trim() || "";
  const sort = params?.sort?.trim() || "newest";

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

  const [categoriesRes, productsRes] = await Promise.all([
    pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC"),
    pool.query(
      `SELECT p.id, p.name, p.price, p.stock, p.image_url,
              s.name AS store_name,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN stores s ON p.store_id = s.id
       JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ${orderBy}`,
      values
    ),
  ]);

  return (
    <CatalogClient
      categories={categoriesRes.rows}
      initialProducts={productsRes.rows}
      initialFilters={{ search, category, minPrice, maxPrice, sort }}
    />
  );
}