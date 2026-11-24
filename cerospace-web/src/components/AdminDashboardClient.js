"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Store,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  AlertCircle,
  Users,
  ShoppingBag,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

const SELLER_STATUS_META = {
  pending: {
    label: "Menunggu Verifikasi",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "Disetujui (Aktif)",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "Ditolak",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

const LINK_PRESETS = [
  { label: "Semua Katalog (/products)", value: "/products" },
  { label: "Kategori Atasan", value: "/products?category=baju-jaket" },
  { label: "Kategori Bawahan", value: "/products?category=celana-rok" },
  { label: "Kategori Alas Kaki", value: "/products?category=sepatu-sendal" },
  { label: "Kategori Aksesoris", value: "/products?category=aksesoris" },
];

export default function AdminDashboardClient({
  initialSellers,
  initialBanners,
  stats,
}) {
  const [activeTab, setActiveTab] = useState("sellers");
  const [sellers, setSellers] = useState(initialSellers);
  const [sellerFilter, setSellerFilter] = useState("all");
  const [updatingSellerId, setUpdatingSellerId] = useState(null);

  const [banners, setBanners] = useState(initialBanners);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "/products",
    is_active: true,
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");

  const pendingSellersCount = sellers.filter(
    (s) => s.seller_status === "pending"
  ).length;

  const filteredSellers = sellers.filter((s) =>
    sellerFilter === "all" ? true : s.seller_status === sellerFilter
  );

  const getBannerActiveState = (banner) => {
    if (typeof banner.is_active === "boolean") return banner.is_active;
    if (typeof banner.active === "boolean") return banner.active;
    return true;
  };

  const handleSellerDecision = async (userId, nextStatus) => {
    setUpdatingSellerId(userId);
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Gagal memperbarui status seller.");
        return;
      }

      setSellers((prev) =>
        prev.map((s) =>
          s.id === userId ? { ...s, seller_status: nextStatus } : s
        )
      );
    } finally {
      setUpdatingSellerId(null);
    }
  };

  const openAddBannerModal = () => {
    setEditingBanner(null);
    setBannerForm({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "/products",
      is_active: true,
    });
    setBannerError("");
    setIsBannerModalOpen(true);
  };

  const openEditBannerModal = (banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
      link_url: banner.link_url || "/products",
      is_active: getBannerActiveState(banner),
    });
    setBannerError("");
    setIsBannerModalOpen(true);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setBannerError("");
    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("folder", "banners");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) {
        setBannerError(data.message || "Gagal mengunggah gambar banner.");
        return;
      }

      setBannerForm((prev) => ({ ...prev, image_url: data.url }));
    } catch {
      setBannerError("Terjadi kesalahan koneksi saat mengunggah banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setBannerError("");

    if (!bannerForm.image_url) {
      setBannerError(
        "Silakan pilih dan unggah file desain banner terlebih dahulu."
      );
      return;
    }

    setSavingBanner(true);
    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : "/api/admin/banners";
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setBannerError(data.message || "Gagal menyimpan banner.");
        return;
      }

      if (editingBanner) {
        setBanners((prev) =>
          prev.map((b) => (b.id === editingBanner.id ? data.banner : b))
        );
      } else {
        setBanners((prev) => [data.banner, ...prev]);
      }

      setIsBannerModalOpen(false);
    } catch {
      setBannerError("Terjadi kesalahan jaringan saat menyimpan banner.");
    } finally {
      setSavingBanner(false);
    }
  };

  const handleToggleBannerActive = async (banner) => {
    const nextState = !getBannerActiveState(banner);
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextState }),
      });
      const data = await res.json();
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? data.banner : b))
        );
      }
    } catch {
      alert("Gagal mengubah status banner.");
    }
  };

  const handleDeleteBanner = async (banner) => {
    const ok = window.confirm(`Hapus banner "${banner.title}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      }
    } catch {
      alert("Gagal menghapus banner.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Admin */}
      <div className="bg-[#0f172b] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#f9943b]/15 border border-[#f9943b]/30 text-[#f9943b] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#f9943b]">
              Platform Control Center
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
              Admin Dashboard CeroSpace
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Kelola verifikasi mitra toko resmi dan banner promosi halaman utama.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveTab("banners");
            openAddBannerModal();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Banner Baru</span>
        </button>
      </div>

      {/* Ringkasan Statistik Platform */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Seller Pending</p>
            <p className="text-2xl font-extrabold text-[#0f172b]">
              {pendingSellersCount}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Mitra Seller</p>
            <p className="text-2xl font-extrabold text-[#0f172b]">
              {sellers.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Buyer</p>
            <p className="text-2xl font-extrabold text-[#0f172b]">
              {stats.totalBuyers}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Transaksi</p>
            <p className="text-2xl font-extrabold text-[#0f172b]">
              {stats.totalOrders}
            </p>
          </div>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("sellers")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "sellers"
              ? "border-[#f9943b] text-[#0f172b]"
              : "border-transparent text-slate-500 hover:text-[#0f172b]"
          }`}
        >
          <span>Verifikasi Seller ({sellers.length})</span>
          {pendingSellersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f9943b] text-[#0f172b]">
              {pendingSellersCount} baru
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("banners")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === "banners"
              ? "border-[#f9943b] text-[#0f172b]"
              : "border-transparent text-slate-500 hover:text-[#0f172b]"
          }`}
        >
          Manajemen Banner ({banners.length})
        </button>
      </div>

      {/* TAB 1: VERIFIKASI SELLER */}
      {activeTab === "sellers" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "Semua" },
              { id: "pending", label: "Menunggu Verifikasi" },
              { id: "approved", label: "Disetujui" },
              { id: "rejected", label: "Ditolak" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSellerFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  sellerFilter === f.id
                    ? "bg-[#0f172b] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {filteredSellers.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Tidak ada data akun Seller pada kategori filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f7f8fd] border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-6">Toko & Pemilik</th>
                      <th className="py-4 px-4">Deskripsi Toko</th>
                      <th className="py-4 px-4">Produk</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-6 text-right">Keputusan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredSellers.map((seller) => {
                      const meta =
                        SELLER_STATUS_META[seller.seller_status] ||
                        SELLER_STATUS_META.pending;
                      const isApproved = seller.seller_status === "approved";
                      const isRejected = seller.seller_status === "rejected";

                      return (
                        <tr key={seller.id} className="hover:bg-slate-50/80">
                          <td className="py-4 px-6">
                            <p className="font-bold text-[#0f172b]">
                              {seller.store_name || "(Belum ada nama toko)"}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {seller.name} • {seller.email}
                            </p>
                          </td>

                          <td className="py-4 px-4 text-xs text-slate-600 max-w-xs">
                            <p className="line-clamp-2">
                              {seller.store_description || "-"}
                            </p>
                          </td>

                          <td className="py-4 px-4 font-semibold text-[#0f172b]">
                            {seller.product_count} item
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.badge}`}
                            >
                              {meta.label}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={
                                  updatingSellerId === seller.id || isApproved
                                }
                                onClick={() =>
                                  handleSellerDecision(seller.id, "approved")
                                }
                                className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-xl font-bold text-xs transition ${
                                  isApproved
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200 opacity-60 cursor-not-allowed"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>

                              <button
                                type="button"
                                disabled={
                                  updatingSellerId === seller.id || isRejected
                                }
                                onClick={() =>
                                  handleSellerDecision(seller.id, "rejected")
                                }
                                className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-xl font-bold text-xs transition ${
                                  isRejected
                                    ? "bg-rose-100 text-rose-700 border border-rose-200 opacity-60 cursor-not-allowed"
                                    : "border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer disabled:opacity-50"
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN BANNER KUSTOM */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-[#0f172b]">
                Hero Banner Halaman Utama
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah gambar banner hasil desain sendiri (rekomendasi ukuran{" "}
                <strong>1200 × 450 px</strong> atau{" "}
                <strong>1440 × 540 px</strong> / rasio <strong>8:3</strong>).
              </p>
            </div>
            <button
              type="button"
              onClick={openAddBannerModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f172b] hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#f9943b]" />
              <span>Tambah Banner</span>
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center shadow-sm">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0f172b]">
                Belum Ada Banner Terpasang
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                Unggah desain banner pertama Anda untuk ditampilkan di slider
                Halaman Utama.
              </p>
              <button
                type="button"
                onClick={openAddBannerModal}
                className="px-5 py-2.5 rounded-xl bg-[#f9943b] text-[#0f172b] font-bold text-sm cursor-pointer"
              >
                Upload Banner Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map((banner) => {
                const isActive = getBannerActiveState(banner);
                return (
                  <div
                    key={banner.id}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="relative aspect-[8/3] bg-[#0f172b] overflow-hidden">
                      {banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          Gambar belum diunggah
                        </div>
                      )}

                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-xs ${
                          isActive
                            ? "bg-emerald-500/90 text-white border-emerald-400"
                            : "bg-slate-800/85 text-slate-200 border-slate-600"
                        }`}
                      >
                        {isActive ? "Aktif Tampil" : "Nonaktif"}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-base text-[#0f172b]">
                          {banner.title}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {banner.subtitle}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-[#f9943b] font-semibold mt-2">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Link: {banner.link_url || "/products"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleToggleBannerActive(banner)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          {isActive ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Sembunyikan</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tampilkan</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditBannerModal(banner)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-[#0f172b] hover:text-white transition cursor-pointer"
                            title="Edit Banner"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(banner)}
                            className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                            title="Hapus Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT BANNER */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#0f172b]">
                  {editingBanner ? "Edit Banner" : "Upload Banner Baru"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekomendasi kanvas desain: 1200 × 450 px atau 1440 × 540 px
                  (rasio 8:3)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-[#0f172b] hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bannerError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bannerError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBanner} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Gambar Desain Banner
                </label>
                <div className="aspect-[8/3] w-full rounded-2xl bg-[#0f172b] border border-slate-200 overflow-hidden flex items-center justify-center mb-3">
                  {bannerForm.image_url ? (
                    <img
                      src={bannerForm.image_url}
                      alt="Preview Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400">
                      <Upload className="w-6 h-6 mx-auto mb-1 text-[#f9943b]" />
                      <p className="text-xs">
                        Pilih file desain banner (JPG, PNG, WEBP)
                      </p>
                    </div>
                  )}
                </div>

                <label className="w-full py-2.5 px-4 rounded-xl bg-[#0f172b] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-[#f9943b]" />
                  <span>
                    {uploadingBanner
                      ? "Mengunggah desain banner..."
                      : "Choose File Desain Banner"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Judul Banner (Internal / Alt Text)
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) =>
                      setBannerForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Streetwear Collection 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Link Tujuan Saat Diklik
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.link_url}
                    onChange={(e) =>
                      setBannerForm((prev) => ({
                        ...prev,
                        link_url: e.target.value,
                      }))
                    }
                    placeholder="/products"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">
                  Pintasan Link Tujuan:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {LINK_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() =>
                        setBannerForm((prev) => ({
                          ...prev,
                          link_url: preset.value,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                        bannerForm.link_url === preset.value
                          ? "bg-[#0f172b] text-white border-[#0f172b]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm font-medium text-[#0f172b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerForm.is_active}
                  onChange={(e) =>
                    setBannerForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-[#0f172b]"
                />
                <span>Langsung tampilkan banner ini di Halaman Utama</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBanner || uploadingBanner}
                  className="px-6 py-2.5 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {savingBanner
                    ? "Menyimpan..."
                    : editingBanner
                    ? "Simpan Perubahan"
                    : "Publikasikan Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}