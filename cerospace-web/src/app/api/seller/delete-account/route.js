import { auth } from "@/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE() {
  const session = await auth();

  if (!session || session.user.role !== "seller" || session.user.seller_status !== "rejected") {
    return NextResponse.json(
      { message: "Aksi tidak diizinkan." },
      { status: 403 }
    );
  }

  try {
    const userId = session.user.id;
    
    // Delete user (cascade will handle stores)
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    return NextResponse.json(
      { message: "Akun berhasil dihapus." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
