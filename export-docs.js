"use strict";

/* Экспорт тех карт в Excel и PDF.
   Использует глобальные функции app.js: productCost, prodYield, salePrice,
   compRef, compNetto, compCost, fmtYield, cur, CATEGORIES.
   Библиотеки (SheetJS / pdfmake) подгружаются лениво из app.js перед вызовом. */

function docDateStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}
function docFileStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function r2(n) { return Math.round(n * 100) / 100; }

function groupedProducts() {
  const items = state.data.products;
  const groups = [];
  for (const c of CATEGORIES) {
    const list = items.filter(p => p.category === c.id);
    if (list.length) groups.push({ label: c.label, list });
  }
  const other = items.filter(p => !CATEGORIES.some(c => c.id === p.category));
  if (other.length) groups.push({ label: "Інше", list: other });
  return groups;
}

/* ---------- Excel ---------- */
function buildExcelWorkbook() {
  const c = cur();
  const aoa = [
    [`Калькуляційні карти — ${docDateStr()}`],
    [],
    ["№", "Код", "Компонент", "Од.", "Брутто", "Нетто", `Ціна, ${c}/од`, `Сума, ${c}`],
  ];
  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

  for (const g of groupedProducts()) {
    aoa.push([]);
    merges.push({ s: { r: aoa.length, c: 0 }, e: { r: aoa.length, c: 7 } });
    aoa.push([g.label.toUpperCase()]);
    for (const p of g.list) {
      const y = prodYield(p);
      merges.push({ s: { r: aoa.length, c: 0 }, e: { r: aoa.length, c: 5 } });
      aoa.push([`${p.name} — вихід: ${fmtYield(y)}`]);
      p.components.forEach((comp, i) => {
        const ref = compRef(comp);
        if (!ref) return;
        const code = comp.materialId ? (matById(comp.materialId) || {}).code || "" : "";
        aoa.push([
          i + 1,
          code,
          ref.name + (ref.kind === "product" ? " (н/ф)" : ""),
          ref.unit,
          comp.brutto,
          compNetto(comp),
          ref.unitPrice > 0 && ref.unitPrice < 0.1 ? Number(ref.unitPrice.toFixed(4)) : r2(ref.unitPrice),
          r2(compCost(comp)),
        ]);
      });
      const cost = productCost(p);
      aoa.push(["", "", "Собівартість", "", "", "", "", r2(cost)]);
      aoa.push(["", "", "Націнка, %", "", "", "", "", Number(p.markup) || 0]);
      aoa.push(["", "", "Ціна продажу", "", "", "", "", salePrice(p)]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 4 }, { wch: 7 }, { wch: 42 }, { wch: 5 }, { wch: 9 }, { wch: 9 }, { wch: 11 }, { wch: 10 }];
  ws["!merges"] = merges;

  const aoa2 = [
    [`Склад сировини — ${docDateStr()}`],
    [],
    ["Код", "Назва", "Од.", "В упаковці", `Ціна упаковки, ${c}`, `Ціна за од., ${c}`],
  ];
  for (const m of state.data.materials) {
    aoa2.push([m.code || "", m.name, m.unit, m.packQty, m.packPrice, m.packQty ? Number((m.packPrice / m.packQty).toFixed(4)) : 0]);
  }
  const ws2 = XLSX.utils.aoa_to_sheet(aoa2);
  ws2["!cols"] = [{ wch: 7 }, { wch: 42 }, { wch: 5 }, { wch: 11 }, { wch: 16 }, { wch: 13 }];
  ws2["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Тех карти");
  XLSX.utils.book_append_sheet(wb, ws2, "Склад");
  return wb;
}

function exportExcelFile() {
  XLSX.writeFile(buildExcelWorkbook(), `tehkarty-${docFileStamp()}.xlsx`);
}

/* ---------- PDF ---------- */
function buildPdfDoc() {
  const c = cur();
  const money = n => fmtNum(n, 2).replace(/ /g, " ") + " " + c;
  const content = [
    { text: `Калькуляційні карти`, style: "title" },
    { text: docDateStr(), style: "muted", margin: [0, 0, 0, 12] },
  ];

  for (const g of groupedProducts()) {
    content.push({ text: g.label, style: "h1" });
    for (const p of g.list) {
      const y = prodYield(p);
      const body = [[
        { text: "Код", style: "th" }, { text: "Компонент", style: "th" }, { text: "Брутто", style: "thr" },
        { text: "Нетто", style: "thr" }, { text: `Ціна, ${c}/од`, style: "thr" },
        { text: `Сума, ${c}`, style: "thr" },
      ]];
      for (const comp of p.components) {
        const ref = compRef(comp);
        if (!ref) continue;
        const code = comp.materialId ? (matById(comp.materialId) || {}).code || "" : "";
        body.push([
          { text: code, color: "#777777" },
          ref.name + (ref.kind === "product" ? " (н/ф)" : ""),
          { text: `${fmtNum(comp.brutto, 3)} ${ref.unit}`, alignment: "right" },
          { text: fmtNum(compNetto(comp), 3), alignment: "right" },
          { text: fmtNum(ref.unitPrice, ref.unitPrice > 0 && ref.unitPrice < 0.1 ? 4 : 2), alignment: "right" },
          { text: fmtNum(compCost(comp), 2), alignment: "right" },
        ]);
      }
      const cost = productCost(p);
      body.push([
        { text: "Собівартість", bold: true, colSpan: 2 }, "", "", "", "",
        { text: money(cost), bold: true, alignment: "right" },
      ]);
      body.push([
        { text: `Ціна продажу (націнка ${fmtNum(p.markup, 0)}%)`, bold: true, color: "#B45309", colSpan: 2 }, "", "", "", "",
        { text: fmtNum(salePrice(p), 0) + " " + c, bold: true, alignment: "right", color: "#B45309" },
      ]);

      content.push({
        unbreakable: p.components.length <= 12,
        stack: [
          {
            table: { widths: ["*"], body: [[{
              text: `${p.name} — вихід: ${fmtYield(y)}`,
              bold: true, color: "#000000", fontSize: 10.5,
              fillColor: "#BDE26B", margin: [6, 4, 6, 4],
            }]] },
            layout: "noBorders", margin: [0, 6, 0, 0],
          },
          {
            table: { headerRows: 1, widths: [32, "*", 50, 42, 50, 50], body },
            layout: {
              hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.7 : 0.3),
              vLineWidth: () => 0,
              hLineColor: () => "#BBBBBB",
              paddingTop: () => 3, paddingBottom: () => 3,
            },
            margin: [0, 2, 0, 12],
          },
        ],
      });
    }
  }

  content.push({ text: "Склад сировини", style: "h1", pageBreak: "before" });
  const matBody = [[
    { text: "Назва", style: "th" }, { text: "Од.", style: "th" },
    { text: "В упаковці", style: "thr" }, { text: `Ціна уп., ${c}`, style: "thr" },
    { text: `За од., ${c}`, style: "thr" },
  ]];
  for (const m of state.data.materials) {
    const up = m.packQty ? m.packPrice / m.packQty : 0;
    matBody.push([
      m.name, m.unit,
      { text: fmtNum(m.packQty, 3), alignment: "right" },
      { text: m.packPrice > 0 ? fmtNum(m.packPrice, 2) : "—", alignment: "right" },
      { text: m.packPrice > 0 ? fmtNum(up, up < 0.1 ? 4 : 2) : "—", alignment: "right" },
    ]);
  }
  content.push({
    table: { headerRows: 1, widths: ["*", 35, 60, 65, 60], body: matBody },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.7 : 0.3),
      vLineWidth: () => 0,
      hLineColor: () => "#BBBBBB",
      paddingTop: () => 3, paddingBottom: () => 3,
    },
    margin: [0, 4, 0, 0],
  });

  return {
    pageSize: "A4",
    pageMargins: [36, 36, 36, 44],
    footer: (page, pages) => ({
      text: `${page} / ${pages}`, alignment: "center", fontSize: 8, color: "#888888", margin: [0, 14, 0, 0],
    }),
    content,
    defaultStyle: { font: "Menu", fontSize: 9, lineHeight: 1.15 },
    styles: {
      title: { fontSize: 16, bold: true },
      muted: { fontSize: 9, color: "#777777" },
      h1: { fontSize: 12, bold: true, margin: [0, 10, 0, 6] },
      h2: { fontSize: 10.5, bold: true, margin: [0, 4, 0, 2] },
      th: { bold: true, fontSize: 8.5, color: "#555555" },
      thr: { bold: true, fontSize: 8.5, color: "#555555", alignment: "right" },
    },
  };
}

