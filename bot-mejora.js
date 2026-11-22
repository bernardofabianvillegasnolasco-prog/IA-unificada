import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Carga llaves de ~/.bf-keys si no están en env
try {
  if (!process.env.GROQ_API_KEY) {
    const out = execSync("bash -c 'source ~/.bf-keys 2>/dev/null; echo $GROQ_API_KEY'", { encoding: "utf-8" }).trim();
    if (out) process.env.GROQ_API_KEY = out;
  }
} catch (e) {}
const GROQ_KEY = process.env.GROQ_API_KEY || "";
console.log("GROQ_LEN=" + GROQ_KEY.length);

async function leerProyecto() {
  const archivos = ["api/voz.js", "api/cerebro.js", "api/memoria.js", "index.html", "package.json"];
  let resumen = "";
  for (const f of archivos) {
    try {
      const txt = fs.readFileSync(path.join(process.cwd(), f), "utf-8");
      resumen += `\n\n=== ${f} (${txt.length} chars) ===\n` + txt.slice(0, 4000);
    } catch (e) { resumen += `\n\n=== ${f} NO EXISTE ===`; }
  }
  return resumen;
}

async function preguntarGroq(prompt) {
  const modelos = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  for (const modelo of modelos) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { role: "system", content: "Eres Copiloto BF, experto en mejorar proyectos web en Vercel + Node + EdgeTTS. Responde en español, concreto, con código listo para pegar." },
            { role: "user", content: prompt }
          ],
          temperature: 0.4
        })
      });
      const j = await r.json();
      if (j.choices?.[0]?.message?.content) return j.choices[0].message.content;
      console.log("Fallo modelo " + modelo + ": " + JSON.stringify(j).slice(0, 400));
    } catch (e) { console.log("Error modelo " + modelo + ": " + String(e).slice(0, 200)); }
  }
  return "Sin respuesta de Groq - revisa GROQ_LEN y que la llave esté en ~/.bf-keys";
}

async function main() {
  console.log("🤖 BOT MEJORA: estudiando proyecto...");
  const codigo = await leerProyecto();
  const fecha = new Date().toLocaleString("es-MX", { timeZone: "America/Phoenix" });
  const prompt = `Estudia este proyecto IA-Unificada y propón 5 mejoras concretas, ordenadas por impacto. Por cada mejora: problema, qué cambiar, código exacto, riesgo bajo/medio/alto. NO apliques cambios, solo propón.\n\nPROYECTO:\n${codigo}`;
  const mejora = await preguntarGroq(prompt);
  const salida = `# MEJORAS - ${fecha}\n\n${mejora}\n\n---\nGenerado por bot-mejora.js\n`;
  fs.writeFileSync("MEJORAS.md", salida);
  fs.appendFileSync("MEJORAS-historial.md", "\n\n" + salida);
  console.log("✅ Listo: MEJORAS.md");
  console.log(mejora.slice(0, 1200));
}
main();
