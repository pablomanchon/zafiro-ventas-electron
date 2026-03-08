import fs from "fs";
import crypto from "crypto";
import os from "os";
import path from "path";

const SECRET = "mi-clave-secreta-privada"; // CAMBIAR
const DAYS = 30;
const WARNING_DAYS = 5;

const APP_NAME = "Zafiro Stock y Ventas";

// =====================================================
// Obtener carpeta de datos de la app
// =====================================================
function getAppDataDir() {
  if (process.platform === "win32" && process.env.APPDATA) {
    return process.env.APPDATA;
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support");
  }

  return path.join(os.homedir(), ".config");
}

// =====================================================
// Ruta final del archivo de licencia
// =====================================================
function getLicensePath() {
  // Si Electron pasa la ruta por env la usamos
  if (process.env.ZAFIRO_LICENSE_PATH) {
    return process.env.ZAFIRO_LICENSE_PATH;
  }

  return path.join(getAppDataDir(), APP_NAME, "license.dat");
}

const LICENSE_FILE = getLicensePath();

// =====================================================
// Hardware ID
// =====================================================
function getHardwareId() {
  return os.hostname();
}

// =====================================================
// Crear hash
// =====================================================
function createHash(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

// =====================================================
// Validar licencia
// =====================================================
export function validateLicense() {
  const hwid = getHardwareId();

  // asegurarse que exista la carpeta
  fs.mkdirSync(path.dirname(LICENSE_FILE), { recursive: true });

  // =====================================================
  // 1) Si la licencia NO existe → crear trial
  // =====================================================
  if (!fs.existsSync(LICENSE_FILE)) {
    const installDate = new Date();
    const expiresAt = new Date(
      installDate.getTime() + DAYS * 24 * 60 * 60 * 1000
    );

    const content = {
      installDate: installDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hwid,
    };

    const json = JSON.stringify(content);
    const hash = createHash(json);

    fs.writeFileSync(LICENSE_FILE, JSON.stringify({ content, hash }));

    return {
      valid: true,
      daysLeft: DAYS,
      warning: false,
    };
  }

  // =====================================================
  // 2) Leer licencia existente
  // =====================================================
  const { content, hash } = JSON.parse(fs.readFileSync(LICENSE_FILE, "utf8"));

  const recalculatedHash = createHash(JSON.stringify(content));

  // -----------------------------------------------------
  // Detectar manipulación
  // -----------------------------------------------------
  if (hash !== recalculatedHash) {
    const err: any = new Error("LICENCIA_MANIPULADA");
    err.code = "LICENSE_TAMPERED";
    throw err;
  }

  // -----------------------------------------------------
  // Validar hardware
  // -----------------------------------------------------
  if (content.hwid !== hwid) {
    const err: any = new Error("LICENCIA_INVALIDA_DISPOSITIVO");
    err.code = "LICENSE_INVALID_DEVICE";
    throw err;
  }

  // -----------------------------------------------------
  // Validar expiración
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
  // Licencia válida
  // =====================================================
  return {
    valid: true,
    daysLeft,
    warning: daysLeft <= WARNING_DAYS,
  };
}