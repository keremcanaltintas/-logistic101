import { createClient } from "@libsql/client/web";

export default async function handler(req, res) {
  // Sadece POST isteklerini kabul et (Güvenlik için)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST metodu kabul edilir' });
  }

  // Turso'ya bağlan
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Frontend'den gelen veriyi al (Örn: { "urunAdi": "Tişört", "sku": "TS-01", "stok": 50 })
    const { urunAdi, sku, stok } = req.body;

    // Veritabanına kaydet (SQL Sorgusu)
    // Not: Öncesinde Turso'da 'urunler' adında bir tablonun olması gerekir.
    const result = await client.execute({
      sql: "INSERT INTO urunler (urun_adi, sku, stok) VALUES (?, ?, ?)",
      args: [urunAdi, sku, stok],
    });

    // Başarı mesajı döndür
    res.status(200).json({ message: 'Ürün başarıyla eklendi!', data: result });
    
  } catch (error) {
    console.error("Veritabanı Hatası:", error);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
  }
}