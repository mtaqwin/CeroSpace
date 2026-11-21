"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Email atau password yang Anda masukkan salah.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan pada server saat login.");
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
            Kurasi Fashion & Gaya Harian Pilihan.
          </h2>
          <p className="text-slate-200 text-sm leading-relaxed">
            Temukan koleksi pilihan dari mitra brand resmi—mulai dari atasan,
            bawahan, alas kaki, hingga aksesoris dalam satu ruang belanja.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-300">
          © {new Date().getFullYear()} CeroSpace
        </div>
      </div>

      {/* Panel Kanan: Form Login */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0f172b] mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Beranda
            </Link>
            <div className="bg-[#0f172b] rounded-2xl p-4 inline-block">
              <img
                src="/logo.png"
                alt="CeroSpace Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172b] tracking-tight">
              Masuk ke CeroSpace
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Masukkan email dan password akun Anda untuk melanjutkan.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#0f172b] mb-1.5">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-[#0f172b] placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#f9943b] focus:border-transparent transition"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-white border border-slate-300 text-[#0f172b] placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#f9943b] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0f172b] cursor-pointer"
                  aria-label="Tampilkan password"
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
              className="w-full py-3.5 rounded-xl bg-[#0f172b] hover:bg-[#1e293b] text-white font-semibold text-sm shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Memproses..." : "Masuk Sekarang"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Belum punya akun CeroSpace?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#0f172b] underline decoration-[#f9943b] decoration-2 underline-offset-4 hover:text-[#f9943b] transition"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}