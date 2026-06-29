import { createClient } from "@libsql/client/web";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST metodu kabul edilir" });
  }

  const { userId, orderId, orderNumber, status, notes, duration, newAddress, jobId } = req.body;
  const agentId = userId || "user_1";

  if (!orderId || !status) {
    return res.status(400).json({ error: "Eksik parametreler (orderId ve status zorunludur)." });
  }

  // Turso'ya bağlan
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // 1. Çağrı logunu veri tabanına kaydet
    const callLogId = Math.random().toString(36).substring(2, 11);
    await client.execute({
      sql: `INSERT INTO call_logs (id, user_id, order_id, order_number, netgsm_job_id, status, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        callLogId,
        agentId,
        String(orderId),
        orderNumber || "",
        jobId || "demo_job",
        status,
        notes || "",
      ],
    });

    // 2. Shopify Entegrasyonu (Eğer bilgiler tanımlıysa)
    if (process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN && String(orderId) !== "999999") {
      const shopifyUrl = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/orders/${orderId}.json`;
      let updateBody = {};

      if (newAddress && status === "ADRES_GUNCELLEDNDI") {
        // Adres güncellemesi
        updateBody = {
          order: {
            id: orderId,
            shipping_address: {
              address1: newAddress.address1,
              address2: newAddress.address2,
              city: newAddress.city,
              province: newAddress.province,
              zip: newAddress.zip,
            },
            tags: `Teyit_AdresGuncellendi`,
            note: `[CRM Teyit - Adres Güncellendi]: ${notes || ""}`
          }
        };
      } else {
        // Standart Teyit / Ulaşılamadı / İptal Tag'i
        updateBody = {
          order: {
            id: orderId,
            tags: `Teyit_${status}`,
            note: `[CRM Teyit - Durum: ${status}]: ${notes || ""}`
          }
        };
      }

      await fetch(shopifyUrl, {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
      });
    }

    // Güncel bakiye bilgisini alıp dön
    const userRes = await client.execute({
      sql: "SELECT balance FROM users WHERE id = ?",
      args: [agentId],
    });
    const currentBalance = userRes.rows.length > 0 ? Number(userRes.rows[0].balance) : 0;

    return res.status(200).json({
      success: true,
      balance: currentBalance,
      message: "Çağrı ve teyit notları başarıyla kaydedildi.",
    });

  } catch (error) {
    console.error("Çağrı kaydetme API hatası:", error);
    return res.status(500).json({ error: "Çağrı kaydedilirken sunucu hatası oluştu." });
  }
}