function exportPdfFile() {
  pdfMake.createPdf(buildPdfDoc()).download(`tehkarty-${docFileStamp()}.pdf`);
}

/* ---------- PDF меню на декоративному фоні (bgmenu) ----------
   Категорія — коричнева напівпрозора плашка по центру зверху.
   Кожен виріб — біла напівпрозора «таблетка»: назва (1-2 рядки) + ціна,
   ціна вирівняна по вертикальному центру таблетки. 15 позицій на аркуш. */

/* Замір ширини тексту шрифтом Menu (для переносу довгих назв у 2 рядки) */
let _menuMeasureCtx = null;
async function menuMeasurer() {
  if (!_menuMeasureCtx) {
    try {
      const b64 = pdfMake.vfs["MenuSans-Regular.ttf"];
      const bin = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
      const ff = new FontFace("MenuMeasure", bin.buffer);
      await ff.load();
      document.fonts.add(ff);
    } catch (e) { /* фолбек на дефолтний шрифт */ }
    _menuMeasureCtx = document.createElement("canvas").getContext("2d");
  }
  return (text, size, bold) => {
    _menuMeasureCtx.font = `${bold ? "bold " : ""}${size}px MenuMeasure, sans-serif`;
    return _menuMeasureCtx.measureText(text).width;
  };
}

