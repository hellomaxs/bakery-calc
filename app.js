"use strict";

/* ================== Хранилище ================== */
const LS_KEY = "bakeryCalc:v1";

const state = {
  data: { settings: { currency: "₴" }, materials: [], products: [] },
  tab: "vitrina",
  vitrinaFilter: "all",
  cardsFilter: "all",
  cardsSearch: "",
  stockFilter: "all",
  stockSearch: "",
};

/* Категории изделий */
const CATEGORIES = [
  { id: "bakery", label: "Випічка" },
  { id: "fried", label: "Смажене" },
  { id: "snacks", label: "Закуски" },
  { id: "drinks", label: "Напої" },
  { id: "nf", label: "Напівфабрикати" },
];
function catLabel(id) {
  const c = CATEGORIES.find(c => c.id === id);
  return c ? c.label : id;
}

/* Иконки категорий изделий: контур (для чипов) + круглый бейдж (для PDF-меню) */
const CAT_GLYPHS = {
  bakery: `<path d="M4 13c-1.2-.6-2-1.5-2-2.8C2 7.5 6.5 5 12 5s10 2.5 10 5.2c0 1.3-.8 2.2-2 2.8"/><path d="M4 13c0 3 3.6 6 8 6s8-3 8-6"/><path d="M9 8.5v3M12 8v3.5M15 8.5v3"/>`,
  fried: `<ellipse cx="10" cy="12" rx="7.5" ry="4.5"/><path d="M17.2 10.5l4.8-2.2"/>`,
  snacks: `<path d="M4 10a8 4 0 0 1 16 0H4z"/><path d="M4 13h16"/><path d="M5 16h14a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/>`,
  drinks: `<path d="M17 8h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z"/><path d="M8 2.5c0 1-.8 1-.8 2s.8 1 .8 2M12 2.5c0 1-.8 1-.8 2s.8 1 .8 2"/>`,
  nf: `<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>`,
};
function catLineIcon(id) {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CAT_GLYPHS[id] || ""}</svg>`;
}
function catBadgeSvg(id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26.5" fill="#6B3F1D" stroke="#E9C08A" stroke-width="2"/><g fill="none" stroke="#F3E3C3" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" transform="translate(11 11) scale(1.4)">${CAT_GLYPHS[id] || ""}</g></svg>`;
}
window.catBadgeSvg = catBadgeSvg;

/* Группы сырья на складе */
const MAT_GROUPS = [
  { id: "dairy", label: "Молочка" },
  { id: "sprinkle", label: "Посипки" },
  { id: "meat", label: "М’ясо" },
  { id: "veg", label: "Овочі" },
  { id: "fruit", label: "Фрукти" },
  { id: "topping", label: "Топінги" },
  { id: "greens", label: "Зелень" },
  { id: "eggs", label: "Яйця" },
  { id: "pack", label: "Посуд/упаковка" },
  { id: "grocery", label: "Бакалія" },
];

const GROUP_ICONS = {
  all: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>`,
  dairy: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10 2h4v4l2 4v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-4V2z"/><path d="M8 14h8"/></svg>`,
  sprinkle: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l1.4 3.1L16.5 7.5l-3.1 1.4L12 12l-1.4-3.1L7.5 7.5l3.1-1.4L12 3z"/><path d="M5 15v3M3.5 16.5h3M18 15v4M16 17h4"/></svg>`,
  meat: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.4 15.6a5.5 5.5 0 1 0-7.8-7.8c-1.6 1.6-1.9 4.3-.6 6.4l-2.7 2.7a2 2 0 1 0 2.8 2.8l2.7-2.7c2.1 1.3 4 1.2 5.6-1.4z"/></svg>`,
  veg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l2-6 8-8a3.5 3.5 0 0 1 5 5l-8 8-6 2-1-1z"/><path d="M14 4l3-2M17 7l3-2"/></svg>`,
  fruit: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 8c-3-2-7 0-7 4.5 0 4 3 8.5 5 8.5 1 0 1.5-.6 2-.6s1 .6 2 .6c2 0 5-4.5 5-8.5C19 8 15 6 12 8z"/><path d="M12 8c0-2.5 1.5-4.5 3.5-5"/></svg>`,
  topping: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3s6.5 7.5 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.5 12 3 12 3z"/></svg>`,
  greens: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20C6 8 13 4 21 4c-.5 8-4 15-15 15"/><path d="M4 20c2-5 5-8 9-11"/></svg>`,
  nf: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>`,
  eggs: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c3.5 0 6.5 5.5 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.5 8.5 3 12 3z"/></svg>`,
  grocery: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1.5 12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`,
  pack: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14"/><path d="M6 8l1.6 13h8.8L18 8"/><path d="M5 8l1-3.5h12L19 8"/></svg>`,
};

/* Автоопределение группы по названию (укр/рус). Порядок проверки важен. */
const GROUP_KEYWORDS = [
  ["eggs", ["яйц", "яйце", "меланж"]],
  ["pack", ["стакан", "кришк", "крышк", "упаковк", "пакет", "коробк", "лоток", "серветк", "салфетк", "трубочк", "соломинк", "посуд", "контейнер", "плівк", "пленк", "фольг", "пергамент", "кульок", "тарілк", "тарелк", "вилк", "ложк", "паличк", "шпажк", "етикетк", "этикетк", "наклейк"], ["пакетик"]],
  ["greens", ["зелен", "укроп", "кріп", "петруш", "базилік", "базилик", "тимьян", "тим'ян", "руккол", "шпинат"]],
  ["topping", ["соус", "кетчуп", "майонез", "гірчиц", "горчиц", "повидл", "варення", "джем", "топинг", "топпинг", "згущ", "сгущ", "мед", "карамел", "заправка", "начинк", "сироп"]],
  ["meat", ["свинин", "говяд", "ялович", "куряч", "курин", "філе", "филе", "бедр", "ковб", "колбас", "сосиск", "бекон", "шинка", "ветчин", "м'яс", "мясо", "фарш", "нагетс"]],
  ["dairy", ["молок", "молоч", "вершк", "сливоч", "сметан", "творог", "творож", "моцарел", "кефір", "кефир", "йогурт", "маргарин", "сир"]],
  ["sprinkle", ["кунжут", "мак ", "маков", "кранч", "пудра", "слайс", "горіх", "орех", "семя", "насіння", "посипк", "посыпк", "стружк", "мигдал", "миндал"]],
  ["fruit", ["яблу", "яблок", "лимон", "апельсин", "банан", "родзинк", "изюм", "ягід", "ягод", "фрукт", "вишн", "полуниц", "клубник"]],
  ["veg", ["картоп", "картоф", "капуст", "цибул", "лук", "морков", "морква", "огір", "огур", "томат", "помідор", "помидор", "часник", "чеснок", "печериц", "шампиньон", "гриб", "кукурудз", "кукуруз", "буряк", "свекл", "кабач"]],
];
function classifyMaterial(name) {
  const n = String(name || "").toLowerCase();
  for (const [group, words, exclude] of GROUP_KEYWORDS) {
    if (exclude && exclude.some(w => n.includes(w))) continue;
    if (words.some(w => n.includes(w))) return group;
  }
  return "grocery";
}
function matGroup(m) { return m.group || classifyMaterial(m.name); }
function ensureGroups(data) {
  let changed = false;
  for (const m of data.materials) {
    if (!m.group) { m.group = classifyMaterial(m.name); changed = true; }
  }
  return changed;
}

/* Актуальная база: сначала облачная резервная копия (/api/base), затем
   встроенная в деплой data.json. null — если ничего нет (офлайн/Pages). */
async function fetchBase() {
  for (const url of ["/api/base", "data.json"]) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.materials) && Array.isArray(d.products)) return d;
      }
    } catch (e) { /* пробуем следующий источник */ }
  }
  return null;
}
function applyBase(d) {
  state.data = d;
  if (!state.data.settings) state.data.settings = { currency: "₴" };
  delete state.data.settings.demo;
  ensureGroups(state.data);
  save();
}

