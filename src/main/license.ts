import fs from "fs";
import crypto from "crypto";
import os from "os";
import path from "path";

const LICENSE_FILE = path.join(process.cwd(), "license.dat");
const SECRET = "mi-clave-secreta-privada"; // CAMBIAR

const DAYS = 30; // duración de licencia
const WARNING_DAYS = 5; // mostrar aviso si faltan ≤ 5 días

function getHardwareId() {
  return os.hostname();
}

function createHash(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

export function validateLicense() {
  const hwid = getHardwareId();

  // =====================================================
  // 1) Si la licencia NO existe → crearla
  // =====================================================
  if (!fs.existsSync(LICENSE_FILE)) {
    const installDate = new Date();
    const expiresAt = new Date(installDate.getTime() + DAYS * 24 * 60 * 60 * 1000);

    const content = {
      installDate: installDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hwid,
    };

    const json = JSON.stringify(content);
    const hash = createHash(json);

    fs.writeFileSync(LICENSE_FILE, JSON.stringify({ content, hash }));

    return { valid: true, daysLeft: DAYS };
  }

  // =====================================================
  // 2) Leer archivo de licencia
  // =====================================================
  const { content, hash } = JSON.parse(fs.readFileSync(LICENSE_FILE, "utf8"));
  const recalculatedHash = createHash(JSON.stringify(content));

  // -----------------------------------------------------
  // 2.1) Validar manipulación del archivo
  // -----------------------------------------------------
  if (hash !== recalculatedHash) {
    const err: any = new Error("LICENCIA_MANIPULADA");
    err.code = "LICENSE_TAMPERED";
    throw err;
  }

  // -----------------------------------------------------
  // 2.2) Validar hardware
  // -----------------------------------------------------
  if (content.hwid !== hwid) {
    const err: any = new Error("LICENCIA_INCORRECTA");
    err.code = "LICENSE_INVALID_DEVICE";
    throw err;
  }

  // -----------------------------------------------------
  // 2.3) Validar expiración
  // -----------------------------------------------------
  const now = new Date();
  const expiresAt = new Date(content.expiresAt);

  const diffMs = expiresAt.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    const err: any = new Error("LICENCIA_EXPIRADA");
    err.code = "LICENSE_EXPIRED";
    throw err;
  }

  // =====================================================
  // 3) Licencia válida → devolver días restantes
  // =====================================================
  return {
    valid: true,
    daysLeft,
    warning: daysLeft <= WARNING_DAYS,
  };
}
