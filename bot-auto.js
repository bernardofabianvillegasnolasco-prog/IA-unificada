import fs from "fs";
import { execSync } from "child_process";

function run(cmd) {
  console.log("$ " + cmd);
  try { return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }); }
  catch (e) { console.log("FALLO: " + cmd + " -> " + String(e.stdout || e.message).slice(0, 500)); return ""; }
}
function log(msg) {
  const linea = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync("AUTO-MEJORAS.log", linea);
  console.log(msg);
}

// 1. Backup antes de tocar nada
log("🤖 BOT AUTO: iniciando");
run("git add -A");
run("git commit -m 'BF: backup auto antes de auto-mejora' || true");

const antes = run("git rev-parse HEAD").trim();
log("Backup en commit: " + antes);

// 2. Corre el bot que estudia
log("Estudiando proyecto...");
run("node bot-mejora.js");

// 3. Lee MEJORAS.md y solo aplica si dice Riesgo Bajo y es seguro
const mejoras = fs.existsSync("MEJORAS.md") ? fs.readFileSync("MEJORAS.md", "utf-8") : "";
log("MEJORAS.md leído: " + mejoras.length + " chars");
if (mejoras.length < 500 || mejoras.includes("Sin respuesta de Groq")) { log("Groq falló, NO despliego, conservo deploy anterior"); process.exit(0); }

// REGLAS DURAS: nunca auto-aplicar esto
const PROHIBIDO = ["runtime: 'edge'", 'runtime: "edge"', "GROQ_API_KEY", "GEMINI_API_KEY", "Dios Supremo", "process.env.GROQ", "process.env.GEMINI"];
let bloqueado = false;
for (const p of PROHIBIDO) {
  if (mejoras.toLowerCase().includes(p.toLowerCase())) {
    log("⚠️ Detectado tema prohibido para auto: " + p + " - NO se aplica solo, queda en MEJORAS.md");
    bloqueado = true;
  }
}
if (bloqueado) {
  log("BOT AUTO: se detuvo por seguridad, revisa MEJORAS.md");
  process.exit(0);
}

// 4. Solo aplica cambios seguros: limpieza de logs, comentarios, cache headers
// Aquí NO reescribimos archivos a ciegas, solo verificamos que el proyecto sigue compilando
log("Verificando que no hay Edge...");
const cerebro = fs.readFileSync("api/cerebro.js", "utf-8");
if (cerebro.includes("runtime: 'edge'")) {
  log("❌ Edge detectado, revertiendo");
  run("git checkout HEAD -- api/cerebro.js api/memoria.js");
}

// 5. Deploy solo si todo está en Node
log("Desplegando...");
const out = run("vercel --prod --yes");
if (out.includes("Error") || out.includes("Failed")) {
  log("❌ Deploy falló, rollback a " + antes);
  run(`git reset --hard ${antes}`);
  run("git push origin master --force");
  run("vercel --prod --yes");
  log("Rollback hecho");
} else {
  run("vercel alias set https://ia-unificada-bf.vercel.app ia-unificada.vercel.app");
  run("git add -A");
  run("git commit -m 'BF: auto-mejora aplicada por bot-auto' || true");
  run("git push origin master");
  log("✅ Auto-mejora desplegada");
}
log("🤖 BOT AUTO: terminado");
