"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export default function HeroBannerSlider({ banners = [] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) {
    return (
      <div className="relative w-full aspect-[8/3] rounded-3xl overflow-hidden bg-[#0f172b] text-white flex items-center px-8 sm:px-14 shadow-sm">
        <div className="max-w-xl space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-[#f9943b]/20 text-[#f9943b] text-xs font-bold uppercase tracking-wider">
            CeroSpace Official
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Kurasi Fashion & Streetwear Brand Resmi
          </h1>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-bold text-sm transition"
          >
            <span>Jelajahi Katalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const activeBanner = banners[current] || banners[0];

  return (
    <div className="relative w-full aspect-[8/3] rounded-3xl overflow-hidden bg-[#0f172b] shadow-sm group">
      <Link
        href={activeBanner.link_url || "/products"}
        className="block w-full h-full"
      >
        <img
          src={activeBanner.image_url}
          alt={activeBanner.title || "Promo CeroSpace"}
          className="w-full h-full object-cover transition-transform duration-500"
        />
      </Link>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Banner sebelumnya"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0f172b]/70 hover:bg-[#0f172b] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Banner berikutnya"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0f172b]/70 hover:bg-[#0f172b] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0f172b]/50 px-3 py-1.5 rounded-full backdrop-blur-xs">
            {banners.map((b, idx) => (
              <button
                key={b.id || idx}
                type="button"
                onClick={() => setCurrent(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === current
                    ? "w-6 bg-[#f9943b]"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}









