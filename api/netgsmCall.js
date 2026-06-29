import { createClient } from "@libsql/client/web";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST metodu kabul edilir" });
  }

  const { userId, customerPhone, agentPhone } = req.body;
  const agentId = userId || "user_1";
  const CALL_INITIATION_COST = 1.00; // Arama başlatma bedeli

  if (!customerPhone || !agentPhone) {
    return res.status(400).json({ error: "Müşteri ve personel telefon numaraları gereklidir." });
  }

  // Turso'ya bağlan
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // 1. Kullanıcı bakiye kontrolü
    const userRes = await client.execute({
      sql: "SELECT balance FROM users WHERE id = ?",
      args: [agentId],
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    const currentBalance = Number(userRes.rows[0].balance);
    if (currentBalance < CALL_INITIATION_COST) {
      return res.status(402).json({ error: "Yetersiz bakiye. Arama başlatmak için en az ₺1.00 bakiyeniz olmalıdır." });
    }

    const netgsmUser = process.env.NETGSM_USERNAME;
    const netgsmPassword = process.env.NETGSM_PASSWORD;
    const netgsmHeader = process.env.NETGSM_HEADER || "";

    // Netgsm bilgileri girilmemişse mock arama yap (Demo modu fallback)
    if (!netgsmUser || !netgsmPassword) {
      console.warn("Netgsm API kimlik bilgileri eksik. Demo modu simülasyonu çalışacak.");
      
      // Krediyi düşür
      const newBalance = currentBalance - CALL_INITIATION_COST;
      await client.execute({
        sql: "UPDATE users SET balance = ? WHERE id = ?",
        args: [newBalance, agentId],
      });

      // Log kaydet
      const logId = Math.random().toString(36).substring(2, 11);
      await client.execute({
        sql: "INSERT INTO credit_logs (id, user_id, amount, transaction_type, description) VALUES (?, ?, ?, ?, ?)",
        args: [logId, agentId, -CALL_INITIATION_COST, "call_deduction", `${customerPhone} nolu telefona Netgsm araması başlatıldı (Demo)`],
      });

      return res.status(200).json({
        isMock: true,
        jobId: "demo_netgsm_job_12345",
        balance: newBalance,
        message: "Netgsm araması başarıyla tetiklendi (Demo). Önce telefonunuz çalan arama simüle ediliyor.",
      });
    }

    // 2. Netgsm API İstek Hazırlığı
    const cleanPhone = (phone) => phone.replace(/\D/g, "");
    const tel1 = cleanPhone(agentPhone);
    const tel2 = cleanPhone(customerPhone);

    const netgsmParams = new URLSearchParams({
      user: netgsmUser,
      password: netgsmPassword,
      tel1: tel1,
      tel2: tel2,
      header: netgsmHeader,
      surre: "1800", // 30 dk arama sınırı
    });

    const netgsmUrl = `https://api.netgsm.com.tr/voice/clicktocall?${netgsmParams.toString()}`;
    const netgsmResponse = await fetch(netgsmUrl, { method: "GET" });
    const responseText = await netgsmResponse.text();

    console.log("Netgsm API Yanıtı:", responseText);

    // Netgsm başarılı işlem yanıtı "00" ile başlar (Örn: "00 48192841")
    if (!responseText.startsWith("00")) {
      return res.status(502).json({ error: `Netgsm API Hatası: ${responseText}` });
    }

    const netgsmJobId = responseText.split(" ")[1] || "success";

    // Krediyi düşür
    const newBalance = currentBalance - CALL_INITIATION_COST;
    await client.execute({
      sql: "UPDATE users SET balance = ? WHERE id = ?",
      args: [newBalance, agentId],
    });

    // Log kaydet
    const logId = Math.random().toString(36).substring(2, 11);
    await client.execute({
      sql: "INSERT INTO credit_logs (id, user_id, amount, transaction_type, description) VALUES (?, ?, ?, ?, ?)",
      args: [logId, agentId, -CALL_INITIATION_COST, "call_deduction", `${customerPhone} nolu telefona Netgsm araması başlatıldı`],
    });

    return res.status(200).json({
      success: true,
      jobId: netgsmJobId,
      balance: newBalance,
      message: "Netgsm araması tetiklendi. Önce telefonunuz çalacaktır.",
    });

  } catch (error) {
    console.error("Netgsm arama API hatası:", error);
    return res.status(500).json({ error: "Sunucu hatası nedeniyle arama tetiklenemedi." });
  }
}