/* Похоже на демо/пустую базу (в т.ч. сохранённую до появления флага demo) —
   тогда её можно заменить реальной базой без риска затереть данные пользователя. */
const SEED_NAMES = ["Пиріжок з родзинками", "Какао на молоці", "Пирожок с изюмом", "Какао на молоке"];
function looksLikeDemo(d) {
  if (!d || !Array.isArray(d.products)) return true;
  if (d.products.length === 0) return true;
  if (d.products.length <= 2 && d.products.every(p => SEED_NAMES.includes(p.name))) return true;
  return false;
}

async function load() {
  let stored = null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch (e) { /* повреждённые данные */ }

  if (stored && Array.isArray(stored.products) && Array.isArray(stored.materials)) {
    state.data = stored;
    if (!state.data.settings) state.data.settings = { currency: "₴" };
    let changed = ensureGroups(state.data);
    // v2 групп: посуда/упаковка
    if ((state.data.settings.groupsVer || 1) < 2) {
      for (const m of state.data.materials) {
        if (m.group === "grocery" && classifyMaterial(m.name) === "pack") m.group = "pack";
      }
      state.data.settings.groupsVer = 2; changed = true;
    }
    // v2 UI: украинский + гривня
    if ((state.data.settings.uiVer || 1) < 2) {
      state.data.settings.currency = "₴"; state.data.settings.uiVer = 2; changed = true;
    }
    // если на устройстве осталась только демо/пустая база — подтягиваем реальную
    if (state.data.settings.demo || looksLikeDemo(state.data)) {
      const base = await fetchBase();
      if (base) { applyBase(base); maybeBackup(); return; }
    }
    if (changed) save();
    maybeBackup();
    return;
  }

  // первый запуск / очищенный кеш: тянем актуальную базу
  const base = await fetchBase();
  if (base) { applyBase(base); maybeBackup(); return; }
  state.data = seedData(); save();  // офлайн-фолбэк — демо
}

/* Ежедневная резервная копия базы на Vercel (/api/base). Пишется не чаще
   раза в сутки при открытии; только реальные данные (не демо). */
const BACKUP_INTERVAL = 20 * 60 * 60 * 1000; // ~1 раз в сутки
function maybeBackup() {
  try {
    const s = state.data.settings || {};
    if (s.demo || looksLikeDemo(state.data)) return;  // демо/пустое не бэкапим
    const now = Date.now();
    if (s.lastBackup && now - s.lastBackup < BACKUP_INTERVAL) return;
    fetch("/api/base", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-base-key": "zs_9f3b7a2e1c8d4056k" },
      body: JSON.stringify(state.data),
    }).then(r => {
      if (r.ok) { state.data.settings.lastBackup = now; save(); }
    }).catch(() => { /* нет сети/эндпоинта — тихо пропускаем */ });
  } catch (e) { /* игнор */ }
}
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.data));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function seedData() {
  const m = (name, unit, packQty, packPrice) => ({ id: uid(), name, unit, packQty, packPrice });
  const mats = {
    flour: m("Борошно пшеничне в/г", "г", 1000, 60),
    sugar: m("Цукор", "г", 1000, 75),
    butter: m("Масло вершкове 82,5%", "г", 500, 320),
    yeast: m("Дріжджі пресовані", "г", 100, 90),
    milk: m("Молоко 3,2%", "мл", 1000, 85),
    raisin: m("Родзинки", "г", 500, 180),
    egg: m("Яйце куряче С1", "шт", 10, 120),
    salt: m("Сіль", "г", 1000, 25),
    cocoa: m("Какао-порошок", "г", 250, 210),
  };
  const c = (mat, brutto, netto) => ({ materialId: mat.id, brutto, netto });
  return {
    settings: { currency: "₴", demo: true },
    materials: Object.values(mats),
    products: [
      {
        id: uid(), name: "Пиріжок з родзинками", category: "bakery", photo: null,
        markup: 200, onDisplay: true, yieldQty: null, yieldUnit: null,
        components: [
          c(mats.flour, 55, 55), c(mats.sugar, 8, 8), c(mats.butter, 10, 10),
          c(mats.yeast, 2, 2), c(mats.milk, 25, 20), c(mats.raisin, 15, 15),
          c(mats.egg, 0.2, 10), c(mats.salt, 1, 1),
        ],
      },
      {
        id: uid(), name: "Какао на молоці", category: "drinks", photo: null,
        markup: 250, onDisplay: true, yieldQty: null, yieldUnit: null,
        components: [c(mats.milk, 200, 200), c(mats.cocoa, 15, 15), c(mats.sugar, 12, 12)],
      },
    ],
  };
}

/* ================== Расчёты ================== */
function matById(id) { return state.data.materials.find(m => m.id === id); }
function productById(id) { return state.data.products.find(p => p.id === id); }

function unitPrice(mat) {
  if (!mat || !mat.packQty) return 0;
  return mat.packPrice / mat.packQty;
}

/* Компонент может ссылаться на сырьё (materialId) или на другое изделие/полуфабрикат (productId).
   stack — защита от циклов (изделие внутри самого себя). */
function compRef(comp, stack) {
  if (comp.productId) {
    const p = productById(comp.productId);
    if (!p) return null;
    const y = prodYield(p, stack);
    return { kind: "product", name: p.name, unit: y.unit, unitPrice: prodUnitCost(p, stack) };
  }
  const mat = matById(comp.materialId);
  if (!mat) return null;
  return { kind: "material", name: mat.name, unit: mat.unit, unitPrice: unitPrice(mat) };
}

/* Для штучных компонентов нетто хранится в граммах (вес одной порции в изделии) */
function compNetto(comp, stack) {
  const ref = compRef(comp, stack);
  if (comp.netto != null && comp.netto !== "") return Number(comp.netto);
  if (ref && ref.unit === "шт") return 0;
  return Number(comp.brutto) || 0;
}
function compCost(comp, stack) {
  const ref = compRef(comp, stack);
  if (!ref) return 0;
  return (Number(comp.brutto) || 0) * ref.unitPrice;
}
function productCost(p, stack) {
  stack = stack || new Set();
  if (stack.has(p.id)) return 0; // цикл: изделие ссылается само на себя
  stack.add(p.id);
  const sum = p.components.reduce((s, comp) => s + compCost(comp, stack), 0);
  stack.delete(p.id);
  return sum;
}

/* Выход изделия: явный (yieldQty/yieldUnit) или автоматически из суммы нетто.
   Всё весовое нормализуется в граммы (кг ×1000), объёмное — в мл (л ×1000). */
function prodYield(p, stack) {
  if (p.yieldQty > 0) return { qty: Number(p.yieldQty), unit: p.yieldUnit || "г" };
  stack = stack || new Set();
  if (stack.has(p.id)) return { qty: 0, unit: "г" };
  stack.add(p.id);
  let g = 0, ml = 0;
  for (const comp of p.components) {
    const ref = compRef(comp, stack);
    if (!ref) continue;
    const n = compNetto(comp, stack);
    if (ref.unit === "г" || ref.unit === "шт") g += n;
    else if (ref.unit === "кг") g += n * 1000;
    else if (ref.unit === "мл") ml += n;
    else if (ref.unit === "л") ml += n * 1000;
  }
  stack.delete(p.id);
  const total = g + ml;
  return { qty: total, unit: ml > g ? "мл" : "г" };
}
function productWeight(p) {
  const y = prodYield(p);
  return { value: y.qty, unit: y.unit };
}
/* Цена изделия за единицу его выхода — для использования как полуфабриката */
function prodUnitCost(p, stack) {
  const y = prodYield(p, stack);
  if (!y.qty) return 0;
  return productCost(p, stack) / y.qty;
}
function salePrice(p) {
  return Math.ceil(productCost(p) * (1 + (Number(p.markup) || 0) / 100));
}

