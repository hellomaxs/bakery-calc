"use strict";

/* ================== Хранилище ================== */
const LS_KEY = "bakeryCalc:v1";

const state = {
  data: { settings: { currency: "₽" }, materials: [], products: [] },
  tab: "vitrina",
  vitrinaFilter: "all",
  stockFilter: "all",
  stockSearch: "",
};

/* Категории изделий */
const CATEGORIES = [
  { id: "bakery", label: "Выпечка" },
  { id: "fried", label: "Жареное" },
  { id: "snacks", label: "Закуски" },
  { id: "drinks", label: "Напитки" },
  { id: "nf", label: "Полуфабрикаты" },
];
function catLabel(id) {
  const c = CATEGORIES.find(c => c.id === id);
  return c ? c.label : id;
}

/* Группы сырья на складе */
const MAT_GROUPS = [
  { id: "dairy", label: "Молочка" },
  { id: "sprinkle", label: "Посыпки" },
  { id: "meat", label: "Мясо" },
  { id: "veg", label: "Овощи" },
  { id: "fruit", label: "Фрукты" },
  { id: "topping", label: "Топпинги" },
  { id: "greens", label: "Зелень" },
  { id: "eggs", label: "Яйца" },
  { id: "grocery", label: "Бакалея" },
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
};

