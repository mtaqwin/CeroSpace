import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const role = body.role === "seller" ? "seller" : "buyer";
    const storeName =
      body.store_name?.trim() || body.storeName?.trim() || name;
    const storeDescription =
      body.store_description?.trim() ||
      body.storeDescription?.trim() ||
      `Official store ${storeName} di CeroSpace.`;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const existingRes = await client.query(
      "SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [email]
    );
    if (existingRes.rows.length > 0) {
      return NextResponse.json(
        { message: "Email ini sudah terdaftar. Silakan gunakan email lain." },
        { status: 409 }
      );
    }

    const colsRes = await client.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_name IN ('users', 'stores')`
    );

    const tableCols = { users: [], stores: [] };
    for (const row of colsRes.rows) {
      tableCols[row.table_name]?.push(row.column_name);
    }

    const passwordCol = tableCols.users.includes("password_hash")
      ? "password_hash"
      : "password";
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    const userCols = ["name", "email", passwordCol, "role"];
    const userVals = [name, email, hashedPassword, role];

    if (tableCols.users.includes("seller_status")) {
      userCols.push("seller_status");
      userVals.push(role === "seller" ? "pending" : null);
    }

    const userPlaceholders = userVals.map((_, i) => `$${i + 1}`).join(", ");
    const insertUserRes = await client.query(
      `INSERT INTO users (${userCols.join(", ")})
       VALUES (${userPlaceholders})
       RETURNING id, name, email, role`,
      userVals
    );

    const newUser = insertUserRes.rows[0];

    if (role === "seller") {
      const storeCols = ["user_id", "name"];
      const storeVals = [newUser.id, storeName];

      if (tableCols.stores.includes("description")) {
        storeCols.push("description");
        storeVals.push(storeDescription);
      }
      if (tableCols.stores.includes("status")) {
        storeCols.push("status");
        storeVals.push("pending");
      }
      if (tableCols.stores.includes("slug")) {
        const baseSlug = storeName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        storeCols.push("slug");
        storeVals.push(`${baseSlug || "store"}-${newUser.id}`);
      }

      const storePlaceholders = storeVals.map((_, i) => `$${i + 1}`).join(", ");
      await client.query(
        `INSERT INTO stores (${storeCols.join(", ")})
         VALUES (${storePlaceholders})`,
        storeVals
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        message:
          role === "seller"
            ? "Pendaftaran Seller berhasil! Menunggu persetujuan Admin."
            : "Registrasi berhasil! Silakan masuk.",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/register error:", error);
    return NextResponse.json(
      {
        message: `Gagal mendaftar: ${error.detail || error.message || "Terjadi kesalahan pada server."}`,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}