/* ================== Форматирование ================== */
function cur() { return (state.data.settings && state.data.settings.currency) || "₴"; }
function fmtNum(n, maxDigits = 2) {
  return Number(n || 0).toLocaleString("uk-UA", { maximumFractionDigits: maxDigits });
}
function fmtMoney(n) { return fmtNum(n, 2) + " " + cur(); }
function fmtPerUnit(price, unit) {
  const digits = price > 0 && price < 0.1 ? 4 : 2;
  return fmtNum(price, digits) + " " + cur() + "/" + unit;
}
function fmtUnitPrice(mat) { return fmtPerUnit(unitPrice(mat), mat.unit); }
function fmtYield(y) {
  if (y.unit === "г" && y.qty >= 1000) return fmtNum(y.qty / 1000, 2) + " кг";
  if (y.unit === "мл" && y.qty >= 1000) return fmtNum(y.qty / 1000, 2) + " л";
  return fmtNum(y.qty, 0) + " " + y.unit;
}
function parseNum(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

/* ================== Иконки-заглушки ================== */
function placeholderSvg(category, size) {
  if (category === "drinks") {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z"/><path d="M8 2.5c0 1-.8 1-.8 2s.8 1 .8 2M12 2.5c0 1-.8 1-.8 2s.8 1 .8 2"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13c-1.2-.6-2-1.5-2-2.8C2 7.5 6.5 5 12 5s10 2.5 10 5.2c0 1.3-.8 2.2-2 2.8"/><path d="M4 13c0 3 3.6 6 8 6s8-3 8-6"/><path d="M9 8.5v3M12 8v3.5M15 8.5v3"/></svg>`;
}

/* ================== Тосты ================== */
function toast(msg) {
  const root = document.getElementById("toastRoot");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

/* ================== Шторки ================== */
function openSheet(innerHtml) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${innerHtml}</div>`;
  overlay.addEventListener("click", e => { if (e.target === overlay) closeSheet(overlay); });
  overlay.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => closeSheet(overlay)));
  document.getElementById("sheetRoot").appendChild(overlay);
  document.body.style.overflow = "hidden";
  return overlay;
}
function closeSheet(overlay) {
  overlay.remove();
  if (!document.querySelector(".overlay")) document.body.style.overflow = "";
}
const closeBtnHtml = `<button class="btn-icon subtle" data-close aria-label="Закрити">
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;

/* ---------- Выбор компонента: поиск + группы + алфавит ---------- */
function openComponentPicker(excludeProductId, onPick) {
  const filters = [{ id: "all", label: "Усі" }, ...MAT_GROUPS.slice(0, 7),
    { id: "nf", label: "Напівфабрикати" }, ...MAT_GROUPS.slice(7)];
  let q = "", group = "all", letter = null;

  const overlay = openSheet(`
    <div class="sheet-header"><h2>Вибір компонента</h2>${closeBtnHtml}</div>
    <div class="sheet-body" style="min-height:min(70dvh,560px)">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input class="input" id="cpSearch" type="search" placeholder="Пошук по складу" autocomplete="off">
      </div>
      <div class="chips" id="cpGroups">
        ${filters.map(f => `<button type="button" class="chip icon-chip ${f.id === "all" ? "is-active" : ""}" data-cp-group="${f.id}">${GROUP_ICONS[f.id] || ""}${f.label}</button>`).join("")}
      </div>
      <div class="alpha" id="cpAlpha"></div>
      <div id="cpList" style="padding-bottom:20px"></div>
    </div>`);
  const $ = sel => overlay.querySelector(sel);

  function allItems() {
    const prods = state.data.products
      .filter(p => p.id !== excludeProductId)
      .map(p => {
        const y = prodYield(p);
        return { kind: "p", id: p.id, name: p.name, icon: GROUP_ICONS.nf, price: prodUnitCost(p), unit: y.unit, isNf: true };
      });
    const mats = state.data.materials.map(m =>
      ({ kind: "m", id: m.id, name: m.name, code: m.code || "", icon: GROUP_ICONS[matGroup(m)] || GROUP_ICONS.grocery, price: unitPrice(m), unit: m.unit, group: matGroup(m) }));
    if (group === "nf") return prods;
    if (group !== "all") return mats.filter(i => i.group === group);
    return [...mats, ...prods];
  }

  function rerender() {
    let items = allItems();
    const query = q.trim().toLowerCase();
    if (query) items = items.filter(i => i.name.toLowerCase().includes(query) || String(i.code || "").toLowerCase().includes(query));
    items.sort((a, b) => a.name.localeCompare(b.name, "uk"));

    const letters = [...new Set(items.map(i => (i.name.trim()[0] || "").toUpperCase()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "uk"));
    if (letter && !letters.includes(letter)) letter = null;
    $("#cpAlpha").innerHTML = letters.map(l =>
      `<button type="button" class="${l === letter ? "is-active" : ""}" data-cp-letter="${esc(l)}">${esc(l)}</button>`).join("");

    if (letter) items = items.filter(i => (i.name.trim()[0] || "").toUpperCase() === letter);

    $("#cpList").innerHTML = items.length
      ? items.map(i => `
          <button type="button" class="cp-item" data-cp-kind="${i.kind}" data-cp-id="${i.id}">
            <span class="ic">${i.icon}</span>
            <span class="nm">${i.code ? `<span class="mcode">${esc(i.code)}</span>` : ""}${esc(i.name)}${i.isNf ? ' <i class="nf">н/ф</i>' : ""}</span>
            <span class="pr">${i.price > 0 ? fmtPerUnit(i.price, i.unit) : "без ціни"}</span>
          </button>`).join("")
      : `<p style="color:var(--text-2);text-align:center;padding:24px 0">Нічого не знайдено</p>`;
  }
  rerender();
  $("#cpSearch").focus();

  $("#cpSearch").addEventListener("input", e => { q = e.target.value; rerender(); });
  $("#cpGroups").addEventListener("click", e => {
    const b = e.target.closest("[data-cp-group]");
    if (!b) return;
    group = b.dataset.cpGroup; letter = null;
    $("#cpGroups").querySelectorAll(".chip").forEach(x => x.classList.toggle("is-active", x === b));
    rerender();
  });
  $("#cpAlpha").addEventListener("click", e => {
    const b = e.target.closest("[data-cp-letter]");
    if (!b) return;
    letter = letter === b.dataset.cpLetter ? null : b.dataset.cpLetter;
    rerender();
  });
  $("#cpList").addEventListener("click", e => {
    const b = e.target.closest("[data-cp-id]");
    if (!b) return;
    closeSheet(overlay);
    onPick(b.dataset.cpKind, b.dataset.cpId);
  });
}

/* ================== Тема ================== */
const sunSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>`;
const moonSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/></svg>`;

function effectiveTheme() {
  const t = state.data.settings.theme;
  if (t === "dark" || t === "light") return t;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme() {
  const t = state.data.settings.theme;
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const btn = document.getElementById("themeToggle");
  btn.innerHTML = effectiveTheme() === "dark" ? sunSvg : moonSvg;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = effectiveTheme() === "dark" ? "#17110C" : "#F7F1E8";
}
document.getElementById("themeToggle").addEventListener("click", () => {
  state.data.settings.theme = effectiveTheme() === "dark" ? "light" : "dark";
  save();
  applyTheme();
});

document.getElementById("printCards").addEventListener("click", () => {
  if (!state.data.products.length) { toast("Немає тех карт для друку"); return; }
  toast("Готую PDF тех карт…");
  loadPdfLibs().then(() => window.exportTechPrint()).catch(() => toast("Немає мережі — спробуйте пізніше"));
});

/* ================== Вкладки ================== */
const TAB_TITLES = { vitrina: "Вітрина", cards: "Тех карти", stock: "Склад сировини" };

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("is-active", b.dataset.tab === tab));
  document.getElementById("pageTitle").textContent = TAB_TITLES[tab];
  const action = document.getElementById("headerAction");
  action.hidden = tab === "vitrina";
  document.getElementById("themeToggle").hidden = tab !== "cards";
  document.getElementById("printCards").hidden = tab !== "cards";
  render();
  document.getElementById("view").scrollTop = 0;
  window.scrollTo(0, 0);
}

function render() {
  const view = document.getElementById("view");
  if (state.tab === "vitrina") view.innerHTML = renderVitrina();
  else if (state.tab === "cards") view.innerHTML = renderCards();
  else view.innerHTML = renderStock();
}

/* ===== v2: генерация фото изделия по кнопке (OpenAI gpt-image-2, вертикальное) ===== */
const photoGenBusy = new Set();
/* Компоненты как подсказка для промпта (начинка/посыпка/включения), без тары */
function productIngredients(p) {
  const names = [];
  for (const c of p.components) {
    if (c.productId) { const sub = productById(c.productId); if (sub) names.push(sub.name); }
    else if (c.materialId) { const m = matById(c.materialId); if (m && matGroup(m) !== "pack") names.push(m.name); }
  }
  return [...new Set(names)];
}
function generatePhoto(id, force) {
  if (photoGenBusy.has(id)) return Promise.resolve(null);
  const p = productById(id);
  if (!p) return Promise.resolve(null);
  photoGenBusy.add(id);
  return fetch("/api/photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: p.name, category: p.category, ingredients: productIngredients(p), force: !!force }),
  })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => {
      if (d && d.url) { p.photo = d.url; save(); maybeBackup(); return d.url; }
      return null;
    })
    .finally(() => photoGenBusy.delete(id));
}

/* ================== Витрина ================== */
function renderVitrina() {
  const filter = state.vitrinaFilter;
  const displayed = state.data.products.filter(p => p.onDisplay);
  const cats = CATEGORIES.filter(c => displayed.some(p => p.category === c.id));
  if (filter !== "all" && !cats.some(c => c.id === filter)) state.vitrinaFilter = "all";
  const items = displayed.filter(p => state.vitrinaFilter === "all" || p.category === state.vitrinaFilter);

  const chips = `
    <div class="chips" role="tablist">
      <button class="chip icon-chip ${state.vitrinaFilter === "all" ? "is-active" : ""}" data-filter="all">${GROUP_ICONS.all}Усі</button>
      ${cats.map(c => `<button class="chip icon-chip ${state.vitrinaFilter === c.id ? "is-active" : ""}" data-filter="${c.id}">${catLineIcon(c.id)}${c.label}</button>`).join("")}
    </div>`;

  if (!items.length) {
    return chips + `
      <div class="empty">
        ${placeholderSvg("bakery", 56)}
        <p>На вітрині поки порожньо.<br>Позначте вироби «На вітрину» у вкладці «Тех карти».</p>
      </div>`;
  }

  const printBtn = `
    <button class="btn ghost small block print-btn" data-print-vitrina>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8V3h10v5"/><path d="M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/></svg>
      ДРУК МЕНЮ
    </button>`;

  return chips + printBtn + `<div class="grid">` + items.map(p => {
    const w = productWeight(p);
    const photo = p.photo
      ? `<img class="photo" src="${p.photo}" alt="${esc(p.name)}">`
      : `<div class="photo-ph" data-photo-ph="${p.id}">${placeholderSvg(p.category, 48)}</div>`;
    return `
      <button class="card" data-open-product="${p.id}">
        ${photo}
        <div class="body">
          <div class="name">${esc(p.name)}</div>
          <div class="meta">
            <span class="price">${fmtNum(salePrice(p), 0)} ${cur()}</span>
            <span class="weight">${fmtYield(w.unit ? { qty: w.value, unit: w.unit } : w)}</span>
          </div>
        </div>
      </button>`;
  }).join("") + `</div>`;
}

const aiIcon = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8L12 3z"/><path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/></svg>`;

