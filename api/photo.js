// Генерация фото изделия через OpenAI gpt-image-2, кеш в Vercel Blob.
//   POST /api/photo  { name, category }  ->  { url }
import { head, put } from "@vercel/blob";
import sharp from "sharp";

function keyFor(name, category) {
  const s = (category || "") + "|" + (name || "");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return "photos/v2/" + h.toString(36) + ".jpg";
}

function buildPrompt(name, category) {
  const subject = category === "drinks"
    ? `a freshly served "${name}" drink in a nice cup or glass`
    : `a single freshly baked "${name}" (Ukrainian bakery / pastry item)`;
  return (
    `High quality natural photograph of ${subject}, ` +
    `on a natural brown wooden board / cutting board, warm cozy bakery lighting, ` +
    `shot from a 45-degree isometric angle showing the whole item, ` +
    `vertical portrait composition, appetizing, professional food photography, ` +
    `shallow depth of field, realistic, no text, no hands, no labels, no packaging.`
  );
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const name = body && String(body.name || "").trim();
  const category = body && String(body.category || "").trim();
  if (!name) return res.status(400).json({ error: "no name" });

  const path = keyFor(name, category);

  // уже сгенерировано — отдаём из кеша
  const existing = await head(path).catch(() => null);
  if (existing) return res.status(200).json({ url: existing.url, cached: true });

  const KEY = String(process.env.OPENAI_API_KEY || "").trim();
  if (!KEY) return res.status(500).json({ error: "no OPENAI_API_KEY" });

  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: "gpt-image-2", prompt: buildPrompt(name, category), size: "1024x1536", quality: "medium", n: 1 }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || "openai error" });

    const png = Buffer.from(j.data[0].b64_json, "base64");
    const jpg = await sharp(png).resize(768, 1152, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
    const blob = await put(path, jpg, {
      access: "public", contentType: "image/jpeg", addRandomSuffix: false, allowOverwrite: true,
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
