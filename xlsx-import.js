"use strict";

/* Импорт калькуляционных карт из Excel.
   Ожидаемый формат листа (как в «Калькуляційні карти»):
   - строки-разделы: НАПОЇ / ЗАКУСКИ / ПОЛУФАБРИКАТИ / ВИПІЧКА ПЕЧЕНА / ВИПІЧКА СМАЖЕНА
   - заголовок изделия: «Название — вихід: 120» (или «выход:»)
   - строки состава: № | Код | Найменування | Од. | Брутто | Нетто | Ціна | Сума
   Компонент с ценой в колонке «Ціна» задаёт цену сырья за единицу.
   Полуфабрикаты (раздел Н/Ф) подставляются в изделия как вложенные тех карты. */

function parseCalcCards(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const sectionOf = line => {
    const u = line.toUpperCase();
    if (!/^[^a-zа-яёіїє]*[А-ЯЁІЇЄA-Z\s\/()]+$/.test(line) && !u.includes("КАЛЬКУЛЯЦ")) { /* keep permissive */ }
    if (u.includes("СМАЖ") || u.includes("ЖАРЕН")) return ["fried", true];
    if (u.includes("НАПО") || u.includes("НАПИ")) return ["drinks", true];
    if (u.includes("ЗАКУС")) return ["snacks", true];
    if (u.includes("ПОЛУФАБ") || u.includes("НАПІВФАБ") || /(^|\s)Н\/Ф/.test(u)) return ["nf", false];
    if (u.includes("ВИПІЧКА") || u.includes("ВЫПЕЧК") || u.includes("ПЕЧЕН")) return ["bakery", true];
    return null;
  };

  const normName = s => String(s).toLowerCase()
    .replace(/[(),.]/g, " ")
    .split(/\s+/)
    .filter(w => w && !["н/ф", "п/ф", "нф", "пф", "нездібне"].includes(w))
    .sort().join(" ");

  const parseYield = text => {
    const t = String(text).trim();
    if (t === "кг") return [null, null];
    if (t === "шт") return [1, "шт"];
    const head = t.split("(")[0];
    const nums = head.match(/[\d.,]+/g);
    if (!nums) return [null, null];
    const unit = t.includes("мл") ? "мл" : "г";
    const qty = head.includes("/")
      ? nums.reduce((s, n) => s + parseFloat(n.replace(",", ".")), 0)
      : parseFloat(nums[0].replace(",", "."));
    return [qty > 0 ? qty : null, qty > 0 ? unit : null];
  };

  const products = [];
  let curSection = null, curProduct = null, counter = 0;

  for (const r of rows) {
    const c0 = r[0];
    const nameCell = c0 == null ? "" : String(c0).trim();
    if (!nameCell && typeof c0 !== "number") continue;

    const isComp = typeof c0 === "number" && r[2] != null;
    if (isComp && curProduct) {
      curProduct.rawComps.push({
        code: r[1] == null ? null : String(typeof r[1] === "number" ? Math.round(r[1]) : r[1]).trim(),
        name: String(r[2]).trim(),
        unit: r[3] ? String(r[3]).trim() : "г",
        brutto: Number(r[4]) || 0,
        netto: r[5] == null || r[5] === "" ? null : Number(r[5]),
        price: r[6] == null || r[6] === "" ? null : Number(r[6]),
      });
      continue;
    }

    const m = nameCell.match(/^(.*?)\s+[—–-]+\s+(?:вихід|выход)\s*:\s*(.+)$/i);
    if (m && curSection) {
      counter++;
      const [qty, unit] = parseYield(m[2]);
      curProduct = {
        id: "p_" + String(counter).padStart(3, "0"),
        name: m[1].trim(), category: curSection[0], onDisplay: curSection[1],
        yieldQty: qty, yieldUnit: unit, rawComps: [],
      };
      products.push(curProduct);
      continue;
    }

    const sec = nameCell && !m ? sectionOf(nameCell) : null;
    if (sec) { curSection = sec; curProduct = null; }
  }

  if (!products.length) throw new Error("no products");

  /* --- материалы --- */
  const CONV = { "г>кг": 0.001, "мл>л": 0.001, "кг>г": 1000, "л>мл": 1000 };
  const conv = (from, to) => (from === to ? 1 : CONV[from + ">" + to] || null);
  const prodByNorm = {};
  for (const p of products) if (p.category === "nf") prodByNorm[normName(p.name)] = p;

  const matKey = c => (c.code ? c.code : "n_" + normName(c.name));
  const mid = key => "m_" + key.replace(/[^a-z0-9а-яёіїє]+/gi, "_").slice(0, 40);
  const materials = {};

  for (const p of products) {
    for (const c of p.rawComps) {
      if (prodByNorm[normName(c.name)]) continue;
      const key = matKey(c);
      if (!materials[key]) {
        materials[key] = { id: mid(key), code: c.code || "", name: c.name, unit: c.unit, packQty: 1, packPrice: 0 };
      }
      if (!materials[key].code && c.code) materials[key].code = c.code;
      if (c.price > 0 && !(materials[key].packPrice > 0)) {
        materials[key].packQty = 1;
        materials[key].packPrice = c.price;
      }
    }
  }

  /* слияние дублей (Цукор г <-> Цукор кг): цель — позиция с кодом */
  const merged = {}; // key -> [targetKey, factor]
  const byNorm = {};
  for (const key in materials) (byNorm[normName(materials[key].name)] ??= []).push(key);
  for (const n in byNorm) {
    const keys = byNorm[n];
    if (keys.length < 2) continue;
    const target = keys.find(k => !k.startsWith("n_"));
    if (!target) continue;
    for (const k of keys) {
      if (k === target) continue;
      const f = conv(materials[k].unit, materials[target].unit);
      if (f != null) merged[k] = [target, f];
    }
  }
  for (const k in merged) delete materials[k];

  /* --- сборка компонентов --- */
  for (const p of products) {
    p.components = p.rawComps.map(c => {
      const sub = prodByNorm[normName(c.name)];
      if (sub && sub.id !== p.id) {
        const subUnit = sub.yieldUnit || "г"; // авто-выход считается в граммах
        let f = conv(c.unit, subUnit);
        if (f == null) f = 1;
        if (subUnit === "шт") {
          // нетто штучного н/ф в исходнике — вес в кг -> граммы
          return { productId: sub.id, brutto: c.brutto, netto: c.netto != null ? round4(c.netto * 1000) : 0 };
        }
        return {
          productId: sub.id,
          brutto: round4(c.brutto * f),
          netto: c.netto != null ? round4(c.netto * f) : round4(c.brutto * f),
        };
      }
      let key = matKey(c), f = 1;
      if (merged[key]) [key, f] = merged[key];
      const mat = materials[key];
      if (mat.unit === "шт") {
        return { materialId: mat.id, brutto: c.brutto, netto: c.netto != null ? round4(c.netto * 1000) : 0 };
      }
      return {
        materialId: mat.id,
        brutto: round4(c.brutto * f),
        netto: c.netto != null ? round4(c.netto * f) : round4(c.brutto * f),
      };
    });
    delete p.rawComps;
  }

  return {
    materials: Object.values(materials).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase(), "uk")),
    products: products.map(p => ({
      id: p.id, name: p.name, category: p.category, photo: null,
      markup: 200, onDisplay: p.onDisplay,
      yieldQty: p.yieldQty, yieldUnit: p.yieldUnit,
      components: p.components,
    })),
  };
}

function round4(n) { return Math.round(n * 10000) / 10000; }

window.parseCalcCards = parseCalcCards;
