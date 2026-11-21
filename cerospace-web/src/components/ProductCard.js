"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShoppingBag, Store, Check } from "lucide-react";

export default function ProductCard({ product }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [imgError, setImgError] = useState(false);
    const [storeImgError, setStoreImgError] = useState(false);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    const formattedPrice = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(product.price);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session?.user) {
            router.push("/login");
            return;
        }

        if (session.user.role !== "buyer") {
            alert("Fitur keranjang hanya tersedia untuk akun Buyer.");
            return;
        }

        setAdding(true);
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id: product.id, quantity: 1 }),
            });

            if (res.ok) {
                setAdded(true);
                setTimeout(() => setAdded(false), 1800);
            }
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="group bg-[#0f172b] text-white rounded-2xl overflow-hidden border border-slate-800/80 shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col">
            <Link
                href={`/products/${product.id}`}
                className="block relative aspect-[4/5] bg-slate-800 overflow-hidden"
            >
                {product.image_url && !imgError ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#16213e] to-[#0f172b]">
                        <span className="text-xs font-semibold uppercase tracking-widest text-[#f9943b] mb-2">
                            {product.store_name}
                        </span>
                        <p className="text-sm font-medium text-slate-300 line-clamp-3">
                            {product.name}
                        </p>
                    </div>
                )}

                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0f172b]/85 backdrop-blur-sm text-[11px] font-medium text-slate-200 border border-white/10">
                    {product.category_name}
                </span>
            </Link>

            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                        {product.store_image && !storeImgError ? (
                            <img
                                src={product.store_image}
                                alt={product.store_name}
                                onError={() => setStoreImgError(true)}
                                className="w-4 h-4 rounded-full object-cover bg-white shrink-0 border border-white/10"
                            />
                        ) : (
                            <Store className="w-3.5 h-3.5 text-[#f9943b] shrink-0" />
                        )}
                        <span className="truncate">{product.store_name}</span>
                    </div>

                    <Link href={`/products/${product.id}`}>
                        <h3 className="text-sm font-semibold text-white group-hover:text-[#f9943b] transition line-clamp-2 leading-snug">
                            {product.name}
                        </h3>
                    </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div>
                        <p className="text-base font-bold text-[#f9943b]">{formattedPrice}</p>
                        <p className="text-[11px] text-slate-400">Stok: {product.stock}</p>
                    </div>

                    <button
                        type="button"
                        suppressHydrationWarning
                        onClick={handleAddToCart}
                        disabled={adding || product.stock < 1}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f9943b] hover:bg-[#e8852c] text-[#0f172b] font-semibold text-xs transition disabled:opacity-50 cursor-pointer shrink-0"
                    >
                        {added ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Masuk</span>
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>+ Cart</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}