function photoInner(p) {
  return p.photo
    ? `<img class="pv-photo" src="${p.photo}" alt="${esc(p.name)}">`
    : `<div class="pv-photo-ph">${placeholderSvg(p.category, 64)}</div>`;
}

function openProductView(id) {
  const p = productById(id);
  if (!p) return;
  const w = prodYield(p);
  const ingredients = p.components.map(comp => {
    const ref = compRef(comp);
    if (!ref) return "";
    return `<div class="ing"><span>${esc(ref.name)}</span><span class="qty">${fmtNum(comp.brutto)} ${ref.unit}</span></div>`;
  }).join("");

  const overlay = openSheet(`
    <div class="sheet-header"><h2>${esc(p.name)}</h2>${closeBtnHtml}</div>
    <div class="sheet-body">
      <div class="pv-photo-wrap" id="pvPhoto">${photoInner(p)}</div>
      <button class="btn ghost small block" id="pvGen" style="margin:10px 0 4px">${aiIcon}<span>${p.photo ? "Оновити AI фото" : "Згенерувати AI фото"}</span></button>
      <div class="pv-meta">
        <span class="price">${fmtNum(salePrice(p), 0)} ${cur()}</span>
        <span class="weight">Вихід: ${fmtYield(w)}</span>
      </div>
      <div class="section-title">Склад (технологічна карта)</div>
      <div class="ingr-list">${ingredients || '<div class="ing"><span>Склад не заповнений</span></div>'}</div>
      <div style="height:20px"></div>
    </div>`);

  const $ = sel => overlay.querySelector(sel);
  $("#pvGen").addEventListener("click", () => {
    const btn = $("#pvGen"), wrap = $("#pvPhoto");
    if (btn.disabled) return;
    const force = !!p.photo;  // фото уже есть -> «Оновити» перегенерирует
    btn.disabled = true;
    wrap.classList.add("gen");
    btn.innerHTML = `<span class="spin"></span><span>Генерую… ~1 хв</span>`;
    generatePhoto(id, force)
      .then(url => {
        if (url) { wrap.innerHTML = photoInner(p); render(); toast("Фото готове"); }
        else toast("Не вдалося згенерувати фото");
      })
      .catch(() => toast("Помилка генерації (потрібен інтернет)"))
      .finally(() => {
        wrap.classList.remove("gen");
        btn.disabled = false;
        btn.innerHTML = `${aiIcon}<span>${p.photo ? "Оновити AI фото" : "Згенерувати AI фото"}</span>`;
      });
  });
}

