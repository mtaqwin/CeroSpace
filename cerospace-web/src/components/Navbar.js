"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  ShoppingBag,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Clock,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const user = session?.user;
  const role = user?.role;
  const sellerStatus = user?.sellerStatus || user?.seller_status;
  const isUnapprovedSeller =
    sellerStatus === "pending" || sellerStatus === "rejected";

  useEffect(() => {
    if (role !== "buyer") {
      setCartCount(0);
      return;
    }

    let isMounted = true;
    const fetchCartCount = async () => {
      try {
        const res = await fetch("/api/cart/count");
        if (res.ok && isMounted) {
          const data = await res.json();
          setCartCount(data.count || 0);
        }
      } catch {
        // Abaikan error jaringan sementara
      }
    };

    fetchCartCount();
    window.addEventListener("cart-updated", fetchCartCount);

    return () => {
      isMounted = false;
      window.removeEventListener("cart-updated", fetchCartCount);
    };
  }, [role, pathname]);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/products");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f172b] text-white border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/logo.png"
            alt="CeroSpace"
            className="h-9 sm:h-10 w-auto object-contain"
          />
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md relative"
        >
          <input
            type="text"
            suppressHydrationWarning
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kaos, jaket, sneakers, topi..."
            className="w-full pl-4 pr-10 py-2 rounded-full bg-white/10 border border-white/15 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f9943b] focus:bg-white/15 transition"
          />
          <button
            type="submit"
            suppressHydrationWarning
            aria-label="Cari produk"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#f9943b] cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Menu Navigasi Kanan */}
        <nav className="flex items-center gap-3 sm:gap-5 text-sm">
          <Link
            href="/"
            className={`font-medium transition ${
              pathname === "/"
                ? "text-[#f9943b] font-semibold"
                : "text-slate-200 hover:text-[#f9943b]"
            }`}
          >
            Beranda
          </Link>

          <Link
            href="/products"
            className={`font-medium transition ${
              pathname.startsWith("/products")
                ? "text-[#f9943b] font-semibold"
                : "text-slate-200 hover:text-[#f9943b]"
            }`}
          >
            Katalog
          </Link>

          {status === "loading" ? (
            <div className="w-20 h-8 rounded-xl bg-white/10 animate-pulse" />
          ) : !user ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl font-semibold text-slate-200 hover:text-white transition"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold transition"
              >
                Daftar
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              {role === "buyer" && (
                <>
                  <Link
                    href="/buyer/orders"
                    className={`inline-flex items-center gap-1.5 font-medium transition ${
                      pathname.startsWith("/buyer/orders")
                        ? "text-[#f9943b] font-semibold"
                        : "text-slate-200 hover:text-[#f9943b]"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 text-[#f9943b]" />
                    <span className="hidden sm:inline">Pesanan</span>
                  </Link>

                  <Link
                    href="/cart"
                    className="relative p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition"
                    aria-label="Keranjang Belanja"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#f9943b]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f9943b] text-[#0f172b] text-[10px] font-extrabold flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {role === "seller" && (
                <Link
                  href="/seller"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition"
                >
                  {isUnapprovedSeller ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-[#f9943b]" />
                      <span>Status Toko</span>
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#f9943b]" />
                      <span>Seller Dashboard</span>
                    </>
                  )}
                </Link>
              )}

              {role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#f9943b]" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-white/15">
                <span className="hidden lg:inline text-xs font-medium text-slate-300 max-w-[130px] truncate">
                  {user.name}
                </span>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Keluar"
                  className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}