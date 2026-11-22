"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { SlidersHorizontal, RotateCcw, Search, PackageOpen } from "lucide-react";

export default function CatalogClient({
  categories,
  initialProducts,
  initialFilters,
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(initialFilters.search || "");
  const [category, setCategory] = useState(initialFilters.category || "all");
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || "");
  const [sort, setSort] = useState(initialFilters.sort || "newest");

  useEffect(() => {
    setSearch(initialFilters.search || "");
    setCategory(initialFilters.category || "all");
    setMinPrice(initialFilters.minPrice || "");
    setMaxPrice(initialFilters.maxPrice || "");
    setSort(initialFilters.sort || "newest");
    setProducts(initialProducts);
  }, [initialFilters, initialProducts]);

  const fetchFilteredProducts = async (paramsObj) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (paramsObj.search) qs.set("search", paramsObj.search);
      if (paramsObj.category && paramsObj.category !== "all") {
        qs.set("category", paramsObj.category);
      }
      if (paramsObj.minPrice) qs.set("minPrice", paramsObj.minPrice);
      if (paramsObj.maxPrice) qs.set("maxPrice", paramsObj.maxPrice);
      if (paramsObj.sort && paramsObj.sort !== "newest") {
        qs.set("sort", paramsObj.sort);
      }

      const queryString = qs.toString();
      router.replace(queryString ? `/products?${queryString}` : "/products", {
        scroll: false,
      });

      const res = await fetch(`/api/products?${queryString}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (slug) => {
    setCategory(slug);
    fetchFilteredProducts({ search, category: slug, minPrice, maxPrice, sort });
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    fetchFilteredProducts({
      search,
      category,
      minPrice,
      maxPrice,
      sort: newSort,
    });
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchFilteredProducts({ search, category, minPrice, maxPrice, sort });
  };

  const handleReset = () => {
    setSearch("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    fetchFilteredProducts({
      search: "",
      category: "all",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Katalog */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172b] tracking-tight">
            Eksplorasi Semua Koleksi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Menampilkan {products.length} produk dari mitra brand resmi
          </p>
        </div>

        {/* Dropdown Pengurutan */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="sort" className="text-xs font-semibold text-slate-600">
            Urutkan:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-medium text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b] cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga: Terendah ke Tertinggi</option>
            <option value="price_desc">Harga: Tertinggi ke Terendah</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filter */}
        <aside className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 font-bold text-[#0f172b] text-sm">
              <SlidersHorizontal className="w-4 h-4 text-[#f9943b]" />
              <span>Filter Produk</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#f9943b] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Atur Ulang</span>
            </button>
          </div>

          {/* Filter Kategori */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 mb-3">
              Kategori
            </h3>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleCategoryChange("all")}
                className={`text-left px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                  category === "all"
                    ? "bg-[#0f172b] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`text-left px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                    category === cat.slug
                      ? "bg-[#0f172b] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Kata Kunci & Rentang Harga */}
          <form
            onSubmit={handleApplyFilter}
            className="space-y-5 pt-4 border-t border-slate-100"
          >
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-500 mb-2">
                Kata Kunci
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nama Produk..."
                  className="w-full pl-3.5 pr-9 py-2 rounded-xl border border-slate-300 text-sm text-[#0f172b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-500 mb-2">
                Rentang Harga (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-[#0f172b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                />
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Maks"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-[#0f172b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-semibold text-sm transition cursor-pointer"
            >
              Terapkan Filter
            </button>
          </form>
        </aside>

        {/* Grid Produk */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-96 rounded-2xl bg-slate-200/70 animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center">
              <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0f172b]">
                Produk Tidak Ditemukan
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                Coba ubah kata kunci, kategori, atau rentang harga yang Anda
                cari.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#0f172b] text-white text-sm font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Atur Ulang Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}