"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ShoppingBag,
  Store,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal mendaftar.");
        setLoading(false);
        return;
      }

      if (form.role === "seller") {
        setLoading(false);
        setShowSellerModal(true);
        return;
      }

      router.push("/login");
    } catch {
      setError("Terjadi kesalahan pada server.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#f7f8fd]">
      {/* Panel Kiri: Brand Showcase dengan Background Foto */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0f172b] text-white p-12 relative overflow-hidden">
        <img
          src="/login-bg.png"
          alt="CeroSpace Background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172b]/95 via-[#0f172b]/70 to-[#0f172b]/60 pointer-events-none" />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-[#f9943b] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="relative z-10 max-w-md my-auto">
          <img
            src="/logo.png"
            alt="CeroSpace Logo"
            className="w-72 h-auto object-contain mb-8"
          />
          <h2 className="text-3xl font-bold leading-snug tracking-tight mb-4">
            Mulai Perjalanan Gaya Anda Bersama Kami.
          </h2>
          <p className="text-slate-200 text-sm leading-relaxed">
            Bergabung sebagai Buyer untuk menikmati kemudahan checkout
            multi-toko, atau daftar sebagai Seller untuk membuka etalase brand
            resmi Anda.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-300">
          © {new Date().getFullYear()} CeroSpace
        </div>
      </div>

      {/* Panel Kanan: Form Register */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-6">
            <div className="bg-[#0f172b] rounded-2xl p-4 inline-block">
              <img
                src="/logo.png"
                alt="CeroSpace Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172b] tracking-tight">
              Buat Akun Baru
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pilih peran akun dan lengkapi data diri Anda.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilihan Role */}
            <div>
              <label className="block text-sm font-semibold text-[#0f172b] mb-2">
                Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "buyer" })}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    form.role === "buyer"
                      ? "bg-[#0f172b] text-white border-[#0f172b] shadow-sm"
                      : "bg-white text-[#0f172b] border-slate-300 hover:border-[#0f172b]"
                  }`}
                >
                  <ShoppingBag
                    className={`w-5 h-5 shrink-0 ${
                      form.role === "buyer" ? "text-[#f9943b]" : "text-slate-500"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-semibold">Buyer</div>
                    <div
                      className={`text-[11px] ${
                        form.role === "buyer"
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Belanja produk
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "seller" })}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    form.role === "seller"
                      ? "bg-[#0f172b] text-white border-[#0f172b] shadow-sm"
                      : "bg-white text-[#0f172b] border-slate-300 hover:border-[#0f172b]"
                  }`}
                >
                  <Store
                    className={`w-5 h-5 shrink-0 ${
                      form.role === "seller"
                        ? "text-[#f9943b]"
                        : "text-slate-500"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-semibold">Seller</div>
                    <div
                      className={`text-[11px] ${
                        form.role === "seller"
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Buka toko brand
                    </div>
                  </div>
                </button>
              </div>
              {form.role === "seller" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2.5">
                  Akun Seller baru akan ditinjau terlebih dahulu oleh Admin
                  sebelum aktif.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f172b] mb-1.5">
                {form.role === "seller"
                  ? "Nama Pemilik / Brand"
                  : "Nama Lengkap"}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={
                  form.role === "seller"
                    ? "Contoh: Adidas Official"
                    : "Contoh: Budi Santoso"
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0f172b] placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#f9943b] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f172b] mb-1.5">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@email.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0f172b] placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#f9943b] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f172b] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white border border-slate-300 text-[#0f172b] placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#f9943b] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0f172b] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Mendaftarkan Akun..." : "Buat Akun"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#0f172b] underline decoration-[#f9943b] decoration-2 underline-offset-4 hover:text-[#f9943b] transition"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* POP-UP KONFIRMASI PENDAFTARAN SELLER */}
      {showSellerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0f172b] text-[#f9943b] flex items-center justify-center mx-auto mb-5 relative">
              <Clock className="w-8 h-8" />
              <CheckCircle2 className="w-5 h-5 text-emerald-400 bg-[#0f172b] rounded-full absolute -bottom-1 -right-1" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-3">
              Menunggu Verifikasi Admin
            </span>

            <h2 className="text-xl font-bold text-[#0f172b]">
              Pengajuan Seller Berhasil Dikirim!
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed mt-3">
              Terima kasih telah mendaftar sebagai mitra{" "}
              <strong className="text-[#0f172b]">{form.name}</strong> di
              CeroSpace. Data toko Anda sedang ditinjau oleh Admin dengan
              estimasi waktu{" "}
              <strong className="text-[#0f172b]">1–3 hari kerja</strong>.
            </p>

            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 mt-4">
              Anda sudah bisa masuk ke akun sekarang untuk memantau status
              persetujuan toko secara berkala.
            </p>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full mt-6 py-3.5 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition cursor-pointer shadow-sm"
            >
              Mengerti, Lanjut ke Halaman Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}