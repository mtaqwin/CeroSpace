import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Clock, XCircle } from "lucide-react";
import PendingActions from "./PendingActions";

export default async function SellerPendingPage() {
  const session = await auth();

  if (!session || session.user.role !== "seller") {
    redirect("/login");
  }

  if (session.user.seller_status === "approved") {
    redirect("/seller");
  }

  const isRejected = session.user.seller_status === "rejected";

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f7f8fd] px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        <div className="bg-[#0f172b] px-6 py-6 text-center">
          <img
            src="/logo.jpg"
            alt="CeroSpace"
            className="h-9 w-auto object-contain mx-auto mix-blend-lighten"
          />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#f9943b] mt-3">
            Status Mitra Seller
          </p>
        </div>

        <div className="p-6 sm:p-8 text-center">
          {isRejected ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-[#0f172b] mb-2">
                Pengajuan Seller Ditolak
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Maaf, pendaftaran akun Seller Anda belum dapat disetujui oleh
                Admin saat ini. Anda dapat menghapus akun ini atau keluar
                terlebih dahulu.
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-[#f9943b] flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-[#0f172b] mb-2">
                Akun Sedang Ditinjau
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Pendaftaran Seller Anda sedang dalam proses verifikasi oleh
                Admin (estimasi 1–3 hari kerja). Silakan cek kembali secara
                berkala.
              </p>
            </>
          )}

          <PendingActions status={session.user.seller_status} />
        </div>
      </div>
    </div>
  );
}