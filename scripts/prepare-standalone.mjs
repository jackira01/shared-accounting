// Copia los recursos estáticos dentro de la salida standalone para que
// `node .next/standalone/server.js` pueda servirlos (CSS, JS, imágenes, public/).
// Se ejecuta después de `next build`.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.error("No se encontró .next/standalone. Ejecuta `next build` primero.");
  process.exit(1);
}

function copy(src, dest) {
  if (!existsSync(src)) {
    console.warn(`Advertencia: no se encontró ${src}, se omite.`);
    return;
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log(`✓ ${src} -> ${dest}`);
}

copy(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));
copy(path.join(root, "public"), path.join(standaloneDir, "public"));
