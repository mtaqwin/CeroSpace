import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || !["seller", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "Akses ditolak. Silakan login sebagai Seller atau Admin." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const rawFolder = formData.get("folder")?.toString() || "products";
    const folder = rawFolder === "banners" ? "banners" : "products";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { message: "File gambar belum dipilih." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Format file tidak didukung. Gunakan JPG, PNG, atau WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "Ukuran gambar maksimal 5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const baseName = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    const fileName = `${Date.now()}-${baseName || "image"}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return NextResponse.json(
      {
        message: "Gambar berhasil diunggah.",
        url: `/uploads/${folder}/${fileName}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengunggah gambar." },
      { status: 500 }
    );
  }
}