/* ================== Тех карты ================== */
function cardsListHtml() {
  const q = state.cardsSearch.trim().toLowerCase();
  let items = state.data.products;
  if (state.cardsFilter !== "all") items = items.filter(p => p.category === state.cardsFilter);
  if (q) items = items.filter(p => p.name.toLowerCase().includes(q));
  if (!items.length) {
    return `<div class="empty" style="padding:32px 24px"><p>Нічого не знайдено</p></div>`;
  }
  /* группируем по категориям в порядке CATEGORIES */
  const groups = CATEGORIES.filter(c => items.some(p => p.category === c.id));
  const ungrouped = items.filter(p => !CATEGORIES.some(c => c.id === p.category));

  const renderItem = p => {
    const cost = productCost(p);
    const w = prodYield(p);
    const photo = p.photo
      ? `<img class="thumb" src="${p.photo}" alt="">`
      : `<div class="thumb-ph">${placeholderSvg(p.category, 32)}</div>`;

    const rows = p.components.map(comp => {
      const ref = compRef(comp);
      if (!ref) return "";
      return `<div class="trow">
        <span>${esc(ref.name)}${ref.kind === "product" ? ' <i class="nf">н/ф</i>' : ""}</span>
        <span>${fmtNum(comp.brutto, 3)} ${ref.unit}</span>
        <span>${fmtNum(compNetto(comp), 3)}</span>
        <span>${fmtNum(ref.unitPrice, ref.unitPrice > 0 && ref.unitPrice < 0.1 ? 4 : 2)}</span>
        <span>${fmtNum(compCost(comp), 2)}</span>
      </div>`;
    }).join("");

    return `
      <div class="row-card" style="flex-direction:column">
        <div class="rc-head" style="width:100%" data-edit-product="${p.id}">
          ${photo}
          <div class="main">
            <div class="title">${esc(p.name)}</div>
            <div class="sub">Вихід <b>${fmtYield(w)}</b> · Собів. <b>${fmtMoney(cost)}</b></div>
          </div>
          <label class="switch" data-stop>
            <input type="checkbox" data-toggle-display="${p.id}" ${p.onDisplay ? "checked" : ""} aria-label="Виставити на вітрину">
            <span class="track"></span>
          </label>
        </div>
        <div class="tgrid">
          ${rows || '<p style="color:var(--text-2);font-size:13px;margin:6px 0">Склад не заповнений</p>'}
          <div class="trow total">
            <span>Разом</span>
            <span></span>
            <span>${fmtYield(w)}</span>
            <span></span>
            <span>${fmtNum(cost, 2)}</span>
          </div>
        </div>
        <div class="tc-foot">
          <label class="markup-inline">Націнка
            <input class="input mk" data-markup="${p.id}" inputmode="numeric" value="${Number(p.markup) || 0}" aria-label="Націнка, %"> %
          </label>
          <span class="sale">${fmtNum(salePrice(p), 0)} ${cur()}</span>
        </div>
      </div>`;
  };

  let html = `
    <div class="cols-head">
      <span>Компонент</span><span>Брутто</span><span>Нетто</span><span>Ціна, ${cur()}</span><span>Сума, ${cur()}</span>
    </div>`;
  for (const g of groups) {
    html += `<div class="section-title">${g.label}</div>`;
    html += `<div class="list">` + items.filter(p => p.category === g.id).map(renderItem).join("") + `</div>`;
  }
  if (ungrouped.length) {
    html += `<div class="section-title">Інше</div><div class="list">` + ungrouped.map(renderItem).join("") + `</div>`;
  }
  return html;
}

function renderCards() {
  if (!state.data.products.length) {
    return `<div class="empty">
      ${placeholderSvg("bakery", 56)}
      <p>Поки немає жодної тех карти.</p>
      <button class="btn" data-new-product>Додати виріб</button>
    </div>`;
  }
  const cats = CATEGORIES.filter(c => state.data.products.some(p => p.category === c.id));
  if (state.cardsFilter !== "all" && !cats.some(c => c.id === state.cardsFilter)) state.cardsFilter = "all";

  const top = `
    <div class="cards-top">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input class="input" id="cardsSearch" type="search" placeholder="Пошук по назві" value="${esc(state.cardsSearch)}" autocomplete="off">
      </div>
      <div class="chips">
        <button class="chip icon-chip ${state.cardsFilter === "all" ? "is-active" : ""}" data-cards-filter="all">${GROUP_ICONS.all}Усі</button>
        ${cats.map(c => `<button class="chip icon-chip ${state.cardsFilter === c.id ? "is-active" : ""}" data-cards-filter="${c.id}">${catLineIcon(c.id)}${c.label}</button>`).join("")}
      </div>
    </div>`;

  return top + `<div id="cardsList">${cardsListHtml()}</div>`;
}