/* Перенос назви максимум у 2 рядки під ширину maxW */
function wrapName(name, maxW, measure, size) {
  if (measure(name, size, true) <= maxW) return [name];
  const words = name.split(" ");
  let l1 = "", i = 0;
  for (; i < words.length; i++) {
    const t = l1 ? l1 + " " + words[i] : words[i];
    if (measure(t, size, true) > maxW && l1) break;
    l1 = t;
  }
  let l2 = words.slice(i).join(" ") || "";
  if (!l1) { l1 = name; l2 = ""; }        // одне довге слово — лишаємо як є
  // якщо другий рядок задовгий — обрізаємо з трьома крапками
  while (l2 && measure(l2, size, true) > maxW) l2 = l2.slice(0, -2);
  if (l2 !== (words.slice(i).join(" ") || "")) l2 = l2.replace(/…?$/, "…");
  return l2 ? [l1, l2] : [l1];
}

async function buildMenuPdfDoc(bg) {
  const c = cur();
  const measure = await menuMeasurer();
  const PAGE_W = 595.28, PAGE_H = 841.89;

  // геометрія
  const PILL_X = 66, PILL_W = 463;                 // таблетка: x=66..529
  const NAME_X = PILL_X + 24;
  const PRICE_ZONE = 74;                            // місце під ціну справа
  const NAME_MAX_W = PILL_W - 24 - PRICE_ZONE;
  const PER_PAGE = 15;
  const ROWS_TOP = 132;
  const SLOT_H = (PAGE_H - ROWS_TOP - 40) / PER_PAGE;
  const NAME_SIZE = 13, PRICE_SIZE = 14, LINE_H = 15;

  const displayed = state.data.products.filter(p => p.onDisplay);
  const groups = [];
  for (const cat of CATEGORIES) {
    const list = displayed.filter(p => p.category === cat.id);
    if (list.length) groups.push({ label: cat.label, list });
  }
  const other = displayed.filter(p => !CATEGORIES.some(cat => cat.id === p.category));
  if (other.length) groups.push({ label: "Інше", list: other });

  // розбивка на сторінки по 15
  const pages = [];
  for (const g of groups) {
    for (let i = 0; i < g.list.length; i += PER_PAGE) {
      pages.push({ title: g.label, rows: g.list.slice(i, i + PER_PAGE) });
    }
  }
  if (!pages.length) pages.push({ title: "Меню", rows: [] });

  const content = [];
  pages.forEach((pg, pi) => {
    const nodes = [];

    // заголовок категорії — коричнева напівпрозора плашка по центру зверху
    const TW = Math.max(220, Math.min(360, measure(pg.title.toUpperCase(), 24, true) + 64));
    const TX = (PAGE_W - TW) / 2, TY = 50, TH = 54;
    nodes.push({ canvas: [{ type: "rect", x: TX, y: TY, w: TW, h: TH, r: 16, color: "#5A3418", fillOpacity: 0.8 }], absolutePosition: { x: 0, y: 0 } });
    nodes.push({ text: pg.title.toUpperCase(), absolutePosition: { x: 0, y: TY + (TH - 26) / 2 }, width: PAGE_W, alignment: "center", color: "#FFFFFF", bold: true, fontSize: 24 });

    // рядки-таблетки
    pg.rows.forEach((p, ri) => {
      const lines = wrapName(p.name, NAME_MAX_W, measure, NAME_SIZE);
      const two = lines.length > 1;
      const pillH = two ? 42 : 31;
      const slotTop = ROWS_TOP + ri * SLOT_H;
      const pillY = slotTop + (SLOT_H - pillH) / 2;
      const centerY = pillY + pillH / 2;

      nodes.push({ canvas: [{ type: "rect", x: PILL_X, y: pillY, w: PILL_W, h: pillH, r: pillH / 2, color: "#FFFFFF", fillOpacity: 0.82 }], absolutePosition: { x: 0, y: 0 } });

      let ny = centerY - (lines.length * LINE_H) / 2 - 1;
      lines.forEach(ln => {
        nodes.push({ text: ln, absolutePosition: { x: NAME_X, y: ny }, width: NAME_MAX_W, color: "#3A2717", bold: true, fontSize: NAME_SIZE });
        ny += LINE_H;
      });
      // ціна — вирівняна по вертикальному центру таблетки
      nodes.push({ text: `${fmtNum(salePrice(p), 0)} ${c}`, absolutePosition: { x: PILL_X, y: centerY - PRICE_SIZE * 0.62 }, width: PILL_W - 30, alignment: "right", color: "#5A3418", bold: true, fontSize: PRICE_SIZE });
    });

    if (pi > 0) nodes[0].pageBreak = "before";
    content.push({ stack: nodes });
  });

  return {
    pageSize: "A4",
    pageMargins: [0, 0, 0, 0],
    background: () => ({ image: bg, width: PAGE_W, height: PAGE_H }),
    content,
    defaultStyle: { font: "Menu" },
  };
}

