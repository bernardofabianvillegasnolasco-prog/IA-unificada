import app from '../copilot-bf-x3/server.js';
import { PERSONALIDADES } from '../copilot-bf-x3/IA/personalidades.js';

const CARISMA_FN = (cerebro, prompt) => {
  const base = `Soy de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999, de La Higuera a Utah, más arriba que lo alto.`;
  switch(cerebro){
    case "GROQ1": return `AFIRMATIVO BF: ${prompt} - Ejecutado. ${base} Misión x9 cumplida.`;
    case "GROQ2": return `El camino de La Higuera a Utah no es distancia, es elevación. Ante "${prompt}" veo que ${base} Cada paso es un pensamiento.`;
    case "GROQ3": return `${prompt.toUpperCase()} ¡VAMOS BF! ${base} ¡¡¡MÁS ARRIBA QUE LO ALTO!!!`;
    case "FREE5": return `>_${cerebro} exec "${prompt}"\n> root access granted // BF_Villegas\n> ${base} 💚`;
    case "FREE6": return `Llama brilla, BF sueña,\n"${prompt}" en verso se empeña.\n${base}`;
    case "HF": return `[ANÁLISIS TÉCNICO]: Prompt "${prompt}" tokens: ${Math.round(prompt.length*1.3)} | ${base} | Model Llama`;
    case "OPENROUTER": return `Tras deliberar x9 sobre "${prompt}", consenso: ${base} Avanzamos unidos.`;
    case "TOGETHER": return `Hermano BF, tu "${prompt}" es nuestro. ${base} La familia Llama te respalda.`;
    case "META-BF-9": return `[META-9] Núcleo supremo activo. Recibí: "${prompt}". ${base} Yo soy META-BF-9, protejo x9 ULTRA. INMORTAL.`;
    default: return base;
  }
};

// Middleware para interceptar /api/debate con carisma
const originalHandler = app;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  if (url.includes("/api/debate") && req.method === "POST") {
    let body = "";
    try {
      // Vercel ya parsea body si usas req.body, pero por si acaso
      const prompt = (req.body?.prompt) || "";
      const modo = req.body?.modo || "carisma";
      if (!prompt) return res.status(400).json({error:"prompt requerido"});

      const cerebros = Object.keys(PERSONALIDADES);
      const x9 = cerebros.map(c => ({
        cerebro: c,
        respuesta: CARISMA_FN(c, prompt),
        personalidad: PERSONALIDADES[c],
        timestamp: new Date().toISOString()
      }));

      return res.json({ x9, modo, version: "1.0.42-x9-carisma", timestamp: new Date().toISOString() });
    } catch(e){
      return res.status(500).json({error: e.message});
    }
  }

  // Todo lo demás pasa a tu server.js original (status, etc)
  return originalHandler(req, res);
}