/* ---------- Редактор изделия ---------- */
function openProductEditor(id) {
  const existing = id ? productById(id) : null;
  const draft = existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: uid(), name: "", category: "bakery", photo: null, markup: 200, onDisplay: true, yieldQty: null, yieldUnit: null, components: [] };
  const isNew = !existing;

  if (!state.data.materials.length) {
    toast("Спочатку додайте сировину на склад");
    switchTab("stock");
    return;
  }

  const overlay = openSheet(`
    <div class="sheet-header"><h2>${isNew ? "Новий виріб" : "Виріб"}</h2>${closeBtnHtml}</div>
    <div class="sheet-body">
      <div class="field">
        <label for="pName">Назва</label>
        <input class="input" id="pName" value="${esc(draft.name)}" placeholder="Пиріжок з родзинками" autocomplete="off">
        <div class="err" id="pNameErr" hidden>Вкажіть назву виробу</div>
      </div>
      <div class="field">
        <label>Категорія</label>
        <div class="chips wrap" id="pCat">
          ${CATEGORIES.map(c => `<button type="button" class="chip ${draft.category === c.id ? "is-active" : ""}" data-cat="${c.id}">${c.label}</button>`).join("")}
        </div>
      </div>
      <div class="field">
        <label>Фото</label>
        <div class="photo-edit">
          <span id="pPhotoBox"></span>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button type="button" class="btn ghost small" id="pPhotoBtn">Обрати фото</button>
            <button type="button" class="btn danger small" id="pPhotoDel" ${draft.photo ? "" : "hidden"}>Прибрати</button>
          </div>
          <input type="file" id="pPhotoInput" accept="image/*" hidden>
        </div>
      </div>

      <div class="section-title">Склад (тех карта)</div>
      <div id="compList"></div>
      <button type="button" class="btn ghost small block" id="addComp">+ Додати компонент</button>

      <div class="field" style="margin-top:16px">
        <label>Вихід виробу</label>
        <div class="form-row">
          <div class="field" style="margin:0">
            <input class="input" id="pYieldQty" inputmode="decimal" value="${draft.yieldQty ?? ""}" placeholder="авто">
          </div>
          <div class="field" style="margin:0">
            <select class="input" id="pYieldUnit">
              ${["г", "мл", "кг", "л", "шт"].map(u => `<option value="${u}" ${(draft.yieldUnit || "г") === u ? "selected" : ""}>${u}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="hint">Порожньо — рахується автоматично із суми нетто</div>
      </div>

      <div class="section-title">Калькуляція</div>
      <div class="totals" id="totalsBox"></div>

      <div class="field" style="margin-top:14px">
        <label class="switch">
          <input type="checkbox" id="pDisplay" ${draft.onDisplay ? "checked" : ""}>
          <span class="track"></span>
          <span class="lbl" style="font-size:14.5px;color:var(--text)">Виставити на вітрину</span>
        </label>
      </div>
      ${isNew ? "" : `<button type="button" class="btn danger block" id="pDelete" style="margin:6px 0 10px">Видалити виріб</button>`}
      <div style="height:8px"></div>
    </div>
    <div class="sheet-footer">
      <button class="btn ghost" data-close>Скасувати</button>
      <button class="btn" id="pSave">Зберегти</button>
    </div>`);

  const $ = sel => overlay.querySelector(sel);

  /* черновик участвует в расчётах как временное изделие */
  function draftCost() { return draft.components.reduce((s, c) => s + compCost(c, new Set([draft.id])), 0); }
  function draftYield() {
    if (parseNum($("#pYieldQty").value) > 0) return { qty: parseNum($("#pYieldQty").value), unit: $("#pYieldUnit").value };
    const tmp = { ...draft, yieldQty: null };
    return prodYield(tmp, new Set());
  }

  function renderPhoto() {
    $("#pPhotoBox").innerHTML = draft.photo
      ? `<img class="preview" src="${draft.photo}" alt="Фото изделия">`
      : `<div class="preview-ph">${placeholderSvg(draft.category, 36)}</div>`;
    $("#pPhotoDel").hidden = !draft.photo;
  }

  function renderComps() {
    const box = $("#compList");
    if (!draft.components.length) {
      box.innerHTML = `<p style="color:var(--text-2);font-size:14px;margin:4px 2px 12px">Додайте компоненти — сировину зі складу або готові напівфабрикати. Собівартість порахується автоматично.</p>`;
      return;
    }
    box.innerHTML = draft.components.map((comp, i) => {
      const ref = compRef(comp, new Set([draft.id]));
      const unit = ref ? ref.unit : "";
      const nettoLabel = unit === "шт" ? "Нетто (вага), г" : `Нетто, ${unit}`;
      return `
        <div class="comp-row" data-i="${i}">
          <div class="top">
            <button type="button" class="input comp-pick" data-pick aria-label="Змінити компонент">
              <span class="nm">${ref ? esc(ref.name) : "Обрати компонент"}</span>
              <span class="pr">${ref ? fmtPerUnit(ref.unitPrice, ref.unit) : ""}</span>
            </button>
            <button type="button" class="del" data-del-comp aria-label="Видалити компонент">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7h10z"/></svg>
            </button>
          </div>
          <div class="nums">
            <div class="field">
              <label>Брутто, ${unit}</label>
              <input class="input" data-f="brutto" inputmode="decimal" value="${comp.brutto ?? ""}" placeholder="0">
            </div>
            <div class="field">
              <label>${nettoLabel}</label>
              <input class="input" data-f="netto" inputmode="decimal" value="${comp.netto ?? ""}" placeholder="${unit === "шт" ? "0" : (comp.brutto ?? "0")}">
            </div>
          </div>
          <div class="cost">Сума: <b>${fmtMoney(compCost(comp, new Set([draft.id])))}</b></div>
        </div>`;
    }).join("");
  }

  function renderTotals() {
    const cost = draftCost();
    const y = draftYield();
    draft.markup = Number(draft.markup) || 0;
    const exact = cost * (1 + draft.markup / 100);
    const sale = Math.ceil(exact);
    $("#totalsBox").innerHTML = `
      <div class="line"><span>Собівартість</span><span class="val">${fmtMoney(cost)}</span></div>
      <div class="line"><span>Вихід</span><span class="val">${fmtYield(y)}</span></div>
      <div class="line" style="padding-top:8px">
        <span>Націнка, %</span>
        <span class="markup-field">
          <input class="input" id="pMarkup" inputmode="numeric" value="${draft.markup}">
        </span>
      </div>
      <div class="line sale"><span>Ціна продажу</span><span class="val">${fmtNum(sale, 0)} ${cur()}</span></div>
      ${Math.abs(sale - exact) > 0.005 ? `<div class="line" style="padding:0"><span style="font-size:12.5px;color:var(--text-2)">точно: ${fmtMoney(exact)}, округлено вгору</span><span></span></div>` : ""}`;
    $("#pMarkup").addEventListener("input", e => {
      draft.markup = parseNum(e.target.value);
      $("#totalsBox .sale .val").textContent = fmtNum(Math.ceil(draftCost() * (1 + draft.markup / 100)), 0) + " " + cur();
    });
    $("#pMarkup").addEventListener("blur", renderTotals);
  }

  renderPhoto(); renderComps(); renderTotals();

  // Категория
  $("#pCat").addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    draft.category = b.dataset.cat;
    $("#pCat").querySelectorAll(".chip").forEach(x => x.classList.toggle("is-active", x === b));
    renderPhoto();
  });

  // Выход
  $("#pYieldQty").addEventListener("input", renderTotals);
  $("#pYieldUnit").addEventListener("change", renderTotals);

  // Фото
  $("#pPhotoBtn").addEventListener("click", () => $("#pPhotoInput").click());
  $("#pPhotoDel").addEventListener("click", () => { draft.photo = null; renderPhoto(); });
  $("#pPhotoInput").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      draft.photo = await resizeImage(file, 640);
      renderPhoto();
    } catch { toast("Не вдалося завантажити фото"); }
    e.target.value = "";
  });

  // Компоненты
  $("#addComp").addEventListener("click", () => {
    openComponentPicker(draft.id, (kind, refId) => {
      const comp = { brutto: "", netto: "" };
      if (kind === "p") comp.productId = refId;
      else comp.materialId = refId;
      draft.components.push(comp);
      renderComps(); renderTotals();
      const rows = overlay.querySelectorAll(".comp-row");
      const last = rows[rows.length - 1];
      if (last) last.querySelector('[data-f="brutto"]').focus();
    });
  });
  $("#compList").addEventListener("input", e => {
    const row = e.target.closest(".comp-row"); if (!row) return;
    const comp = draft.components[Number(row.dataset.i)];
    const f = e.target.dataset.f;
    if (f === "brutto" || f === "netto") {
      comp[f] = e.target.value === "" ? "" : parseNum(e.target.value);
      row.querySelector(".cost b").textContent = fmtMoney(compCost(comp, new Set([draft.id])));
      const ref = compRef(comp, new Set([draft.id]));
      if (f === "brutto" && (!ref || ref.unit !== "шт")) row.querySelector('[data-f="netto"]').placeholder = e.target.value || "0";
      renderTotals();
    }
  });
  $("#compList").addEventListener("click", e => {
    const row = e.target.closest(".comp-row"); if (!row) return;
    const comp = draft.components[Number(row.dataset.i)];
    if (e.target.closest("[data-pick]")) {
      openComponentPicker(draft.id, (kind, refId) => {
        delete comp.materialId; delete comp.productId;
        if (kind === "p") comp.productId = refId;
        else comp.materialId = refId;
        renderComps(); renderTotals();
      });
      return;
    }
    if (e.target.closest("[data-del-comp]")) {
      draft.components.splice(Number(row.dataset.i), 1);
      renderComps(); renderTotals();
    }
  });

  // Удаление изделия
  const delBtn = $("#pDelete");
  if (delBtn) delBtn.addEventListener("click", () => {
    const usedIn = state.data.products.filter(o => o.id !== id && o.components.some(c => c.productId === id));
    const warn = usedIn.length
      ? `\n\nВикористовується як компонент у: ${usedIn.map(o => o.name).join(", ")} — буде видалено з їх складу.`
      : "";
    if (!confirm(`Видалити «${draft.name}»?${warn}`)) return;
    state.data.products = state.data.products.filter(p => p.id !== id);
    state.data.products.forEach(o => { o.components = o.components.filter(c => c.productId !== id); });
    save(); closeSheet(overlay); render();
    toast("Виріб видалено");
  });

  // Сохранение
  $("#pSave").addEventListener("click", () => {
    draft.name = $("#pName").value.trim();
    if (!draft.name) {
      $("#pName").classList.add("invalid");
      $("#pNameErr").hidden = false;
      $("#pName").focus();
      return;
    }
    draft.onDisplay = $("#pDisplay").checked;
    const yq = parseNum($("#pYieldQty").value);
    draft.yieldQty = yq > 0 ? yq : null;
    draft.yieldUnit = yq > 0 ? $("#pYieldUnit").value : null;
    draft.components = draft.components
      .filter(comp => (comp.materialId || comp.productId) && (Number(comp.brutto) || 0) >= 0 && comp.brutto !== "")
      .map(comp => {
        const ref = compRef(comp, new Set([draft.id]));
        const isPiece = ref && ref.unit === "шт";
        const out = {
          brutto: Number(comp.brutto) || 0,
          netto: comp.netto === "" || comp.netto == null
            ? (isPiece ? 0 : Number(comp.brutto) || 0)
            : Number(comp.netto),
        };
        if (comp.productId) out.productId = comp.productId;
        else out.materialId = comp.materialId;
        return out;
      });
    const idx = state.data.products.findIndex(p => p.id === draft.id);
    if (idx >= 0) state.data.products[idx] = draft;
    else state.data.products.push(draft);
    save(); closeSheet(overlay);
    render();
    toast(isNew ? "Виріб додано" : "Збережено");
  });
}

function resizeImage(file, maxSide) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

/* ================== Склад сырья ================== */
const chevronHtml = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--text-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;

function stockListHtml() {
  const q = state.stockSearch.trim().toLowerCase();

  if (state.stockFilter === "nf") {
    const list = state.data.products.filter(p =>
      p.category === "nf" && (!q || p.name.toLowerCase().includes(q)));
    if (!list.length) return `<div class="empty" style="padding:32px 24px"><p>${q ? "Нічого не знайдено" : "Напівфабрикатів поки немає — вони створюються у вкладці «Тех карти» з категорією «Напівфабрикати»"}</p></div>`;
    return `<div class="list" style="padding-top:8px">` + list.map(p => {
      const y = prodYield(p);
      return `
        <div class="row-card mat-row" data-edit-product="${p.id}">
          <div class="ic">${GROUP_ICONS.nf}</div>
          <div class="main">
            <div class="title">${esc(p.name)}</div>
            <div class="sub">вихід ${fmtYield(y)} · собів. <b>${fmtPerUnit(prodUnitCost(p), y.unit)}</b></div>
          </div>
          ${chevronHtml}
        </div>`;
    }).join("") + `</div>`;
  }

  let items = state.data.materials;
  if (state.stockFilter !== "all") items = items.filter(m => matGroup(m) === state.stockFilter);
  if (q) items = items.filter(m => m.name.toLowerCase().includes(q) || String(m.code || "").toLowerCase().includes(q));
  if (!items.length) {
    return `<div class="empty" style="padding:32px 24px">
      <p>${q || state.stockFilter !== "all" ? "Нічого не знайдено" : "Склад порожній. Додайте першу сировину."}</p>
      ${q || state.stockFilter !== "all" ? "" : `<button class="btn" data-new-material>Додати сировину</button>`}
    </div>`;
  }
  const noPrice = items.filter(m => !(m.packPrice > 0)).length;
  return (noPrice ? `<p style="color:var(--text-2);font-size:13.5px;margin:8px 2px 0">⚠ Без ціни: ${noPrice} поз. — собівартість виробів з ними буде занижена.</p>` : "") +
    `<div class="list" style="padding-top:8px">` + items.map(m => `
      <div class="row-card mat-row" data-edit-material="${m.id}">
        <div class="ic">${GROUP_ICONS[matGroup(m)] || GROUP_ICONS.grocery}</div>
        <div class="main">
          <div class="title">${m.code ? `<span class="mcode">${esc(m.code)}</span>` : ""}${esc(m.name)}</div>
          <div class="sub">${m.packPrice > 0
            ? `${fmtNum(m.packQty)} ${m.unit} — ${fmtMoney(m.packPrice)} · <b>${fmtUnitPrice(m)}</b>`
            : `<span style="color:var(--danger)">ціна не вказана</span>`}</div>
        </div>
        ${chevronHtml}
      </div>`).join("") + `</div>`;
}

function renderStock() {
  const filters = [{ id: "all", label: "Усі" }, ...MAT_GROUPS.slice(0, 7),
    { id: "nf", label: "Напівфабрикати" }, ...MAT_GROUPS.slice(7)];
  const top = `
    <div class="stock-top">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input class="input" id="stockSearch" type="search" placeholder="Пошук по сировині" value="${esc(state.stockSearch)}" autocomplete="off">
      </div>
      <div class="chips">
        ${filters.map(f => `<button class="chip icon-chip ${state.stockFilter === f.id ? "is-active" : ""}" data-stock-filter="${f.id}">${GROUP_ICONS[f.id] || ""}${f.label}</button>`).join("")}
      </div>
    </div>`;

  return top + `<div id="stockList">${stockListHtml()}</div>` + `
    <div class="backup">
      <p>Експорт тех карт і складу</p>
      <div class="btns">
        <button class="btn ghost small" data-export-xlsx>Excel</button>
        <button class="btn ghost small" data-export-pdf>PDF</button>
      </div>
      <p style="margin-top:14px">Імпорт</p>
      <div class="btns">
        <button class="btn ghost small" data-import-xlsx>Excel</button>
      </div>
      <p style="margin-top:14px">Дані зберігаються на цьому пристрої · валюта ₴</p>
      <input type="file" id="importXlsxInput" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
    </div>`;
}

function openMaterialEditor(id) {
  const existing = id ? matById(id) : null;
  const draft = existing
    ? { ...existing }
    : { id: uid(), code: "", name: "", unit: "г", packQty: "", packPrice: "", group: null };
  const isNew = !existing;
  if (!draft.group) draft.group = classifyMaterial(draft.name);

  const overlay = openSheet(`
    <div class="sheet-header"><h2>${isNew ? "Нова сировина" : "Сировина"}</h2>${closeBtnHtml}</div>
    <div class="sheet-body">
      <div class="form-row">
        <div class="field" style="flex:0 0 96px">
          <label for="mCode">Код</label>
          <input class="input" id="mCode" value="${esc(draft.code || "")}" placeholder="—" autocomplete="off" inputmode="numeric">
        </div>
        <div class="field">
          <label for="mName">Назва</label>
          <input class="input" id="mName" value="${esc(draft.name)}" placeholder="Борошно пшеничне в/г" autocomplete="off">
          <div class="err" id="mNameErr" hidden>Вкажіть назву</div>
        </div>
      </div>
      <div class="field">
        <label>Група</label>
        <div class="chips wrap" id="mGroup">
          ${MAT_GROUPS.map(g => `<button type="button" class="chip icon-chip ${draft.group === g.id ? "is-active" : ""}" data-group="${g.id}">${GROUP_ICONS[g.id]}${g.label}</button>`).join("")}
        </div>
      </div>
      <div class="field">
        <label for="mUnit">Одиниця виміру</label>
        <select class="input" id="mUnit">
          ${[["г", "грами (г)"], ["кг", "кілограми (кг)"], ["мл", "мілілітри (мл)"], ["л", "літри (л)"], ["шт", "штуки (шт)"]]
            .map(([v, t]) => `<option value="${v}" ${draft.unit === v ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </div>
      <div class="form-row">
        <div class="field">
          <label for="mQty">К-сть в упаковці</label>
          <input class="input" id="mQty" inputmode="decimal" value="${draft.packQty}" placeholder="1000">
          <div class="err" id="mQtyErr" hidden>Більше нуля</div>
        </div>
        <div class="field">
          <label for="mPrice">Ціна упаковки, ${cur()}</label>
          <input class="input" id="mPrice" inputmode="decimal" value="${draft.packPrice}" placeholder="60">
          <div class="err" id="mPriceErr" hidden>Більше нуля</div>
        </div>
      </div>
      <p class="hint" id="mCalc" style="font-size:14px;color:var(--text-2);margin:0 2px 14px"></p>
      ${isNew ? "" : `<button type="button" class="btn danger block" id="mDelete" style="margin:2px 0 10px">Видалити сировину</button>`}
    </div>
    <div class="sheet-footer">
      <button class="btn ghost" data-close>Скасувати</button>
      <button class="btn" id="mSave">Зберегти</button>
    </div>`);

  const $ = sel => overlay.querySelector(sel);

  function updCalc() {
    const qty = parseNum($("#mQty").value);
    const price = parseNum($("#mPrice").value);
    const unit = $("#mUnit").value;
    $("#mCalc").textContent = qty > 0 && price > 0
      ? `Ціна за одиницю: ${fmtPerUnit(price / qty, unit)}`
      : "";
  }
  ["mQty", "mPrice"].forEach(fid => $("#" + fid).addEventListener("input", updCalc));
  $("#mUnit").addEventListener("change", updCalc);
  updCalc();

  $("#mGroup").addEventListener("click", e => {
    const b = e.target.closest("[data-group]");
    if (!b) return;
    draft.group = b.dataset.group;
    $("#mGroup").querySelectorAll(".chip").forEach(x => x.classList.toggle("is-active", x === b));
  });
  /* при вводе названия нового сырья группа угадывается, пока не выбрана вручную */
  let groupTouched = !isNew;
  $("#mGroup").addEventListener("click", () => { groupTouched = true; });
  $("#mName").addEventListener("input", () => {
    if (groupTouched) return;
    draft.group = classifyMaterial($("#mName").value);
    $("#mGroup").querySelectorAll(".chip").forEach(x =>
      x.classList.toggle("is-active", x.dataset.group === draft.group));
  });

  const delBtn = $("#mDelete");
  if (delBtn) delBtn.addEventListener("click", () => {
    const used = state.data.products.filter(p => p.components.some(c => c.materialId === id));
    const warn = used.length
      ? `\n\nВикористовується у ${used.length} виробах (${used.map(p => p.name).join(", ")}) — компонент буде видалено з їх складу.`
      : "";
    if (!confirm(`Видалити «${draft.name}»?${warn}`)) return;
    state.data.materials = state.data.materials.filter(m => m.id !== id);
    state.data.products.forEach(p => { p.components = p.components.filter(c => c.materialId !== id); });
    save(); closeSheet(overlay); render();
    toast("Сировину видалено");
  });

  $("#mSave").addEventListener("click", () => {
    const name = $("#mName").value.trim();
    const qty = parseNum($("#mQty").value);
    const price = parseNum($("#mPrice").value);
    let ok = true;
    const check = (cond, inputId, errId) => {
      $("#" + inputId).classList.toggle("invalid", !cond);
      $("#" + errId).hidden = cond;
      if (!cond) ok = false;
    };
    check(!!name, "mName", "mNameErr");
    check(qty > 0, "mQty", "mQtyErr");
    check(price > 0, "mPrice", "mPriceErr");
    if (!ok) return;

    Object.assign(draft, { code: $("#mCode").value.trim(), name, unit: $("#mUnit").value, packQty: qty, packPrice: price, group: draft.group || classifyMaterial(name) });
    const idx = state.data.materials.findIndex(m => m.id === draft.id);
    if (idx >= 0) state.data.materials[idx] = draft;
    else state.data.materials.push(draft);
    save(); closeSheet(overlay); render();
    toast(isNew ? "Сировину додано" : "Збережено");
  });
}

/* ================== Экспорт / импорт ================== */
const loadedScripts = {};
function loadScript(src) {
  if (!loadedScripts[src]) {
    loadedScripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { delete loadedScripts[src]; reject(new Error("load failed")); };
      document.head.appendChild(s);
    });
  }
  return loadedScripts[src];
}
/* PDF-библиотеки + встроенный шрифт с кириллицей и ₴ */
function loadPdfLibs() {
  return loadScript("vendor/pdfmake.min.js")
    .then(() => loadScript("vendor/vfs_fonts.js"))
    .then(() => loadScript("vendor/menu-font.js"))
    .then(() => loadScript("export-docs.js"));
}

