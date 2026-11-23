"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Store,
  CheckCircle2,
  Star,
  CreditCard,
  X,
  ShoppingBag,
  RefreshCw,
  Clock,
  Truck,
} from "lucide-react";

const STATUS_BADGE = {
  "Menunggu Pembayaran": {
    label: "Menunggu Pembayaran",
    style: "bg-amber-100 text-amber-800 border-amber-200",
    step: 1,
  },
  Diproses: {
    label: "Sedang Diproses Penjual",
    style: "bg-blue-100 text-blue-800 border-blue-200",
    step: 2,
  },
  Dikirim: {
    label: "Sedang Dalam Pengiriman",
    style: "bg-indigo-100 text-indigo-800 border-indigo-200",
    step: 3,
  },
  Selesai: {
    label: "Selesai / Diterima",
    style: "bg-emerald-100 text-emerald-800 border-emerald-200",
    step: 4,
  },
  Dibatalkan: {
    label: "Dibatalkan",
    style: "bg-rose-100 text-rose-800 border-rose-200",
    step: 0,
  },
};

const ORDER_STEPS = [
  { step: 1, label: "Menunggu Diproses" },
  { step: 2, label: "Sedang Diproses" },
  { step: 3, label: "Dalam Pengiriman" },
  { step: 4, label: "Pesanan Diterima" },
];

export default function BuyerOrdersClient({
  initialOrders = [],
  showSuccessBanner,
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [confirmingId, setConfirmingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    if (reviewModal) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 8000);
    return () => clearInterval(interval);
  }, [router, reviewModal]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const handleConfirmDelivered = async (orderId) => {
    setConfirmingId(orderId);
    try {
      const res = await fetch("/api/buyer/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "Selesai" } : o))
        );
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Gagal mengonfirmasi pesanan.");
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: reviewModal.orderId,
          product_id: reviewModal.productId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Gagal mengirim ulasan.");
        return;
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== reviewModal.orderId) return o;
          return {
            ...o,
            items: o.items.map((item) =>
              item.product_id === reviewModal.productId
                ? { ...item, reviewed: true }
                : item
            ),
          };
        })
      );

      setReviewModal(null);
      setRating(5);
      setComment("");
      router.refresh();
    } catch {
      alert("Terjadi kesalahan koneksi saat mengirim ulasan.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172b] tracking-tight">
            Pesanan Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau status pesanan per toko dan berikan ulasan untuk produk yang
            sudah diterima.
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#0f172b] text-xs font-semibold text-[#0f172b] transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#f9943b] ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          <span>Perbarui Status</span>
        </button>
      </div>

      {showSuccessBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Pesanan Berhasil Dibuat!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Transaksi telah diteruskan ke masing-masing toko sesuai rincian
              split order di bawah ini.
            </p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0f172b]">
            Belum Ada Riwayat Pesanan
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Anda belum memiliki transaksi. Yuk mulai temukan outfit favorit Anda!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f172b] text-white text-sm font-semibold hover:bg-slate-800 transition"
          >
            <ShoppingBag className="w-4 h-4 text-[#f9943b]" />
            <span>Jelajahi Katalog</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const badge = STATUS_BADGE[order.status] || {
              label: order.status,
              style: "bg-slate-100 text-slate-700 border-slate-200",
              step: 1,
            };

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm"
              >
                <div className="px-6 py-4 bg-[#0f172b] text-white flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold text-[#f9943b]">
                      ORDER #{order.id}
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                      <Store className="w-4 h-4 text-[#f9943b]" />
                      <span>{order.store_name}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.style}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {badge.step > 0 && (
                  <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ORDER_STEPS.map((s) => {
                        const isDone = badge.step >= s.step;
                        return (
                          <div
                            key={s.step}
                            className={`flex items-center gap-2 text-xs font-semibold ${
                              isDone ? "text-[#0f172b]" : "text-slate-400"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isDone
                                  ? "bg-[#f9943b] text-[#0f172b]"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {s.step}
                            </span>
                            <span className="truncate">{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 rounded-xl bg-[#0f172b] overflow-hidden border border-slate-200 shrink-0">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/products/${item.product_id}`}
                            className="font-bold text-sm text-[#0f172b] hover:text-[#f9943b] transition"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.quantity} unit × {formatRupiah(item.price)}
                          </p>
                        </div>
                      </div>

                      {order.status === "Selesai" && (
                        <div>
                          {item.reviewed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sudah Diulas</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewModal({
                                  orderId: order.id,
                                  productId: item.product_id,
                                  productName: item.product_name,
                                });
                                setRating(5);
                                setComment("");
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-xs transition cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>Beri Ulasan</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 bg-[#f7f8fd] border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <CreditCard className="w-3.5 h-3.5 text-[#0f172b]" />
                    <span>
                      Metode Bayar:{" "}
                      <strong className="text-[#0f172b] uppercase">
                        {order.payment_method}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500">Total Pesanan</p>
                      <p className="text-base font-extrabold text-[#0f172b]">
                        {formatRupiah(order.total_amount)}
                      </p>
                    </div>

                    {order.status === "Dikirim" && (
                      <button
                        type="button"
                        disabled={confirmingId === order.id}
                        onClick={() => handleConfirmDelivered(order.id)}
                        className="px-4 py-2.5 rounded-xl bg-[#0f172b] hover:bg-slate-800 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#f9943b]" />
                        <span>
                          {confirmingId === order.id
                            ? "Memproses..."
                            : "Pesanan Diterima"}
                        </span>
                      </button>
                    )}

                    {(order.status === "Menunggu Pembayaran" ||
                      order.status === "Diproses") && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-[#f9943b]" />
                        <span>
                          {order.status === "Menunggu Pembayaran"
                            ? "Menunggu konfirmasi penjual"
                            : "Penjual sedang mengemas barang"}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-[#0f172b]">
                Beri Ulasan Produk
              </h3>
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[#0f172b] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-[#0f172b] mb-4">
              {reviewModal.productName}
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Rating Bintang
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition ${
                          star <= rating
                            ? "fill-[#f9943b] text-[#f9943b]"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Komentar Ulasan
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Bagaimana kualitas bahan, ukuran, dan pengirimannya?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0f172b] focus:outline-none focus:ring-2 focus:ring-[#f9943b]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-xs cursor-pointer"
                >
                  {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}