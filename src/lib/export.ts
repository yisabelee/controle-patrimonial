import { STATUS_LABEL, formatarData, resumir, type PatrimonioView } from "./patrimonio";

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function carimbo() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

function geradoEm() {
  return new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export async function exportarExcel(rows: PatrimonioView[], filtros: string[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  const ws = wb.addWorksheet("Patrimônios", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Número do patrimônio", key: "numero", width: 20 },
    { header: "Descrição do bem", key: "descricao", width: 42 },
    { header: "Setor responsável pela carga", key: "setor", width: 30 },
    { header: "Localização atual", key: "localizacao", width: 28 },
    { header: "Quem utiliza o bem", key: "responsavel", width: 26 },
    { header: "Última data de conferência", key: "data", width: 18 },
    { header: "Status da conferência", key: "status", width: 18 },
    { header: "Observações", key: "obs", width: 50 },
  ];
  rows.forEach((r) =>
    ws.addRow({
      numero: r.numero,
      descricao: r.descricao,
      setor: r.setor,
      localizacao: r.localizacao,
      responsavel: r.responsavel_uso ?? "",
      data: formatarData(r.ultima_conferencia),
      status: STATUS_LABEL[r.status],
      obs: r.observacoes ?? "",
    }),
  );
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A4D" } };
  head.alignment = { vertical: "middle", wrapText: true };
  head.height = 30;
  ws.eachRow((row, i) => {
    if (i > 1) row.alignment = { vertical: "top", wrapText: true };
  });
  ws.autoFilter = { from: "A1", to: "H1" };

  const r = resumir(rows);
  const info = wb.addWorksheet("Resumo");
  info.columns = [{ width: 32 }, { width: 50 }];
  info.addRows([
    ["Relatório de Controle Patrimonial"],
    ["Gerado em", geradoEm()],
    ["Total de registros", r.total],
    ["Encontrados", r.encontrados],
    ["Não encontrados", r.naoEncontrados],
    ["Pendentes de conferência", r.pendentes],
    ["% encontrados", `${r.percentualEncontrados.toLocaleString("pt-BR")}%`],
    ["Filtros", filtros.length ? filtros.join(" · ") : "Nenhum"],
  ]);
  info.getRow(1).font = { bold: true, size: 14 };

  const buf = await wb.xlsx.writeBuffer();
  baixar(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `patrimonios_${carimbo()}.xlsx`,
  );
}

export async function exportarPdf(rows: PatrimonioView[], filtros: string[]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const r = resumir(rows);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório de Controle Patrimonial", 12, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`Gerado em ${geradoEm()}`, 12, 21);
  doc.text(`Filtros: ${filtros.length ? filtros.join(" · ") : "nenhum (todos os registros)"}`, 12, 26, {
    maxWidth: W - 24,
  });
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total: ${r.total}   Encontrados: ${r.encontrados}   Não encontrados: ${r.naoEncontrados}   Pendentes: ${r.pendentes}   % encontrados: ${r.percentualEncontrados.toLocaleString("pt-BR")}%`,
    12,
    33,
  );

  autoTable(doc, {
    startY: 37,
    margin: { left: 12, right: 12, bottom: 14 },
    head: [["Número", "Descrição do bem", "Setor da carga", "Localização atual", "Quem utiliza", "Últ. conferência", "Status", "Observações"]],
    body: rows.map((x) => [
      x.numero,
      x.descricao,
      x.setor,
      x.localizacao,
      x.responsavel_uso ?? "",
      formatarData(x.ultima_conferencia),
      STATUS_LABEL[x.status],
      x.observacoes ?? "",
    ]),
    styles: { font: "helvetica", fontSize: 7.5, cellPadding: 1.6, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [31, 58, 77], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 248] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 60 },
      2: { cellWidth: 38 },
      3: { cellWidth: 36 },
      4: { cellWidth: 30 },
      5: { cellWidth: 22 },
      6: { cellWidth: 24 },
      7: { cellWidth: "auto" },
    },
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 6) {
        const v = String(d.cell.raw);
        d.cell.styles.fontStyle = "bold";
        d.cell.styles.textColor =
          v === "Encontrado" ? [22, 120, 70] : v === "Não encontrado" ? [180, 35, 35] : [150, 100, 0];
      }
    },
  });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${n}`, W - 12, doc.internal.pageSize.getHeight() - 6, { align: "right" });
  }
  doc.save(`relatorio_patrimonial_${carimbo()}.pdf`);
}
