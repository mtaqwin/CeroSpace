"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <footer className="bg-[#0f172b] text-slate-300 border-t border-white/10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="inline-block mb-3">
              <img
                src="/logo.png"
                alt="CeroSpace"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Kurasi fashion streetwear, footwear, dan aksesoris harian dari
              mitra brand terverifikasi dengan pengalaman belanja yang rapi dan
              transparan.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Kategori Koleksi
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link
                  href="/products?category=baju-jaket"
                  className="hover:text-[#f9943b] transition"
                >
                  Atasan
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=celana-rok"
                  className="hover:text-[#f9943b] transition"
                >
                  Bawahan
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=sepatu-sendal"
                  className="hover:text-[#f9943b] transition"
                >
                  Alas Kaki
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=aksesoris"
                  className="hover:text-[#f9943b] transition"
                >
                  Aksesoris
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Akses Platform
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link
                  href="/products"
                  className="hover:text-[#f9943b] transition"
                >
                  Semua Katalog Produk
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-[#f9943b] transition"
                >
                  Daftar Akun Buyer / Mitra Seller
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#f9943b] transition">
                  Masuk ke Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CeroSpace. Hak cipta dilindungi.</p>
          <p>Projek Praktikum Web Sisfo UH 2026</p>
        </div>
      </div>
    </footer>
  );
}