async function importXlsx(file) {
  toast("Читаю Excel…");
  try {
    await loadScript("vendor/xlsx.full.min.js");
    await loadScript("xlsx-import.js");
    const buf = await file.arrayBuffer();
    const parsed = window.parseCalcCards(buf);
    ensureGroups(parsed);
    const nf = parsed.products.filter(p => p.category === "nf").length;
    const noPrice = parsed.materials.filter(m => !(m.packPrice > 0)).length;
    if (!confirm(
      `Знайдено: ${parsed.products.length} виробів (з них ${nf} напівфабрикатів), ` +
      `${parsed.materials.length} позицій сировини${noPrice ? `, без ціни: ${noPrice}` : ""}.\n\n` +
      `Замінити всі поточні дані? Фото і ціни, введені вручну, буде втрачено.`)) return;
    state.data = { settings: state.data.settings, ...parsed };
    save(); render();
    toast("Тех карти завантажено з Excel");
  } catch (e) {
    toast("Не вдалося розібрати файл — потрібен Excel з калькуляційними картами");
  }
}

/* ================== Глобальные обработчики ================== */
document.querySelector(".tabbar").addEventListener("click", e => {
  const tab = e.target.closest(".tab");
  if (tab) switchTab(tab.dataset.tab);
});

document.getElementById("headerAction").addEventListener("click", () => {
  if (state.tab === "cards") openProductEditor(null);
  else if (state.tab === "stock") openMaterialEditor(null);
});

