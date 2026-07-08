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
    ["№", "Компонент", "Од.", "Брутто", "Нетто", `Ціна, ${c}/од`, `Сума, ${c}`],
  ];
  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

  for (const g of groupedProducts()) {
    aoa.push([]);
    merges.push({ s: { r: aoa.length, c: 0 }, e: { r: aoa.length, c: 6 } });
    aoa.push([g.label.toUpperCase()]);
    for (const p of g.list) {
      const y = prodYield(p);
      merges.push({ s: { r: aoa.length, c: 0 }, e: { r: aoa.length, c: 4 } });
      aoa.push([`${p.name} — вихід: ${fmtYield(y)}`]);
      p.components.forEach((comp, i) => {
        const ref = compRef(comp);
        if (!ref) return;
        aoa.push([
          i + 1,
          ref.name + (ref.kind === "product" ? " (н/ф)" : ""),
          ref.unit,
          comp.brutto,
          compNetto(comp),
          ref.unitPrice > 0 && ref.unitPrice < 0.1 ? Number(ref.unitPrice.toFixed(4)) : r2(ref.unitPrice),
          r2(compCost(comp)),
        ]);
      });
      const cost = productCost(p);
      aoa.push(["", "Собівартість", "", "", "", "", r2(cost)]);
      aoa.push(["", "Націнка, %", "", "", "", "", Number(p.markup) || 0]);
      aoa.push(["", "Ціна продажу", "", "", "", "", salePrice(p)]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 4 }, { wch: 42 }, { wch: 5 }, { wch: 9 }, { wch: 9 }, { wch: 11 }, { wch: 10 }];
  ws["!merges"] = merges;

  const aoa2 = [
    [`Склад сировини — ${docDateStr()}`],
    [],
    ["Назва", "Од.", "В упаковці", `Ціна упаковки, ${c}`, `Ціна за од., ${c}`],
  ];
  for (const m of state.data.materials) {
    aoa2.push([m.name, m.unit, m.packQty, m.packPrice, m.packQty ? Number((m.packPrice / m.packQty).toFixed(4)) : 0]);
  }
  const ws2 = XLSX.utils.aoa_to_sheet(aoa2);
  ws2["!cols"] = [{ wch: 42 }, { wch: 5 }, { wch: 11 }, { wch: 16 }, { wch: 13 }];
  ws2["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

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
        { text: "Компонент", style: "th" }, { text: "Брутто", style: "thr" },
        { text: "Нетто", style: "thr" }, { text: `Ціна, ${c}/од`, style: "thr" },
        { text: `Сума, ${c}`, style: "thr" },
      ]];
      for (const comp of p.components) {
        const ref = compRef(comp);
        if (!ref) continue;
        body.push([
          ref.name + (ref.kind === "product" ? " (н/ф)" : ""),
          { text: `${fmtNum(comp.brutto, 3)} ${ref.unit}`, alignment: "right" },
          { text: fmtNum(compNetto(comp), 3), alignment: "right" },
          { text: fmtNum(ref.unitPrice, ref.unitPrice > 0 && ref.unitPrice < 0.1 ? 4 : 2), alignment: "right" },
          { text: fmtNum(compCost(comp), 2), alignment: "right" },
        ]);
      }
      const cost = productCost(p);
      body.push([
        { text: "Собівартість", bold: true }, "", "", "",
        { text: money(cost), bold: true, alignment: "right" },
      ]);
      body.push([
        { text: `Ціна продажу (націнка ${fmtNum(p.markup, 0)}%)`, bold: true, color: "#B45309" }, "", "", "",
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
            table: { headerRows: 1, widths: ["*", 55, 45, 55, 55], body },
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
    defaultStyle: { fontSize: 9, lineHeight: 1.15 },
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

/* ---------- PDF меню: категорія на окремому аркуші, дві колонки, без грамовки ---------- */
function buildMenuPdfDoc() {
  const c = cur();
  const displayed = state.data.products.filter(p => p.onDisplay);
  const groups = [];
  for (const cat of CATEGORIES) {
    const list = displayed.filter(p => p.category === cat.id);
    if (list.length) groups.push({ label: cat.label, list });
  }
  const other = displayed.filter(p => !CATEGORIES.some(cat => cat.id === p.category));
  if (other.length) groups.push({ label: "Інше", list: other });

  const content = [];
  groups.forEach((g, gi) => {
    content.push({
      table: { widths: ["*"], body: [[{
        text: g.label.toUpperCase(),
        color: "#FFFFFF", bold: true, fontSize: 24, alignment: "center",
        fillColor: "#6B3F1D", margin: [10, 12, 10, 12],
      }]] },
      layout: "noBorders",
      margin: [0, 0, 0, 20],
      ...(gi > 0 ? { pageBreak: "before" } : {}),
    });
    const rows = g.list.map(p => ({
      columns: [
        { text: p.name, bold: true, fontSize: 12 },
        { text: `${fmtNum(salePrice(p), 0)} ${c}`, bold: true, fontSize: 12, width: "auto", color: "#6B3F1D" },
      ],
      columnGap: 10,
      margin: [0, 0, 0, 11],
    }));
    const half = Math.ceil(rows.length / 2);
    content.push({
      columns: [
        { width: "*", stack: rows.slice(0, half) },
        { width: "*", stack: rows.slice(half) },
      ],
      columnGap: 28,
    });
  });

  if (!groups.length) content.push({ text: "На вітрині немає жодного виробу", fontSize: 11, color: "#777777" });

  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content,
    defaultStyle: { fontSize: 11, lineHeight: 1.2 },
  };
}

function exportMenuPdf() {
  pdfMake.createPdf(buildMenuPdfDoc()).download(`menu-${docFileStamp()}.pdf`);
}

window.exportExcelFile = exportExcelFile;
window.exportPdfFile = exportPdfFile;
window.exportMenuPdf = exportMenuPdf;
window.buildExcelWorkbook = buildExcelWorkbook;
window.buildPdfDoc = buildPdfDoc;
window.buildMenuPdfDoc = buildMenuPdfDoc;
