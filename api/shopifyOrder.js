import { createClient } from "@libsql/client/web";

export default async function handler(req, res) {
  // Sadece POST veya GET kabul et
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Sadece GET/POST metotları kabul edilir" });
  }

  const orderNumber = req.method === "POST" ? req.body.orderNumber : req.query.orderNumber;
  const userId = (req.method === "POST" ? req.body.userId : req.query.userId) || "user_1";

  if (!orderNumber) {
    return res.status(400).json({ error: "Sipariş numarası gereklidir." });
  }

  const SEARCH_COST = 0.50; // Kredi bedeli

  // Turso'ya bağlan
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // 1. Gerekli tabloların otomatik oluşturulması (İlk çalıştırma için güvenlik önlemi)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        balance REAL NOT NULL DEFAULT 0.00,
        role TEXT NOT NULL DEFAULT 'agent',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS credit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        order_number TEXT NOT NULL,
        twilio_call_sid TEXT UNIQUE,
        duration_seconds INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Varsayılan admin kullanıcısının (id: user_1) eklenmesi (Eğer yoksa)
    const userCheck = await client.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [userId],
    });

    if (userCheck.rows.length === 0 && userId === "user_1") {
      await client.execute({
        sql: "INSERT INTO users (id, name, email, balance, role) VALUES ('user_1', 'Kullanıcı', 'admin@nestro.com', 4250.00, 'admin')",
        args: [],
      });
    }

    // 3. Bakiye kontrolü ve düşüşü
    const userRes = await client.execute({
      sql: "SELECT balance FROM users WHERE id = ?",
      args: [userId],
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    const currentBalance = Number(userRes.rows[0].balance);
    if (currentBalance < SEARCH_COST) {
      return res.status(402).json({ error: "Yetersiz bakiye. Arama yapmak için en az ₺0.50 bakiyeniz olmalıdır." });
    }

    // Shopify Arama
    const formattedOrderNumber = orderNumber.startsWith("#") ? orderNumber : `#${orderNumber}`;
    
    // Shopify bilgileri girilmemişse mock veriden dön (Geliştirici dostu fallback)
    if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
      console.warn("Shopify API ortam değişkenleri eksik. Mock veri dönecek.");
      
      // Krediyi düşür
      const newBalance = currentBalance - SEARCH_COST;
      await client.execute({
        sql: "UPDATE users SET balance = ? WHERE id = ?",
        args: [newBalance, userId],
      });

      // Log kaydet
      const logId = Math.random().toString(36).substring(2, 11);
      await client.execute({
        sql: "INSERT INTO credit_logs (id, user_id, amount, transaction_type, description) VALUES (?, ?, ?, ?, ?)",
        args: [logId, userId, -SEARCH_COST, "search_deduction", `${orderNumber} nolu sipariş sorgulandı (Mock)`],
      });

      return res.status(200).json({
        isMock: true,
        order: {
          id: 999999,
          order_number: formattedOrderNumber,
          financial_status: "pending",
          total_price: "1250.00",
          currency: "TRY",
          customer: {
            first_name: "Mock",
            last_name: "Müşteri (API Fallback)",
            phone: "+90 532 999 8877"
          },
          shipping_address: {
            address1: "Örnek Mahallesi, Test Sokak No:12 D:4",
            address2: "Kat 2",
            city: "Kadıköy",
            province: "İstanbul",
            zip: "34710",
            country: "Turkey"
          },
          line_items: [
            { id: 1, title: "Kablosuz Kulak Üstü Kulaklık", quantity: 1, price: "1250.00", variant_title: "Siyah" }
          ]
        },
        balance: newBalance,
      });
    }

    // Shopify Gerçek Entegrasyonu
    const shopifyUrl = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/orders.json?name=${encodeURIComponent(formattedOrderNumber)}&status=any`;
    const shopifyResponse = await fetch(shopifyUrl, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!shopifyResponse.ok) {
      return res.status(502).json({ error: "Shopify API bağlantı hatası." });
    }

    const shopifyData = await shopifyResponse.json();
    const orders = shopifyData.orders;

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "Belirtilen numaraya ait Shopify siparişi bulunamadı." });
    }

    const order = orders[0];

    // Krediyi düşür
    const newBalance = currentBalance - SEARCH_COST;
    await client.execute({
      sql: "UPDATE users SET balance = ? WHERE id = ?",
      args: [newBalance, userId],
    });

    // Log kaydet
    const logId = Math.random().toString(36).substring(2, 11);
    await client.execute({
      sql: "INSERT INTO credit_logs (id, user_id, amount, transaction_type, description) VALUES (?, ?, ?, ?, ?)",
      args: [logId, userId, -SEARCH_COST, "search_deduction", `${orderNumber} nolu sipariş sorgulandı`],
    });

    // İhtiyacımız olan alanları sanitize et
    const sanitizedOrder = {
      id: order.id,
      order_number: order.name,
      financial_status: order.financial_status,
      total_price: order.total_price,
      currency: order.currency,
      customer: {
        first_name: order.customer?.first_name || "",
        last_name: order.customer?.last_name || "",
        phone: order.customer?.phone || order.shipping_address?.phone || "",
      },
      shipping_address: {
        address1: order.shipping_address?.address1 || "",
        address2: order.shipping_address?.address2 || "",
        city: order.shipping_address?.city || "",
        province: order.shipping_address?.province || "",
        zip: order.shipping_address?.zip || "",
        country: order.shipping_address?.country || "",
      },
      line_items: order.line_items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        variant_title: item.variant_title,
      })),
    };

    return res.status(200).json({
      order: sanitizedOrder,
      balance: newBalance,
    });

  } catch (error) {
    console.error("Sipariş arama API hatası:", error);
    return res.status(500).json({ error: "Sunucu hatası oluştu." });
  }
}
