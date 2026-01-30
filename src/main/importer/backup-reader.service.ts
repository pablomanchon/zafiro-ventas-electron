// src/importer/backup-reader.ts
import * as fs from "fs";
import * as path from "path";

export class BackupReader {
  constructor(private baseDir: string) {}

  private readRaw(fileName: string): string {
    const full = path.join(this.baseDir, fileName);
    if (!fs.existsSync(full)) return "";
    return fs.readFileSync(full, "utf-8").trim();
  }

  readJson<T = any>(fileName: string, fallback: T): T {
    const raw = this.readRaw(fileName);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      throw new Error(`JSON inválido en ${fileName}: ${(e as Error).message}`);
    }
  }

  // Helpers
  toDateFromMs(ms?: number | null): Date | undefined {
    if (!ms || typeof ms !== "number") return undefined;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
  }

  normMoveType(v?: string | null): "in" | "out" {
    const x = (v ?? "").toLowerCase();
    if (x === "in") return "in";
    if (x === "out") return "out";
    // por si viene "Ingreso"/"Egreso" u otro:
    return x.includes("out") || x.includes("egre") ? "out" : "in";
  }

  normMetodoPagoTipo(v?: string | null):
    | "debito"
    | "credito"
    | "efectivo"
    | "pendiente"
    | "usd"
    | "otro" {
    const x = (v ?? "").toLowerCase();
    if (x.includes("debit")) return "debito";
    if (x.includes("credit")) return "credito";
    if (x.includes("effective") || x.includes("cash") || x.includes("efect")) return "efectivo";
    if (x.includes("pending") || x.includes("pend")) return "pendiente";
    if (x.includes("usd") || x.includes("dolar") || x.includes("dólar")) return "usd";
    return "otro";
  }
}
