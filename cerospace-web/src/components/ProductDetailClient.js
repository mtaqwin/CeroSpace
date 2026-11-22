"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Store,
  Star,
  ShoppingBag,
  Minus,
  Plus,
  Check,
  ShieldCheck,
} from "lucide-react";

export default function ProductDetailClient({
  product,
  reviews,
  averageRating,
  totalReviews,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [imgError, setImgError] = useState(false);
  const [storeImgError, setStoreImgError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(product.price);

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => (prev < product.stock ? prev + 1 : prev));
  };

  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "buyer") {
      alert("Fitur keranjang hanya tersedia untuk akun Buyer.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity }),
      });

      if (res.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } else {
        const data = await res.json();
        alert(data.message || "Gagal menambahkan ke keranjang.");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb / Back */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0f172b] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>

      {/* Layout 2 Kolom Utama */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Kolom Kiri: Foto Rasio 4:5 */}
          <div className="relative aspect-[4/5] w-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-[#0f172b] border border-slate-200">
            {product.image_url && !imgError ? (
              <img
                src={product.image_url}
                alt={product.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#16213e] to-[#0f172b] text-white">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#f9943b] mb-3">
                  {product.store_name}
                </span>
                <p className="text-lg font-bold text-slate-200 max-w-xs">
                  {product.name}
                </p>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Info Detail & Aksi */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Link
                  href={`/products?category=${product.category_slug}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0f172b] text-[#f9943b]"
                >
                  {product.category_name}
                </Link>

                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Star className="w-4 h-4 fill-[#f9943b] text-[#f9943b]" />
                  <span className="font-bold text-[#0f172b]">
                    {totalReviews > 0 ? averageRating : "Baru"}
                  </span>
                  <span className="text-slate-400">
                    ({totalReviews} ulasan)
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172b] tracking-tight leading-snug">
                {product.name}
              </h1>

              <p className="text-2xl sm:text-3xl font-extrabold text-[#f9943b] mt-4">
                {formattedPrice}
              </p>
            </div>

            {/* Info Toko Resmi */}
            <div className="p-4 rounded-2xl bg-[#f7f8fd] border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {product.store_image && !storeImgError ? (
                  <img
                    src={product.store_image}
                    alt={product.store_name}
                    onError={() => setStoreImgError(true)}
                    className="w-10 h-10 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Official Store</p>
                  <p className="text-sm font-bold text-[#0f172b]">
                    {product.store_name}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>

            {/* Deskripsi Produk */}
            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-sm font-bold text-[#0f172b] mb-2">
                Deskripsi Produk
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description ||
                  `Koleksi original dari ${product.store_name} dalam kategori ${product.category_name}. Nyaman digunakan sehari-hari dengan material berkualitas tinggi.`}
              </p>
            </div>

            {/* Stok & Kontrol Kuantitas */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0f172b]">
                  Kuantitas
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Stok tersedia:{" "}
                  <strong className="text-[#0f172b]">{product.stock}</strong>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="inline-flex items-center justify-between border border-slate-300 rounded-xl px-3 py-2 bg-white sm:w-36">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 1 || product.stock < 1}
                    className="p-1 text-slate-600 hover:text-[#0f172b] disabled:opacity-40 cursor-pointer"
                    aria-label="Kurangi jumlah"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-[#0f172b]">
                    {product.stock < 1 ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= product.stock || product.stock < 1}
                    className="p-1 text-slate-600 hover:text-[#0f172b] disabled:opacity-40 cursor-pointer"
                    aria-label="Tambah jumlah"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding || product.stock < 1}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {product.stock < 1 ? (
                    <span>Stok Habis</span>
                  ) : added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Berhasil Ditambahkan</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{adding ? "Menambahkan..." : "Add to Cart"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seksi Rating & Ulasan Pembeli */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0f172b]">
              Ulasan & Penilaian Pembeli
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Berdasarkan pengalaman transaksi terverifikasi di CeroSpace
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#0f172b] text-white px-5 py-3 rounded-2xl">
            <Star className="w-6 h-6 fill-[#f9943b] text-[#f9943b]" />
            <div>
              <div className="text-lg font-bold leading-none">
                {totalReviews > 0 ? `${averageRating} / 5.0` : "Belum ada"}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {totalReviews} ulasan
              </div>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Belum ada ulasan untuk produk ini. Jadilah yang pertama memberikan ulasan setelah menyelesaikan pesanan!
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-[#f7f8fd] border border-slate-200/70"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-[#0f172b]">
                    {rev.user_name}
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Number(rev.rating)
                            ? "fill-[#f9943b] text-[#f9943b]"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {rev.comment || rev.review || "Produk sesuai deskripsi."}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}