document.getElementById("view").addEventListener("click", e => {
  const chip = e.target.closest(".chip[data-filter]");
  if (chip) { state.vitrinaFilter = chip.dataset.filter; render(); return; }

  const sChip = e.target.closest(".chip[data-stock-filter]");
  if (sChip) {
    state.stockFilter = sChip.dataset.stockFilter;
    document.querySelectorAll("[data-stock-filter]").forEach(c =>
      c.classList.toggle("is-active", c.dataset.stockFilter === state.stockFilter));
    document.getElementById("stockList").innerHTML = stockListHtml();
    return;
  }

  const cChip = e.target.closest(".chip[data-cards-filter]");
  if (cChip) {
    state.cardsFilter = cChip.dataset.cardsFilter;
    document.querySelectorAll("[data-cards-filter]").forEach(c =>
      c.classList.toggle("is-active", c.dataset.cardsFilter === state.cardsFilter));
    document.getElementById("cardsList").innerHTML = cardsListHtml();
    return;
  }

  const openP = e.target.closest("[data-open-product]");
  if (openP) { openProductView(openP.dataset.openProduct); return; }

  if (e.target.closest("[data-stop]")) return; // свитч «на витрину» обрабатывается в change

  const editP = e.target.closest("[data-edit-product]");
  if (editP) { openProductEditor(editP.dataset.editProduct); return; }

  const newP = e.target.closest("[data-new-product]");
  if (newP) { openProductEditor(null); return; }

  const editM = e.target.closest("[data-edit-material]");
  if (editM) { openMaterialEditor(editM.dataset.editMaterial); return; }

  const newM = e.target.closest("[data-new-material]");
  if (newM) { openMaterialEditor(null); return; }

  if (e.target.closest("[data-export-xlsx]")) {
    toast("Готую Excel…");
    loadScript("vendor/xlsx.full.min.js")
      .then(() => loadScript("export-docs.js"))
      .then(() => window.exportExcelFile())
      .catch(() => toast("Немає мережі — спробуйте пізніше"));
    return;
  }
  if (e.target.closest("[data-print-vitrina]")) {
    toast("Готую PDF меню…");
    loadPdfLibs().then(() => window.exportMenuPdf()).catch(() => toast("Немає мережі — спробуйте пізніше"));
    return;
  }
  if (e.target.closest("[data-export-pdf]")) {
    toast("Готую PDF…");
    loadPdfLibs().then(() => window.exportPdfFile()).catch(() => toast("Немає мережі — спробуйте пізніше"));
    return;
  }
  if (e.target.closest("[data-import-xlsx]")) { document.getElementById("importXlsxInput").click(); return; }
});

document.getElementById("view").addEventListener("input", e => {
  if (e.target.id === "stockSearch") {
    state.stockSearch = e.target.value;
    document.getElementById("stockList").innerHTML = stockListHtml();
    return;
  }
  if (e.target.id === "cardsSearch") {
    state.cardsSearch = e.target.value;
    document.getElementById("cardsList").innerHTML = cardsListHtml();
    return;
  }
  const inp = e.target.closest("[data-markup]");
  if (!inp) return;
  const p = productById(inp.dataset.markup);
  if (!p) return;
  p.markup = parseNum(inp.value);
  save();
  const sale = inp.closest(".row-card").querySelector(".tc-foot .sale");
  if (sale) sale.textContent = fmtNum(salePrice(p), 0) + " " + cur();
});

document.getElementById("view").addEventListener("change", e => {
  const toggle = e.target.closest("[data-toggle-display]");
  if (toggle) {
    const p = productById(toggle.dataset.toggleDisplay);
    if (p) {
      p.onDisplay = toggle.checked;
      save();
      toast(p.onDisplay ? "Виставлено на вітрину" : "Прибрано з вітрини");
    }
    return;
  }
  if (e.target.id === "importXlsxInput" && e.target.files[0]) {
    importXlsx(e.target.files[0]);
    e.target.value = "";
  }
});

/* ================== Запуск ================== */
load().then(() => { applyTheme(); switchTab("vitrina"); });

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
