import Link from "next/link";
import pool from "@/lib/db";
import { auth } from "@/auth";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import ProductCard from "@/components/ProductCard";
import { ArrowRight, Truck, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const isBuyer = session?.user?.role === "buyer";

  const [bannersRes, categoriesRes, productsRes] = await Promise.all([
    pool.query(
      "SELECT id, title, subtitle, image_url, link_url FROM banners WHERE is_active = TRUE ORDER BY display_order ASC, id ASC"
    ),
    pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC"),
    pool.query(
      `SELECT p.id, p.name, p.price, p.stock, p.image_url,
              s.name AS store_name, s.image_url AS store_image, c.name AS category_name
       FROM products p
       JOIN stores s ON p.store_id = s.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.stock > 0
       ORDER BY ${isBuyer ? "RANDOM()" : "p.id DESC"}
       LIMIT 8`
    ),
  ]);

  const banners = bannersRes.rows;
  const categories = categoriesRes.rows;
  const products = productsRes.rows;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">
      <HeroBannerSlider banners={banners} />

      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0f172b] tracking-tight">
              Jelajahi Kategori
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pilih gaya sesuai kebutuhan harianmu
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-[#0f172b] hover:text-[#f9943b] inline-flex items-center gap-1 transition"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            href="/products"
            className="group p-5 rounded-2xl bg-[#0f172b] text-white border border-[#0f172b] hover:bg-[#1e293b] transition flex flex-col justify-end min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-base">Semua Produk</span>
              <ArrowRight className="w-4 h-4 text-[#f9943b] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group p-5 rounded-2xl bg-white hover:bg-[#0f172b] text-[#0f172b] hover:text-white border border-slate-200/90 hover:border-[#0f172b] shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[110px]"
            >
              <span className="text-xs font-medium text-slate-400 group-hover:text-[#f9943b] transition">
                Kategori
              </span>
              <div className="flex items-center justify-between mt-4">
                <span className="font-bold text-base">{cat.name}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#f9943b] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0f172b] tracking-tight">
              {isBuyer
                ? "Produk Pilihan Hari Ini"
                : "Koleksi Terbaru Brand Resmi"}
            </h2>
          </div>

          <Link
            href="/products"
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f172b] text-sm font-semibold text-[#0f172b] transition"
          >
            Buka Katalog
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            Belum ada produk tersedia.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#0f172b] text-[#f9943b] shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#0f172b] text-base">
              Mendukung Bayar di Tempat (COD)
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Nikmati kemudahan transaksi COD untuk total belanja minimal Rp
              300.000, atau gunakan metode Transfer untuk nominal berapa saja.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#0f172b] text-[#f9943b] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#0f172b] text-base">
              Brand Resmi & Multi-Toko Otomatis
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Belanja dari berbagai mitra brand resmi dalam satu
              keranjang—sistem otomatis memisahkan pesanan tiap toko.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}