/* Тех карти по категоріях, всередині категорії — за алфавітом (укр). */
function techPrintGroups() {
  const collator = new Intl.Collator("uk");
  const byName = (a, b) => collator.compare(a.name || "", b.name || "");
  const groups = [];
  for (const cat of CATEGORIES) {
    const list = state.data.products.filter(p => p.category === cat.id).sort(byName);
    if (list.length) groups.push({ label: cat.label, list });
  }
  const other = state.data.products.filter(p => !CATEGORIES.some(c => c.id === p.category)).sort(byName);
  if (other.length) groups.push({ label: "Інше", list: other });
  return groups;
}

/* ---------- PDF друк тех карт: формат складського документа, але без грошей
   (без собівартості та ціни продажу), максимально компактно ---------- */
function buildTechPrintPdfDoc() {
  const groups = techPrintGroups();

  const content = [
    { text: "Технологічні карти", style: "title" },
    { text: docDateStr(), style: "muted", margin: [0, 0, 0, 6] },
  ];

  for (const g of groups) {
    content.push({ text: g.label, style: "h1" });
    for (const p of g.list) {
      const y = prodYield(p);
      const body = [[
        { text: "Код", style: "th" },
        { text: "Компонент", style: "th" },
        { text: "Брутто", style: "thr" },
        { text: "Нетто", style: "thr" },
      ]];
      for (const comp of p.components) {
        const ref = compRef(comp);
        if (!ref) continue;
        const code = comp.materialId ? (matById(comp.materialId) || {}).code || "" : "";
        body.push([
          { text: code, color: "#555555" },
          ref.name + (ref.kind === "product" ? " (н/ф)" : ""),
          { text: `${fmtNum(comp.brutto, 3)} ${ref.unit}`, alignment: "right" },
          { text: fmtNum(compNetto(comp), 3), alignment: "right" },
        ]);
      }

      content.push({
        unbreakable: p.components.length <= 18,
        stack: [
          {
            table: { widths: ["*"], body: [[{
              text: `${p.name} — вихід: ${fmtYield(y)}`,
              bold: true, color: "#000000", fontSize: 9.5,
              fillColor: "#BDE26B", margin: [5, 1.5, 5, 1.5],
            }]] },
            layout: "noBorders", margin: [0, 3, 0, 0],
          },
          {
            table: { headerRows: 1, widths: [40, "*", 58, 48], body },
            layout: {
              hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.6 : 0.25),
              vLineWidth: () => 0,
              hLineColor: () => "#CCCCCC",
              paddingTop: () => 1, paddingBottom: () => 1,
            },
            margin: [0, 1, 0, 4],
          },
        ],
      });
    }
  }

  if (!groups.length) content.push({ text: "Немає тех карт", fontSize: 11, color: "#777777" });

  return {
    pageSize: "A4",
    pageMargins: [30, 30, 30, 32],
    footer: (page, pages) => ({
      text: `${page} / ${pages}`, alignment: "center", fontSize: 8, color: "#888888", margin: [0, 10, 0, 0],
    }),
    content,
    defaultStyle: { font: "Menu", fontSize: 8.5, lineHeight: 1.02 },
    styles: {
      title: { fontSize: 15, bold: true },
      muted: { fontSize: 8.5, color: "#777777" },
      h1: { fontSize: 11.5, bold: true, margin: [0, 7, 0, 3] },
      th: { bold: true, fontSize: 8, color: "#555555" },
      thr: { bold: true, fontSize: 8, color: "#555555", alignment: "right" },
    },
  };
}

function exportTechPrint() {
  pdfMake.createPdf(buildTechPrintPdfDoc()).download(`tehkarty-druk-${docFileStamp()}.pdf`);
}

function fetchDataUrl(url) {
  return fetch(url).then(r => r.blob()).then(b => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(b);
  }));
}

async function exportMenuPdf() {
  const bg = await fetchDataUrl("menu-bg.jpg");
  const doc = await buildMenuPdfDoc(bg);
  pdfMake.createPdf(doc).download(`menu-${docFileStamp()}.pdf`);
}

window.exportExcelFile = exportExcelFile;
window.exportPdfFile = exportPdfFile;
window.exportMenuPdf = exportMenuPdf;
window.exportTechPrint = exportTechPrint;
window.buildExcelWorkbook = buildExcelWorkbook;
window.buildPdfDoc = buildPdfDoc;
window.buildMenuPdfDoc = buildMenuPdfDoc;
window.buildTechPrintPdfDoc = buildTechPrintPdfDoc;
