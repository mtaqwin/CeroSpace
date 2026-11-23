"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Store,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Truck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function CartClient({ initialItems = [] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [updatingId, setUpdatingId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [checkingOut, setCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const formatRupiah = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const grandTotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const isCodEligible = grandTotal >= 300000;

  const groupedStores = Object.values(
    items.reduce((acc, item) => {
      if (!acc[item.store_id]) {
        acc[item.store_id] = {
          store_id: item.store_id,
          store_name: item.store_name,
          items: [],
          subtotal: 0,
        };
      }
      acc[item.store_id].items.push(item);
      acc[item.store_id].subtotal += Number(item.price) * Number(item.quantity);
      return acc;
    }, {})
  );

  const handleUpdateQty = async (item, newQty) => {
    if (newQty < 1 || newQty > item.stock) return;
    setUpdatingId(item.id);
    setErrorMsg("");
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, quantity: newQty }),
      });

      if (res.ok) {
        const updatedItems = items.map((i) =>
          i.id === item.id ? { ...i, quantity: newQty } : i
        );
        setItems(updatedItems);
        window.dispatchEvent(new Event("cart-updated"));

        const nextTotal = updatedItems.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0
        );
        if (paymentMethod === "cod" && nextTotal < 300000) {
          setPaymentMethod("transfer");
        }
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Gagal mengubah jumlah.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdatingId(itemId);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/cart?id=${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const remaining = items.filter((i) => i.id !== itemId);
        setItems(remaining);
        window.dispatchEvent(new Event("cart-updated"));

        const nextTotal = remaining.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0
        );
        if (paymentMethod === "cod" && nextTotal < 300000) {
          setPaymentMethod("transfer");
        }
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (paymentMethod === "cod" && !isCodEligible) {
      setErrorMsg("COD hanya tersedia untuk minimal belanja Rp 300.000.");
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Checkout gagal diproses.");
        return;
      }

      window.dispatchEvent(new Event("cart-updated"));
      router.push("/buyer/orders?checkout=success");
      router.refresh();
    } catch {
      setErrorMsg("Terjadi kesalahan koneksi saat checkout.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172b]">
            Keranjang Belanja Kosong
          </h1>
          <p className="text-sm text-slate-500 mt-2 mb-6 max-w-md mx-auto">
            Belum ada koleksi yang ditambahkan ke keranjang. Jelajahi katalog
            mitra brand resmi CeroSpace sekarang.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition"
          >
            <span>Mulai Belanja</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172b] tracking-tight">
          Keranjang Belanja ({items.length} Item)
        </h1>
        {groupedStores.length > 1 && (
          <p className="text-sm text-slate-500 mt-1">
            Pesanan dari <strong>{groupedStores.length} toko berbeda</strong>{" "}
            akan otomatis dipisah menjadi {groupedStores.length} nomor pesanan
            saat checkout.
          </p>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {groupedStores.map((group) => (
            <div
              key={group.store_id}
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm"
            >
              <div className="px-6 py-4 bg-[#0f172b] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-[#f9943b]" />
                  <span className="font-bold text-sm">{group.store_name}</span>
                </div>
                <span className="text-xs text-slate-300">
                  Subtotal Toko:{" "}
                  <strong className="text-[#f9943b]">
                    {formatRupiah(group.subtotal)}
                  </strong>
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="w-20 h-24 rounded-xl bg-[#0f172b] overflow-hidden border border-slate-200 shrink-0"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                            No Image
                          </div>
                        )}
                      </Link>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          {item.category_name}
                        </span>
                        <Link
                          href={`/products/${item.product_id}`}
                          className="block font-bold text-sm sm:text-base text-[#0f172b] hover:text-[#f9943b] transition mt-0.5"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm font-extrabold text-[#f9943b] mt-1">
                          {formatRupiah(item.price)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Sisa stok: {item.stock}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="inline-flex items-center border border-slate-300 rounded-xl px-2.5 py-1.5 bg-[#f7f8fd]">
                        <button
                          type="button"
                          disabled={updatingId === item.id || item.quantity <= 1}
                          onClick={() =>
                            handleUpdateQty(item, Number(item.quantity) - 1)
                          }
                          className="p-1 text-slate-600 hover:text-[#0f172b] disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-bold text-[#0f172b]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={
                            updatingId === item.id ||
                            item.quantity >= item.stock
                          }
                          onClick={() =>
                            handleUpdateQty(item, Number(item.quantity) + 1)
                          }
                          className="p-1 text-slate-600 hover:text-[#0f172b] disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition disabled:opacity-40 cursor-pointer"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleCheckout}
          className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-6 sticky top-24"
        >
          <h2 className="text-lg font-bold text-[#0f172b] border-b border-slate-100 pb-4">
            Ringkasan Checkout
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Metode Pembayaran
            </label>

            <div className="space-y-2.5">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === "transfer"
                    ? "border-[#0f172b] bg-[#0f172b]/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="transfer"
                  checked={paymentMethod === "transfer"}
                  onChange={() => setPaymentMethod("transfer")}
                  className="accent-[#0f172b]"
                />
                <CreditCard className="w-4 h-4 text-[#0f172b]" />
                <div className="text-xs">
                  <p className="font-bold text-[#0f172b]">
                    Transfer Bank / Virtual Account
                  </p>
                  <p className="text-slate-500">BNI, BCA, Mandiri, BRI, QRIS</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition ${
                  !isCodEligible
                    ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                    : paymentMethod === "cod"
                    ? "border-[#0f172b] bg-[#0f172b]/5 cursor-pointer"
                    : "border-slate-200 hover:border-slate-300 cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  disabled={!isCodEligible}
                  checked={paymentMethod === "cod"}
                  onChange={() => isCodEligible && setPaymentMethod("cod")}
                  className="mt-0.5 accent-[#0f172b]"
                />
                <Truck className="w-4 h-4 text-[#f9943b] mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-[#0f172b]">
                    Cash on Delivery (COD)
                  </p>
                  {isCodEligible ? (
                    <p className="text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tersedia (Total ≥ Rp 300.000)</span>
                    </p>
                  ) : (
                    <p className="text-rose-600 mt-0.5">
                      Minimal belanja <strong>Rp 300.000</strong> (kurang{" "}
                      {formatRupiah(300000 - grandTotal)})
                    </p>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Jumlah Pesanan Toko</span>
              <span className="font-semibold text-[#0f172b]">
                {groupedStores.length} pesanan
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="font-bold text-[#0f172b]">Total Bayar</span>
              <span className="text-xl font-extrabold text-[#f9943b]">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={checkingOut}
            className="w-full py-3.5 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {checkingOut ? "Memproses Pesanan..." : "Buat Pesanan Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}