"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Package,
  Plus,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Boxes,
  ExternalLink,
  ClipboardList,
  User,
  CreditCard,
  Truck,
  RefreshCw,
} from "lucide-react";

const ORDER_STATUS_META = {
  "Menunggu Pembayaran": {
    label: "Menunggu Pembayaran",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  Diproses: {
    label: "Diproses",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  Dikirim: {
    label: "Dikirim",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  Selesai: {
    label: "Selesai",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  Dibatalkan: {
    label: "Dibatalkan",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

export default function SellerDashboardClient({
  initialStore,
  initialProducts,
  initialOrders = [],
  categories,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("products");
  const [store, setStore] = useState(initialStore);
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  const [storeName, setStoreName] = useState(initialStore.name || "");
  const [storeDesc, setStoreDesc] = useState(initialStore.description || "");
  const [savingStore, setSavingStore] = useState(false);
  const [storeFeedback, setStoreFeedback] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category_id: categories[0]?.id || "",
    price: "",
    stock: "",
    description: "",
    image_url: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Sinkronkan pesanan saat data server diperbarui
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Auto-refresh pesanan tiap 8 detik saat membuka tab Pesanan Masuk
  useEffect(() => {
    if (activeTab !== "orders" || isModalOpen) return;
    const timer = setInterval(() => {
      router.refresh();
    }, 8000);
    return () => clearInterval(timer);
  }, [activeTab, isModalOpen, router]);

  const handleManualRefreshOrders = () => {
    setRefreshingOrders(true);
    router.refresh();
    setTimeout(() => setRefreshingOrders(false), 600);
  };

  const totalProducts = products.length;
  const totalStock = products.reduce(
    (acc, item) => acc + Number(item.stock || 0),
    0
  );
  const activeOrdersCount = orders.filter((o) =>
    ["Menunggu Pembayaran", "Diproses", "Dikirim"].includes(o.status)
  ).length;

  const formatRupiah = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category_id: categories[0]?.id || "",
      price: "",
      stock: "10",
      description: "",
      image_url: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || "",
      image_url: product.image_url || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError("");
    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("folder", "products");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal mengunggah foto.");
        return;
      }

      setFormData((prev) => ({ ...prev, image_url: data.url }));
    } catch {
      setFormError("Terjadi kesalahan koneksi saat mengunggah gambar.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.image_url) {
      setFormError("Silakan pilih dan unggah foto produk terlebih dahulu.");
      return;
    }

    setSavingProduct(true);
    try {
      const url = editingProduct
        ? `/api/seller/products/${editingProduct.id}`
        : "/api/seller/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category_id: Number(formData.category_id),
          price: Number(formData.price),
          stock: Number(formData.stock),
          description: formData.description,
          image_url: formData.image_url,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal menyimpan produk.");
        return;
      }

      if (editingProduct) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProduct.id ? data.product : item
          )
        );
      } else {
        setProducts((prev) => [data.product, ...prev]);
      }

      setIsModalOpen(false);
    } catch {
      setFormError("Terjadi kesalahan jaringan saat menyimpan produk.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus produk "${product.name}"?`
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/seller/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal menghapus produk.");
        return;
      }

      setProducts((prev) => prev.filter((item) => item.id !== product.id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Gagal memperbarui status pesanan.");
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      router.refresh();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setSavingStore(true);
    setStoreFeedback(null);

    try {
      const res = await fetch("/api/seller/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storeName,
          description: storeDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStoreFeedback({
          type: "error",
          text: data.message || "Gagal memperbarui profil toko.",
        });
        return;
      }

      setStore(data.store);
      setStoreFeedback({
        type: "success",
        text: "Profil toko berhasil diperbarui!",
      });
    } catch {
      setStoreFeedback({
        type: "error",
        text: "Terjadi kesalahan jaringan.",
      });
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-[#0f172b] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#f9943b]/15 border border-[#f9943b]/30 text-[#f9943b] flex items-center justify-center shrink-0">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {store.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Seller Terverifikasi
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {store.description ||
                "Kelola katalog produk, stok barang, dan pesanan masuk toko Anda di CeroSpace."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Produk</p>
            <p className="text-2xl font-extrabold text-[#0f172b]">
              {totalProducts}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Stok Unit</p>
            <p className="text-2xl font-extrabold text-[#0f172b]">{totalStock}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pesanan Aktif</p>
            <p className="text-2xl font-extrabold text-[#0f172b]">
              {activeOrdersCount}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === "products"
                ? "border-[#f9943b] text-[#0f172b]"
                : "border-transparent text-slate-500 hover:text-[#0f172b]"
            }`}
          >
            Kelola Produk ({totalProducts})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer inline-flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-[#f9943b] text-[#0f172b]"
                : "border-transparent text-slate-500 hover:text-[#0f172b]"
            }`}
          >
            <span>Pesanan Masuk ({orders.length})</span>
            {activeOrdersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f9943b] text-[#0f172b]">
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("store")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === "store"
                ? "border-[#f9943b] text-[#0f172b]"
                : "border-transparent text-slate-500 hover:text-[#0f172b]"
            }`}
          >
            Profil Toko
          </button>
        </div>

        {activeTab === "orders" && (
          <button
            type="button"
            onClick={handleManualRefreshOrders}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-2 rounded-xl bg-white border border-slate-200 hover:border-[#0f172b] text-xs font-semibold text-[#0f172b] transition cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#f9943b] ${
                refreshingOrders ? "animate-spin" : ""
              }`}
            />
            <span>Perbarui Status</span>
          </button>
        )}
      </div>

      {activeTab === "products" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <div className="p-14 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0f172b]">
                Belum ada produk di toko Anda
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                Mulai tambahkan produk pertama lengkap dengan foto katalog rasio
                4:5.
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f172b] text-white text-sm font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f7f8fd] border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Produk</th>
                    <th className="py-4 px-4">Kategori</th>
                    <th className="py-4 px-4">Harga</th>
                    <th className="py-4 px-4">Stok</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-15 rounded-xl bg-[#0f172b] overflow-hidden border border-slate-200 shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                                No Img
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/products/${product.id}`}
                              className="font-bold text-[#0f172b] hover:text-[#f9943b] inline-flex items-center gap-1 transition"
                            >
                              <span>{product.name}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </Link>
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                              {product.description || "Tanpa deskripsi tambahan"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          {product.category_name}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-[#0f172b]">
                        {formatRupiah(product.price)}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            Number(product.stock) <= 5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {product.stock} unit
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-[#0f172b] hover:text-white transition cursor-pointer"
                            title="Edit Produk"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingId === product.id}
                            className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition disabled:opacity-50 cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-5">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-14 text-center shadow-sm">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0f172b]">
                Belum Ada Pesanan Masuk
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Pesanan baru dari pembeli akan otomatis muncul di halaman ini.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const meta = ORDER_STATUS_META[order.status] || {
                label: order.status,
                badge: "bg-slate-100 text-slate-700 border-slate-200",
              };

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm"
                >
                  <div className="px-6 py-4 bg-[#0f172b] text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold text-[#f9943b]">
                        ORDER #{order.id}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-200">
                        <User className="w-4 h-4 text-[#f9943b]" />
                        <span className="font-semibold">{order.buyer_name}</span>
                        <span className="text-slate-400">
                          ({order.buyer_email})
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {(order.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="p-5 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-16 rounded-xl bg-[#0f172b] overflow-hidden border border-slate-200 shrink-0">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#0f172b]">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.quantity} unit × {formatRupiah(item.price)}
                            </p>
                          </div>
                        </div>

                        <p className="font-bold text-sm text-[#0f172b]">
                          {formatRupiah(
                            Number(item.quantity) * Number(item.price)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="px-6 py-4 bg-[#f7f8fd] border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <CreditCard className="w-3.5 h-3.5 text-[#0f172b]" />
                      <span>
                        Pembayaran:{" "}
                        <strong className="text-[#0f172b] uppercase">
                          {order.payment_method}
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                      <div className="mr-2">
                        <p className="text-[11px] text-slate-500">Total Toko</p>
                        <p className="text-base font-extrabold text-[#0f172b]">
                          {formatRupiah(order.total_amount)}
                        </p>
                      </div>

                      {order.status === "Menunggu Pembayaran" && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, "Diproses")
                          }
                          className="px-4 py-2 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                        >
                          Proses Pesanan
                        </button>
                      )}

                      {order.status === "Diproses" && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, "Dikirim")
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f172b] hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                        >
                          <Truck className="w-3.5 h-3.5 text-[#f9943b]" />
                          <span>Kirim Pesanan</span>
                        </button>
                      )}

                      {order.status === "Dikirim" && (
                        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                          Menunggu konfirmasi diterima pembeli
                        </span>
                      )}

                      {order.status === "Selesai" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pesanan telah diterima pembeli</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "store" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold text-[#0f172b] mb-1">
            Informasi Profil Toko
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Nama toko akan tampil di setiap kartu produk dan halaman detail
            koleksi Anda.
          </p>

          {storeFeedback && (
            <div
              className={`mb-5 p-4 rounded-2xl text-sm flex items-center gap-2.5 ${
                storeFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {storeFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{storeFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveStore} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Nama Toko
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Deskripsi Toko
              </label>
              <textarea
                rows={4}
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
                placeholder="Ceritakan koleksi dan keunggulan toko Anda..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
              />
            </div>

            <button
              type="submit"
              disabled={savingStore}
              className="px-6 py-3 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {savingStore ? "Menyimpan..." : "Simpan Profil Toko"}
            </button>
          </form>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#0f172b]">
                  {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan foto rasio 4:5 (contoh: 1080 × 1350 px) agar tampil
                  optimal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-[#0f172b] hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Foto Produk
                  </label>
                  <div className="aspect-[4/5] w-full rounded-2xl bg-[#0f172b] border border-slate-200 overflow-hidden flex items-center justify-center mb-3">
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <Upload className="w-6 h-6 mx-auto mb-1.5 text-[#f9943b]" />
                        <p className="text-[11px]">Belum ada foto</p>
                      </div>
                    )}
                  </div>

                  <label className="w-full py-2 px-3 rounded-xl bg-[#0f172b] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-[#f9943b]" />
                    <span>
                      {uploadingImage ? "Mengunggah..." : "Choose File"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Nike Dunk Low Retro White Black"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Kategori
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category_id: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] bg-white focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        min={1000}
                        required
                        value={formData.price}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
                        placeholder="299000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Stok Unit
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            stock: e.target.value,
                          }))
                        }
                        placeholder="20"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Deskripsi Produk
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Spesifikasi bahan, ukuran, dan detail produk..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {savingProduct
                    ? "Menyimpan..."
                    : editingProduct
                    ? "Simpan Perubahan"
                    : "Publikasikan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}