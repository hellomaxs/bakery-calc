// Резервная копия базы ЖИТО-СИТО в Vercel Blob.
//   GET  /api/base  — вернуть последнюю сохранённую базу (JSON)
//   POST /api/base  — сохранить базу (заголовок x-base-key)
// Каждый бэкап пишется под уникальным именем (base/db-<rand>.json), читаем
// самый свежий — так CDN-кеш стабильного URL не отдаёт устаревшее.
import { put, list, del } from "@vercel/blob";

const PREFIX = "base/db";

function newest(blobs) {
  return blobs.slice().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-base-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    try {
      const { blobs } = await list({ prefix: PREFIX });
      if (!blobs.length) return res.status(404).json({ error: "no backup" });
      const url = newest(blobs)[0].url;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return res.status(404).json({ error: "no backup" });
      const data = await r.json();
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: String((e && e.message) || e) });
    }
  }

  if (req.method === "POST") {
    const given = String(req.headers["x-base-key"] || "").trim();
    const expected = String(process.env.BASE_KEY || "").trim();
    if (!expected || given !== expected) return res.status(401).json({ error: "unauthorized" });

    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
    if (!body || !Array.isArray(body.materials) || !Array.isArray(body.products) || body.products.length === 0) {
      return res.status(400).json({ error: "bad data" });
    }
    const SEED = ["Пиріжок з родзинками", "Какао на молоці", "Пирожок с изюмом", "Какао на молоке"];
    if (body.settings && body.settings.demo) return res.status(409).json({ error: "demo, ignored" });
    if (body.products.length <= 2 && body.products.every(p => SEED.includes(p.name))) {
      return res.status(409).json({ error: "looks like demo, ignored" });
    }
    try {
      await put(PREFIX + ".json", JSON.stringify(body), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: true,   // уникальное имя -> всегда свежий URL
        cacheControlMaxAge: 0,
      });
      // чистим старые копии, оставляем 3 последних
      try {
        const { blobs } = await list({ prefix: PREFIX });
        const old = newest(blobs).slice(3).map(b => b.url);
        if (old.length) await del(old);
      } catch (e) { /* не критично */ }
      return res.status(200).json({ ok: true, products: body.products.length, materials: body.materials.length });
    } catch (e) {
      return res.status(500).json({ error: String((e && e.message) || e) });
    }
  }

  return res.status(405).json({ error: "method not allowed" });
}
