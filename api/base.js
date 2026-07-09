// Резервная копия базы ЖИТО-СИТО в Vercel Blob.
//   GET  /api/base       — вернуть последнюю сохранённую базу (JSON)
//   POST /api/base       — сохранить базу (нужен заголовок x-base-key)
import { put, head } from "@vercel/blob";

const PATH = "base.json";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-base-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    try {
      const info = await head(PATH).catch(() => null);
      if (!info) return res.status(404).json({ error: "no backup" });
      const r = await fetch(info.url, { cache: "no-store" });
      if (!r.ok) return res.status(404).json({ error: "no backup" });
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: String((e && e.message) || e) });
    }
  }

  if (req.method === "POST") {
    const given = String(req.headers["x-base-key"] || "").trim();
    const expected = String(process.env.BASE_KEY || "").trim();
    if (!expected || given !== expected) {
      return res.status(401).json({ error: "unauthorized" });
    }
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
    if (!body || !Array.isArray(body.materials) || !Array.isArray(body.products) || body.products.length === 0) {
      return res.status(400).json({ error: "bad data" });
    }
    try {
      await put(PATH, JSON.stringify(body), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return res.status(200).json({ ok: true, products: body.products.length, materials: body.materials.length });
    } catch (e) {
      return res.status(500).json({ error: String((e && e.message) || e) });
    }
  }

  return res.status(405).json({ error: "method not allowed" });
}
