// Генерация фото изделия через OpenAI gpt-image-2, кеш в Vercel Blob.
//   POST /api/photo  { name, category }  ->  { url }
import { head, put } from "@vercel/blob";
import sharp from "sharp";

function keyFor(name, category) {
  const s = (category || "") + "|" + (name || "");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return "photos/v4/" + h.toString(36) + ".jpg";
}

function buildPrompt(name, category, ingredients, hasRef) {
  const ing = (ingredients || []).filter(Boolean).slice(0, 12).join(", ");
  const hint = ing
    ? ` Components to reflect where naturally visible (filling, toppings, inclusions, dusting, glaze): ${ing}.`
    : "";
  const ref = hasRef
    ? `Use the provided reference photo as the ground truth for this product's real shape, colour, size, toppings and filling — keep them faithful. `
    : "";
  const framing =
    ` Medium/wide shot with the food kept small-to-medium in the frame and centered, ` +
    `with generous empty margin and plenty of wooden board visible around it on all sides; ` +
    `do NOT fill the frame edge-to-edge; the entire item must be fully visible and not cropped, ` +
    `arranged compactly near the center so that even a centered square crop still shows a complete item.`;
  if (category === "drinks") {
    return (
      ref +
      `High quality natural photograph of a freshly served "${name}" drink in a nice cup or glass ` +
      `on a natural brown wooden board, warm cozy bakery lighting, 45-degree angle, ` +
      `vertical portrait composition, appetizing, realistic professional food photography, ` +
      `shallow depth of field, no text, no hands, no labels.${hint}${framing}`
    );
  }
  return (
    ref +
    `High quality natural photograph of a Ukrainian bakery item "${name}". ` +
    `On one vertical photo place TWO pieces close together near the center on a natural brown wooden board: ` +
    `(1) one whole "${name}", and (2) one half of it broken open with the torn cross-section ` +
    `and inside/filling facing the viewer to reveal the texture and filling.${hint} ` +
    `Warm cozy bakery lighting, 45-degree isometric angle showing the whole items, ` +
    `vertical portrait composition, appetizing, realistic professional food photography, ` +
    `shallow depth of field, no text, no hands, no labels, no packaging.${framing}`
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
  const ingredients = body && Array.isArray(body.ingredients) ? body.ingredients : [];
  const force = body && body.force === true;
  const image = body && typeof body.image === "string" && body.image.startsWith("data:") ? body.image : null;
  if (!name) return res.status(400).json({ error: "no name" });

  const path = keyFor(name, category);

  // если есть референс-фото пользователя — всегда генерим заново по нему;
  // без референса и без force — отдаём из кеша
  if (!image && !force) {
    const existing = await head(path).catch(() => null);
    if (existing) return res.status(200).json({ url: existing.url, cached: true });
  }

  const KEY = String(process.env.OPENAI_API_KEY || "").trim();
  if (!KEY) return res.status(500).json({ error: "no OPENAI_API_KEY" });

  const prompt = buildPrompt(name, category, ingredients, !!image);
  try {
    let r;
    if (image) {
      // image-to-image: фото пользователя как референс + текстовый промпт (images/edits)
      const mm = image.match(/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/);
      const mime = mm ? mm[1] : "image/jpeg";
      const buf = Buffer.from(mm ? mm[2] : "", "base64");
      const form = new FormData();
      form.append("model", "gpt-image-2");
      form.append("prompt", prompt);
      form.append("size", "1024x1536");
      form.append("quality", "medium");
      form.append("image", new Blob([buf], { type: mime }), "src." + (mime.split("/")[1] || "jpg"));
      r = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form,
      });
    } else {
      r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model: "gpt-image-2", prompt, size: "1024x1536", quality: "medium", n: 1 }),
      });
    }
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || "openai error" });

    const png = Buffer.from(j.data[0].b64_json, "base64");
    const jpg = await sharp(png).resize(768, 1152, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
    const blob = await put(path, jpg, {
      access: "public", contentType: "image/jpeg", addRandomSuffix: false, allowOverwrite: true,
    });
    // при перегенерации / по референсу меняем URL (?t=), чтобы <img> обновился
    return res.status(200).json({ url: (force || image) ? blob.url + "?t=" + Date.now() : blob.url });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
