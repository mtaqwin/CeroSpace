"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function PendingActions({ status }) {
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus akun ini secara permanen?"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/seller/delete-account", {
        method: "DELETE",
      });

      if (res.ok) {
        await signOut({ callbackUrl: "/login" });
      } else {
        alert("Gagal menghapus akun.");
        setLoading(false);
      }
    } catch {
      alert("Terjadi kesalahan pada server.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-6">
      {status === "rejected" && (
        <button
          onClick={handleDeleteAccount}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Menghapus..." : "Delete Account"}
        </button>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full py-2.5 rounded-xl bg-[#0f172b] hover:bg-slate-800 text-white font-medium text-sm transition cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}