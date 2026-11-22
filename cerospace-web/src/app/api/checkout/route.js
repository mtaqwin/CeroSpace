import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function POST(request) {
  const client = await pool.connect();
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "buyer") {
      return NextResponse.json(
        { message: "Hanya akun Buyer yang dapat melakukan checkout." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const paymentMethod = body.payment_method?.trim().toLowerCase();

    if (!paymentMethod || !["transfer", "cod"].includes(paymentMethod)) {
      return NextResponse.json(
        { message: "Pilih metode pembayaran yang valid (Transfer atau COD)." },
        { status: 400 }
      );
    }

    const colsRes = await client.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_name IN ('cart_items', 'orders', 'order_items')`
    );

    const tableCols = { cart_items: [], orders: [], order_items: [] };
    for (const row of colsRes.rows) {
      tableCols[row.table_name]?.push(row.column_name);
    }

    const cartUserCol = tableCols.cart_items.includes("buyer_id") ? "buyer_id" : "user_id";
    const orderBuyerCol = tableCols.orders.includes("buyer_id") ? "buyer_id" : "user_id";
    const orderTotalCol = tableCols.orders.includes("total_price")
      ? "total_price"
      : "total_amount";
    const itemPriceCol = tableCols.order_items.includes("price_at_purchase")
      ? "price_at_purchase"
      : "price";

    const buyerId = Number(session.user.id);

    await client.query("BEGIN");

    const cartRes = await client.query(
      `SELECT ci.id AS cart_id, ci.product_id, ci.quantity,
              p.name, p.price, p.stock, p.store_id,
              s.name AS store_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN stores s ON p.store_id = s.id
       WHERE ci.${cartUserCol} = $1
       FOR UPDATE OF p`,
      [buyerId]
    );

    const items = cartRes.rows;
    if (items.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "Keranjang belanja Anda masih kosong." },
        { status: 400 }
      );
    }

    let grandTotal = 0;
    for (const item of items) {
      if (item.stock < item.quantity) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            message: `Stok "${item.name}" tidak mencukupi (tersisa ${item.stock} unit).`,
          },
          { status: 400 }
        );
      }
      grandTotal += Number(item.price) * Number(item.quantity);
    }

    // Validasi aturan bisnis COD minimal Rp 300.000
    if (paymentMethod === "cod" && grandTotal < 300000) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          message:
            "Metode pembayaran COD hanya berlaku untuk total transaksi minimal Rp 300.000.",
        },
        { status: 400 }
      );
    }

    // Split Order otomatis per toko (store_id)
    const groupedByStore = items.reduce((acc, item) => {
      if (!acc[item.store_id]) {
        acc[item.store_id] = {
          store_id: item.store_id,
          store_name: item.store_name,
          items: [],
          subtotal: 0,
        };
      }
      acc[item.store_id].items.push(item);
      acc[item.store_id].subtotal += Number(item.price) * Number(item.quantity);
      return acc;
    }, {});

    const createdOrders = [];

    for (const storeGroup of Object.values(groupedByStore)) {
      const orderRes = await client.query(
        `INSERT INTO orders (${orderBuyerCol}, store_id, ${orderTotalCol}, payment_method, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          buyerId,
          storeGroup.store_id,
          storeGroup.subtotal,
          paymentMethod,
          "Menunggu Pembayaran",
        ]
      );

      const newOrderId = orderRes.rows[0].id;
      createdOrders.push({
        order_id: newOrderId,
        store_name: storeGroup.store_name,
        total: storeGroup.subtotal,
      });

      for (const item of storeGroup.items) {
        if (tableCols.order_items.includes("product_name")) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, product_name, quantity, ${itemPriceCol})
             VALUES ($1, $2, $3, $4, $5)`,
            [newOrderId, item.product_id, item.name, item.quantity, Number(item.price)]
          );
        } else {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, ${itemPriceCol})
             VALUES ($1, $2, $3, $4)`,
            [newOrderId, item.product_id, item.quantity, Number(item.price)]
          );
        }

        await client.query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query(`DELETE FROM cart_items WHERE ${cartUserCol} = $1`, [
      buyerId,
    ]);

    await client.query("COMMIT");

    return NextResponse.json(
      {
        message: `Checkout berhasil! Pesanan dipecah menjadi ${createdOrders.length} transaksi toko.`,
        orders: createdOrders,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/checkout error:", error);
    return NextResponse.json(
      { message: `Gagal checkout: ${error.detail || error.message}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}