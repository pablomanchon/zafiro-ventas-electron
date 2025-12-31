import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { Venta } from "./ventas/entities/venta.entity";

// Elegí una base. En Electron es mejor app.getPath("documents") o userData.
// Acá lo dejo simple: carpeta del proyecto (process.cwd()).
function getOutDir() {
  return path.join(process.cwd(), "Registro Ventas");
}

/**
 * Footer para la página actual
 */
function addFooter(doc: PDFKit.PDFDocument) {
  const left = doc.page.margins.left;
  const y = doc.page.height - doc.page.margins.bottom - 12;

  doc.save();
  doc.font("Helvetica").fontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString()}`, left, y, { align: "left" });
  doc.restore();
}

/**
 * Panel “flow” (una columna, ocupa todo el ancho).
 * Estima altura y si no entra hace addPage().
 */
function drawPanel(
  doc: PDFKit.PDFDocument,
  title: string,
  lines: string[],
  opts?: { padding?: number; gapAfter?: number }
) {
  const padding = opts?.padding ?? 10;
  const gapAfter = opts?.gapAfter ?? 14;

  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const titleH = 16;
  const lineH = 14;
  const height = padding * 2 + titleH + lines.length * lineH;

  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + height > bottomLimit) {
    doc.addPage();
  }

  const y = doc.y;

  doc.rect(x, y, width, height).stroke();

  doc.save();
  doc.x = x + padding;
  doc.y = y + padding;

  doc.font("Helvetica-Bold").fontSize(12).text(title);
  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(11);
  for (const line of lines) doc.text(line);

  doc.restore();

  doc.y = y + height + gapAfter;
}

/**
 * Panel posicionado (para 2 columnas).
 * Devuelve la altura usada.
 */
function drawPanelAt(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  title: string,
  lines: string[],
  opts?: { padding?: number }
): number {
  const padding = opts?.padding ?? 10;

  const titleH = 16;
  const lineH = 14;
  const height = padding * 2 + titleH + lines.length * lineH;

  doc.rect(x, y, width, height).stroke();

  doc.save();
  doc.x = x + padding;
  doc.y = y + padding;

  doc.font("Helvetica-Bold").fontSize(12).text(title);
  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(11);
  for (const line of lines) doc.text(line);

  doc.restore();

  return height;
}

export function createVentaPdf(venta: Venta) {
  const outDir = getOutDir();
  fs.mkdirSync(outDir, { recursive: true });

  const filePath = path.join(outDir, `Venta ${venta.id}.pdf`);

  // ✅ bufferPages para poder poner footer a páginas anteriores
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // Footer para páginas anteriores cuando se agrega una nueva
  doc.on("pageAdded", () => {
    const range = doc.bufferedPageRange();
    if (range.count >= 2) {
      doc.switchToPage(range.start + range.count - 2);
      addFooter(doc);
      doc.switchToPage(range.start + range.count - 1);
    }
  });

  // =========================
  // Header
  // =========================
  doc.font("Helvetica-Bold").fontSize(18).text(`Venta #${venta.id}`, { underline: true });
  doc.moveDown(0.7);

  // =========================
  // Fila 2 columnas: Venta + Cliente
  // =========================
  const pageLeft = doc.page.margins.left;
  const pageRight = doc.page.width - doc.page.margins.right;
  const gap = 10;

  const rowY = doc.y;
  const colWidth = (pageRight - pageLeft - gap) / 2;

  // calcular altura estimada de la fila (para salto de página si no entra)
  const padding = 10;
  const titleH = 16;
  const lineH = 14;

  const ventaLines = [
    `Fecha: ${venta.fecha ? new Date(venta.fecha as any).toLocaleString() : "-"}`,
    `Vendedor: ${venta.vendedor?.nombre ?? "-"}`,
    `Total: ${formatCentsARS((venta as any).total)}`,
  ];

  const clienteObj = venta.cliente as any;
  const clienteLines = [
    `Nombre: ${clienteObj?.nombre ?? "-"} ${clienteObj?.apellido ?? ""}`.trim(),
    `Teléfono: ${clienteObj?.telefono ?? "-"}`,
    `Email: ${clienteObj?.email ?? "-"}`,
    `Dirección: ${clienteObj?.direccion ?? "-"}`,
  ];

  const hVentaEst = padding * 2 + titleH + ventaLines.length * lineH;
  const hClienteEst = padding * 2 + titleH + clienteLines.length * lineH;
  const rowHeightEst = Math.max(hVentaEst, hClienteEst);

  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (rowY + rowHeightEst > bottomLimit) {
    doc.addPage();
  }

  const rowY2 = doc.y;

  const hVenta = drawPanelAt(doc, pageLeft, rowY2, colWidth, "Datos de la venta", ventaLines);
  const hCliente = drawPanelAt(
    doc,
    pageLeft + colWidth + gap,
    rowY2,
    colWidth,
    "Cliente",
    clienteLines
  );

  doc.y = rowY2 + Math.max(hVenta, hCliente) + 14;

  // =========================
  // Panel: Detalle / Items
  // =========================
  const detalles = venta.detalles ?? [];
  const detalleLines: string[] = [];

  if (!detalles.length) {
    detalleLines.push("Sin items.");
  } else {
    detalles.forEach((d: any, i: number) => {
      const nombre = d.item?.nombre ?? "Item";
      const cant = Number(d.item?.cantidad ?? 1);
      const precio = Number(d.item?.precio ?? 0);
      const subtotal = cant * precio;

      detalleLines.push(
        `${i + 1}. ${nombre}  x${cant}  ${formatCentsARS(precio)}  =  ${formatCentsARS(subtotal)}`
      );
    });

    const totalCalc = detalles.reduce((acc: number, d: any) => {
      const cant = Number(d.item?.cantidad ?? 0);
      const precio = Number(d.item?.precio ?? 0);
      return acc + cant * precio;
    }, 0);

    detalleLines.push("------------------------------");
    detalleLines.push(`Total items: ${formatCentsARS(totalCalc)}`);
  }

  drawPanel(doc, "Detalle", detalleLines, { gapAfter: 10 });

  // =========================
  // Panel: Pagos
  // =========================
  const pagos = (venta as any).pagos ?? [];
  const pagosLines: string[] = [];

  if (!pagos.length) {
    pagosLines.push("Sin pagos registrados.");
  } else {
    pagos.forEach((p: any, i: number) => {
      const metodoNombre = p.metodo?.nombre ?? p.metodo?.id ?? "(sin método)";
      const cuotas = p.cuotas != null ? ` | Cuotas: ${p.cuotas}` : "";
      pagosLines.push(`${i + 1}. ${metodoNombre}  ${formatCentsARS(p.monto)}${cuotas}`);
    });

    const totalPagos = pagos.reduce((acc: number, p: any) => acc + Number(p.monto ?? 0), 0);
    pagosLines.push("------------------------------");
    pagosLines.push(`Total pagos: ${formatCentsARS(totalPagos)}`);
  }

  drawPanel(doc, "Pagos", pagosLines);

  // ✅ Footer de la última página
  addFooter(doc);

  doc.end();

  return new Promise<string>((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}


export const formatCentsARS = (cents: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