/* Автоопределение группы по названию (укр/рус). Порядок проверки важен. */
const GROUP_KEYWORDS = [
  ["eggs", ["яйц", "яйце", "меланж"]],
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
  for (const [group, words] of GROUP_KEYWORDS) {
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

async function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      state.data = JSON.parse(raw);
      if (!state.data.settings) state.data.settings = { currency: "₽" };
      if (ensureGroups(state.data)) save();
      return;
    }
  } catch (e) { /* повреждённые данные — начинаем заново */ }
  state.data = seedData();
  save();
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
    flour: m("Мука пшеничная в/с", "г", 1000, 60),
    sugar: m("Сахар", "г", 1000, 75),
    butter: m("Масло сливочное 82,5%", "г", 500, 320),
    yeast: m("Дрожжи прессованные", "г", 100, 90),
    milk: m("Молоко 3,2%", "мл", 1000, 85),
    raisin: m("Изюм", "г", 500, 180),
    egg: m("Яйцо куриное С1", "шт", 10, 120),
    salt: m("Соль", "г", 1000, 25),
    cocoa: m("Какао-порошок", "г", 250, 210),
  };
  const c = (mat, brutto, netto) => ({ materialId: mat.id, brutto, netto });
  return {
    settings: { currency: "₽" },
    materials: Object.values(mats),
    products: [
      {
        id: uid(), name: "Пирожок с изюмом", category: "bakery", photo: null,
        markup: 200, onDisplay: true, yieldQty: null, yieldUnit: null,
        components: [
          c(mats.flour, 55, 55), c(mats.sugar, 8, 8), c(mats.butter, 10, 10),
          c(mats.yeast, 2, 2), c(mats.milk, 25, 20), c(mats.raisin, 15, 15),
          c(mats.egg, 0.2, 10), c(mats.salt, 1, 1),
        ],
      },
      {
        id: uid(), name: "Какао на молоке", category: "drinks", photo: null,
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
function cur() { return (state.data.settings && state.data.settings.currency) || "₽"; }
function fmtNum(n, maxDigits = 2) {
  return Number(n || 0).toLocaleString("ru-RU", { maximumFractionDigits: maxDigits });
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
const closeBtnHtml = `<button class="btn-icon subtle" data-close aria-label="Закрыть">
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;

/* ================== Вкладки ================== */
const TAB_TITLES = { vitrina: "Витрина", cards: "Тех карты", stock: "Склад сырья" };

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("is-active", b.dataset.tab === tab));
  document.getElementById("pageTitle").textContent = TAB_TITLES[tab];
  const action = document.getElementById("headerAction");
  action.hidden = tab === "vitrina";
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

/* ================== Витрина ================== */
function renderVitrina() {
  const filter = state.vitrinaFilter;
  const displayed = state.data.products.filter(p => p.onDisplay);
  const cats = CATEGORIES.filter(c => displayed.some(p => p.category === c.id));
  if (filter !== "all" && !cats.some(c => c.id === filter)) state.vitrinaFilter = "all";
  const items = displayed.filter(p => state.vitrinaFilter === "all" || p.category === state.vitrinaFilter);

  const chips = `
    <div class="chips" role="tablist">
      <button class="chip ${state.vitrinaFilter === "all" ? "is-active" : ""}" data-filter="all">Все</button>
      ${cats.map(c => `<button class="chip ${state.vitrinaFilter === c.id ? "is-active" : ""}" data-filter="${c.id}">${c.label}</button>`).join("")}
    </div>`;

  if (!items.length) {
    return chips + `
      <div class="empty">
        ${placeholderSvg("bakery", 56)}
        <p>На витрине пока пусто.<br>Отметьте изделия «На витрину» во вкладке «Тех карты».</p>
      </div>`;
  }

  return chips + `<div class="grid">` + items.map(p => {
    const w = productWeight(p);
    const photo = p.photo
      ? `<img class="photo" src="${p.photo}" alt="${esc(p.name)}">`
      : `<div class="photo-ph">${placeholderSvg(p.category, 48)}</div>`;
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

function openProductView(id) {
  const p = productById(id);
  if (!p) return;
  const w = prodYield(p);
  const photo = p.photo
    ? `<img class="pv-photo" src="${p.photo}" alt="${esc(p.name)}">`
    : `<div class="pv-photo-ph">${placeholderSvg(p.category, 64)}</div>`;
  const ingredients = p.components.map(comp => {
    const ref = compRef(comp);
    if (!ref) return "";
    return `<div class="ing"><span>${esc(ref.name)}</span><span class="qty">${fmtNum(comp.brutto)} ${ref.unit}</span></div>`;
  }).join("");

  openSheet(`
    <div class="sheet-header"><h2>${esc(p.name)}</h2>${closeBtnHtml}</div>
    <div class="sheet-body">
      ${photo}
      <div class="pv-meta">
        <span class="price">${fmtNum(salePrice(p), 0)} ${cur()}</span>
        <span class="weight">Выход: ${fmtYield(w)}</span>
      </div>
      <div class="section-title">Состав (технологическая карта)</div>
      <div class="ingr-list">${ingredients || '<div class="ing"><span>Состав не заполнен</span></div>'}</div>
      <div style="height:20px"></div>
    </div>`);
}

/* ================== Тех карты ================== */
function renderCards() {
  const items = state.data.products;
  if (!items.length) {
    return `<div class="empty">
      ${placeholderSvg("bakery", 56)}
      <p>Пока нет ни одной тех карты.</p>
      <button class="btn" data-new-product>Добавить изделие</button>
    </div>`;
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
            <div class="sub">Выход <b>${fmtYield(w)}</b> · Себест. <b>${fmtMoney(cost)}</b></div>
          </div>
          <label class="switch" data-stop>
            <input type="checkbox" data-toggle-display="${p.id}" ${p.onDisplay ? "checked" : ""} aria-label="Выставить на витрину">
            <span class="track"></span>
          </label>
        </div>
        <div class="tgrid">
          ${rows || '<p style="color:var(--text-2);font-size:13px;margin:6px 0">Состав не заполнен</p>'}
          <div class="trow total">
            <span>Итого</span>
            <span></span>
            <span>${fmtYield(w)}</span>
            <span></span>
            <span>${fmtNum(cost, 2)}</span>
          </div>
        </div>
        <div class="tc-foot">
          <label class="markup-inline">Наценка
            <input class="input mk" data-markup="${p.id}" inputmode="numeric" value="${Number(p.markup) || 0}" aria-label="Наценка, %"> %
          </label>
          <span class="sale">${fmtNum(salePrice(p), 0)} ${cur()}</span>
        </div>
      </div>`;
  };

  let html = `
    <div class="cols-head">
      <span>Компонент</span><span>Брутто</span><span>Нетто</span><span>Цена, ${cur()}</span><span>Сумма, ${cur()}</span>
    </div>`;
  for (const g of groups) {
    html += `<div class="section-title">${g.label}</div>`;
    html += `<div class="list">` + items.filter(p => p.category === g.id).map(renderItem).join("") + `</div>`;
  }
  if (ungrouped.length) {
    html += `<div class="section-title">Прочее</div><div class="list">` + ungrouped.map(renderItem).join("") + `</div>`;
  }
  return html;
}

/* ---------- Редактор изделия ---------- */
function openProductEditor(id) {
  const existing = id ? productById(id) : null;
  const draft = existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: uid(), name: "", category: "bakery", photo: null, markup: 200, onDisplay: true, yieldQty: null, yieldUnit: null, components: [] };
  const isNew = !existing;

  if (!state.data.materials.length) {
    toast("Сначала добавьте сырьё на склад");
    switchTab("stock");
    return;
  }

  const overlay = openSheet(`
    <div class="sheet-header"><h2>${isNew ? "Новое изделие" : "Изделие"}</h2>${closeBtnHtml}</div>
    <div class="sheet-body">
      <div class="field">
        <label for="pName">Название</label>
        <input class="input" id="pName" value="${esc(draft.name)}" placeholder="Пирожок с изюмом" autocomplete="off">
        <div class="err" id="pNameErr" hidden>Укажите название изделия</div>
      </div>
      <div class="field">
        <label>Категория</label>
        <div class="chips wrap" id="pCat">
          ${CATEGORIES.map(c => `<button type="button" class="chip ${draft.category === c.id ? "is-active" : ""}" data-cat="${c.id}">${c.label}</button>`).join("")}
        </div>
      </div>
      <div class="field">
        <label>Фото</label>
        <div class="photo-edit">
          <span id="pPhotoBox"></span>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button type="button" class="btn ghost small" id="pPhotoBtn">Выбрать фото</button>
            <button type="button" class="btn danger small" id="pPhotoDel" ${draft.photo ? "" : "hidden"}>Убрать</button>
          </div>
          <input type="file" id="pPhotoInput" accept="image/*" hidden>
        </div>
      </div>

      <div class="section-title">Состав (тех карта)</div>
      <div id="compList"></div>
      <button type="button" class="btn ghost small block" id="addComp">+ Добавить компонент</button>

      <div class="field" style="margin-top:16px">
        <label>Выход изделия</label>
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
        <div class="hint">Пусто — считается автоматически из суммы нетто</div>
      </div>

      <div class="section-title">Калькуляция</div>
      <div class="totals" id="totalsBox"></div>

      <div class="field" style="margin-top:14px">
        <label class="switch">
          <input type="checkbox" id="pDisplay" ${draft.onDisplay ? "checked" : ""}>
          <span class="track"></span>
          <span class="lbl" style="font-size:14.5px;color:var(--text)">Выставить на витрину</span>
        </label>
      </div>
      ${isNew ? "" : `<button type="button" class="btn danger block" id="pDelete" style="margin:6px 0 10px">Удалить изделие</button>`}
      <div style="height:8px"></div>
    </div>
    <div class="sheet-footer">
      <button class="btn ghost" data-close>Отмена</button>
      <button class="btn" id="pSave">Сохранить</button>
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

  function refValue(comp) { return comp.productId ? "p:" + comp.productId : "m:" + comp.materialId; }
  function refOptions(comp) {
    const sel = refValue(comp);
    const mats = state.data.materials.map(m =>
      `<option value="m:${m.id}" ${sel === "m:" + m.id ? "selected" : ""}>${esc(m.name)} (${fmtUnitPrice(m)})</option>`).join("");
    const prods = state.data.products.filter(p => p.id !== draft.id).map(p => {
      const y = prodYield(p);
      return `<option value="p:${p.id}" ${sel === "p:" + p.id ? "selected" : ""}>${esc(p.name)} (${fmtPerUnit(prodUnitCost(p), y.unit)})</option>`;
    }).join("");
    return `<optgroup label="Сырьё">${mats}</optgroup>` +
      (prods ? `<optgroup label="Изделия и полуфабрикаты">${prods}</optgroup>` : "");
  }

  function renderComps() {
    const box = $("#compList");
    if (!draft.components.length) {
      box.innerHTML = `<p style="color:var(--text-2);font-size:14px;margin:4px 2px 12px">Добавьте компоненты — сырьё со склада или готовые полуфабрикаты. Себестоимость посчитается автоматически.</p>`;
      return;
    }
    box.innerHTML = draft.components.map((comp, i) => {
      const ref = compRef(comp, new Set([draft.id]));
      const unit = ref ? ref.unit : "";
      const nettoLabel = unit === "шт" ? "Нетто (вес), г" : `Нетто, ${unit}`;
      return `
        <div class="comp-row" data-i="${i}">
          <div class="top">
            <select class="input" data-f="ref" aria-label="Компонент">${refOptions(comp)}</select>
            <button type="button" class="del" data-del-comp aria-label="Удалить компонент">
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
          <div class="cost">Сумма: <b>${fmtMoney(compCost(comp, new Set([draft.id])))}</b></div>
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
      <div class="line"><span>Себестоимость</span><span class="val">${fmtMoney(cost)}</span></div>
      <div class="line"><span>Выход</span><span class="val">${fmtYield(y)}</span></div>
      <div class="line" style="padding-top:8px">
        <span>Наценка, %</span>
        <span class="markup-field">
          <input class="input" id="pMarkup" inputmode="numeric" value="${draft.markup}">
        </span>
      </div>
      <div class="line sale"><span>Продажная цена</span><span class="val">${fmtNum(sale, 0)} ${cur()}</span></div>
      ${Math.abs(sale - exact) > 0.005 ? `<div class="line" style="padding:0"><span style="font-size:12.5px;color:var(--text-2)">точно: ${fmtMoney(exact)}, округлено вверх</span><span></span></div>` : ""}`;
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
    } catch { toast("Не удалось загрузить фото"); }
    e.target.value = "";
  });

  // Компоненты
  $("#addComp").addEventListener("click", () => {
    draft.components.push({ materialId: state.data.materials[0].id, brutto: "", netto: "" });
    renderComps(); renderTotals();
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
  $("#compList").addEventListener("change", e => {
    const row = e.target.closest(".comp-row"); if (!row) return;
    const comp = draft.components[Number(row.dataset.i)];
    if (e.target.dataset.f === "ref") {
      const [kind, refId] = [e.target.value.slice(0, 1), e.target.value.slice(2)];
      delete comp.materialId; delete comp.productId;
      if (kind === "p") comp.productId = refId;
      else comp.materialId = refId;
      renderComps(); renderTotals();
    }
  });
  $("#compList").addEventListener("click", e => {
    const del = e.target.closest("[data-del-comp]"); if (!del) return;
    const row = del.closest(".comp-row");
    draft.components.splice(Number(row.dataset.i), 1);
    renderComps(); renderTotals();
  });

  // Удаление изделия
  const delBtn = $("#pDelete");
  if (delBtn) delBtn.addEventListener("click", () => {
    const usedIn = state.data.products.filter(o => o.id !== id && o.components.some(c => c.productId === id));
    const warn = usedIn.length
      ? `\n\nИспользуется как компонент в: ${usedIn.map(o => o.name).join(", ")} — будет удалено из их состава.`
      : "";
    if (!confirm(`Удалить «${draft.name}»?${warn}`)) return;
    state.data.products = state.data.products.filter(p => p.id !== id);
    state.data.products.forEach(o => { o.components = o.components.filter(c => c.productId !== id); });
    save(); closeSheet(overlay); render();
    toast("Изделие удалено");
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
    toast(isNew ? "Изделие добавлено" : "Сохранено");
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
    if (!list.length) return `<div class="empty" style="padding:32px 24px"><p>${q ? "Ничего не найдено" : "Полуфабрикатов пока нет — они создаются во вкладке «Тех карты» с категорией «Полуфабрикаты»"}</p></div>`;
    return `<div class="list" style="padding-top:8px">` + list.map(p => {
      const y = prodYield(p);
      return `
        <div class="row-card mat-row" data-edit-product="${p.id}">
          <div class="ic">${GROUP_ICONS.nf}</div>
          <div class="main">
            <div class="title">${esc(p.name)}</div>
            <div class="sub">выход ${fmtYield(y)} · себест. <b>${fmtPerUnit(prodUnitCost(p), y.unit)}</b></div>
          </div>
          ${chevronHtml}
        </div>`;
    }).join("") + `</div>`;
  }

  let items = state.data.materials;
  if (state.stockFilter !== "all") items = items.filter(m => matGroup(m) === state.stockFilter);
  if (q) items = items.filter(m => m.name.toLowerCase().includes(q));
  if (!items.length) {
    return `<div class="empty" style="padding:32px 24px">
      <p>${q || state.stockFilter !== "all" ? "Ничего не найдено" : "Склад пуст. Добавьте первое сырьё."}</p>
      ${q || state.stockFilter !== "all" ? "" : `<button class="btn" data-new-material>Добавить сырьё</button>`}
    </div>`;
  }
  const noPrice = items.filter(m => !(m.packPrice > 0)).length;
  return (noPrice ? `<p style="color:var(--text-2);font-size:13.5px;margin:8px 2px 0">⚠ Без цены: ${noPrice} поз. — себестоимость изделий с ними будет занижена.</p>` : "") +
    `<div class="list" style="padding-top:8px">` + items.map(m => `
      <div class="row-card mat-row" data-edit-material="${m.id}">
        <div class="ic">${GROUP_ICONS[matGroup(m)] || GROUP_ICONS.grocery}</div>
        <div class="main">
          <div class="title">${esc(m.name)}</div>
          <div class="sub">${m.packPrice > 0
            ? `${fmtNum(m.packQty)} ${m.unit} — ${fmtMoney(m.packPrice)} · <b>${fmtUnitPrice(m)}</b>`
            : `<span style="color:var(--danger)">цена не указана</span>`}</div>
        </div>
        ${chevronHtml}
      </div>`).join("") + `</div>`;
}

function renderStock() {
  const filters = [{ id: "all", label: "Все" }, ...MAT_GROUPS.slice(0, 7),
    { id: "nf", label: "Полуфабрикаты" }, ...MAT_GROUPS.slice(7)];
  const top = `
    <div class="stock-top">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input class="input" id="stockSearch" type="search" placeholder="Поиск по сырью" value="${esc(state.stockSearch)}" autocomplete="off">
      </div>
      <div class="chips">
        ${filters.map(f => `<button class="chip icon-chip ${state.stockFilter === f.id ? "is-active" : ""}" data-stock-filter="${f.id}">${GROUP_ICONS[f.id] || ""}${f.label}</button>`).join("")}
      </div>
    </div>`;

  return top + `<div id="stockList">${stockListHtml()}</div>` + `
    <div class="backup">
      <p>Экспорт тех карт и склада</p>
      <div class="btns">
        <button class="btn ghost small" data-export-xlsx>Excel</button>
        <button class="btn ghost small" data-export-pdf>PDF</button>
        <button class="btn ghost small" data-export>JSON</button>
      </div>
      <p style="margin-top:14px">Импорт</p>
      <div class="btns">
        <button class="btn ghost small" data-import-xlsx>Из Excel</button>
        <button class="btn ghost small" data-import>Из JSON</button>
      </div>
      <p style="margin-top:14px">Данные хранятся на этом устройстве · Валюта:
        <select id="curSelect" style="border:0;background:none;color:var(--primary);font-weight:600">
          ${["₽", "₴", "€", "$", "₸"].map(c => `<option value="${c}" ${cur() === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </p>
      <input type="file" id="importInput" accept="application/json,.json" hidden>
      <input type="file" id="importXlsxInput" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
    </div>`;
}

function openMaterialEditor(id) {
  const existing = id ? matById(id) : null;
  const draft = existing
    ? { ...existing }
    : { id: uid(), name: "", unit: "г", packQty: "", packPrice: "", group: null };
  const isNew = !existing;
  if (!draft.group) draft.group = classifyMaterial(draft.name);

  const overlay = openSheet(`
    <div class="sheet-header"><h2>${isNew ? "Новое сырьё" : "Сырьё"}</h2>${closeBtnHtml}</div>
    <div class="sheet-body">
      <div class="field">
        <label for="mName">Название</label>
        <input class="input" id="mName" value="${esc(draft.name)}" placeholder="Мука пшеничная в/с" autocomplete="off">
        <div class="err" id="mNameErr" hidden>Укажите название</div>
      </div>
      <div class="field">
        <label>Группа</label>
        <div class="chips wrap" id="mGroup">
          ${MAT_GROUPS.map(g => `<button type="button" class="chip icon-chip ${draft.group === g.id ? "is-active" : ""}" data-group="${g.id}">${GROUP_ICONS[g.id]}${g.label}</button>`).join("")}
        </div>
      </div>
      <div class="field">
        <label for="mUnit">Единица измерения</label>
        <select class="input" id="mUnit">
          ${[["г", "граммы (г)"], ["кг", "килограммы (кг)"], ["мл", "миллилитры (мл)"], ["л", "литры (л)"], ["шт", "штуки (шт)"]]
            .map(([v, t]) => `<option value="${v}" ${draft.unit === v ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </div>
      <div class="form-row">
        <div class="field">
          <label for="mQty">Кол-во в упаковке</label>
          <input class="input" id="mQty" inputmode="decimal" value="${draft.packQty}" placeholder="1000">
          <div class="err" id="mQtyErr" hidden>Больше нуля</div>
        </div>
        <div class="field">
          <label for="mPrice">Цена упаковки, ${cur()}</label>
          <input class="input" id="mPrice" inputmode="decimal" value="${draft.packPrice}" placeholder="60">
          <div class="err" id="mPriceErr" hidden>Больше нуля</div>
        </div>
      </div>
      <p class="hint" id="mCalc" style="font-size:14px;color:var(--text-2);margin:0 2px 14px"></p>
      ${isNew ? "" : `<button type="button" class="btn danger block" id="mDelete" style="margin:2px 0 10px">Удалить сырьё</button>`}
    </div>
    <div class="sheet-footer">
      <button class="btn ghost" data-close>Отмена</button>
      <button class="btn" id="mSave">Сохранить</button>
    </div>`);

  const $ = sel => overlay.querySelector(sel);

  function updCalc() {
    const qty = parseNum($("#mQty").value);
    const price = parseNum($("#mPrice").value);
    const unit = $("#mUnit").value;
    $("#mCalc").textContent = qty > 0 && price > 0
      ? `Цена за единицу: ${fmtPerUnit(price / qty, unit)}`
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
      ? `\n\nИспользуется в ${used.length} изделиях (${used.map(p => p.name).join(", ")}) — компонент будет удалён из их состава.`
      : "";
    if (!confirm(`Удалить «${draft.name}»?${warn}`)) return;
    state.data.materials = state.data.materials.filter(m => m.id !== id);
    state.data.products.forEach(p => { p.components = p.components.filter(c => c.materialId !== id); });
    save(); closeSheet(overlay); render();
    toast("Сырьё удалено");
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

    Object.assign(draft, { name, unit: $("#mUnit").value, packQty: qty, packPrice: price, group: draft.group || classifyMaterial(name) });
    const idx = state.data.materials.findIndex(m => m.id === draft.id);
    if (idx >= 0) state.data.materials[idx] = draft;
    else state.data.materials.push(draft);
    save(); closeSheet(overlay); render();
    toast(isNew ? "Сырьё добавлено" : "Сохранено");
  });
}

/* ================== Экспорт / импорт ================== */
function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const d = new Date();
  a.download = `pekarnya-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Файл с данными сохранён");
}
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
      `Найдено: ${parsed.products.length} изделий (из них ${nf} полуфабрикатов), ` +
      `${parsed.materials.length} позиций сырья${noPrice ? `, без цены: ${noPrice}` : ""}.\n\n` +
      `Заменить все текущие данные? Фото и цены, введённые вручную, будут потеряны.`)) return;
    state.data = { settings: state.data.settings, ...parsed };
    save(); render();
    toast("Тех карты загружены из Excel");
  } catch (e) {
    toast("Не удалось разобрать файл — нужен Excel с калькуляционными картами");
  }
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.materials) || !Array.isArray(data.products)) throw new Error("bad format");
      if (!data.settings) data.settings = { currency: cur() };
      ensureGroups(data);
      if (!confirm(`Заменить все текущие данные данными из файла?\n(${data.materials.length} поз. сырья, ${data.products.length} изделий)`)) return;
      state.data = data;
      save(); render();
      toast("Данные импортированы");
    } catch {
      toast("Не удалось прочитать файл — это не резервная копия приложения");
    }
  };
  reader.readAsText(file);
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

  if (e.target.closest("[data-export]")) { exportData(); return; }
  if (e.target.closest("[data-export-xlsx]")) {
    toast("Готовлю Excel…");
    loadScript("vendor/xlsx.full.min.js")
      .then(() => loadScript("export-docs.js"))
      .then(() => window.exportExcelFile())
      .catch(() => toast("Нет сети — попробуйте позже"));
    return;
  }
  if (e.target.closest("[data-export-pdf]")) {
    toast("Готовлю PDF…");
    loadScript("vendor/pdfmake.min.js")
      .then(() => loadScript("vendor/vfs_fonts.js"))
      .then(() => loadScript("export-docs.js"))
      .then(() => window.exportPdfFile())
      .catch(() => toast("Нет сети — попробуйте позже"));
    return;
  }
  if (e.target.closest("[data-import]")) { document.getElementById("importInput").click(); return; }
  if (e.target.closest("[data-import-xlsx]")) { document.getElementById("importXlsxInput").click(); return; }
});

document.getElementById("view").addEventListener("input", e => {
  if (e.target.id === "stockSearch") {
    state.stockSearch = e.target.value;
    document.getElementById("stockList").innerHTML = stockListHtml();
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
      toast(p.onDisplay ? "Выставлено на витрину" : "Убрано с витрины");
    }
    return;
  }
  if (e.target.id === "curSelect") {
    state.data.settings.currency = e.target.value;
    save();
    toast("Валюта: " + e.target.value);
    return;
  }
  if (e.target.id === "importInput" && e.target.files[0]) {
    importData(e.target.files[0]);
    e.target.value = "";
    return;
  }
  if (e.target.id === "importXlsxInput" && e.target.files[0]) {
    importXlsx(e.target.files[0]);
    e.target.value = "";
  }
});

/* ================== Запуск ================== */
load().then(() => switchTab("vitrina"));

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
