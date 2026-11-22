import { EdgeTTS } from "@andresaya/edge-tts";
import crypto from "crypto";

// Cache en memoria: texto -> audio
const CACHE = new Map();
const MAX_CACHE = 50;

function limpiar(texto) {
  let t = String(texto || "").trim().slice(0, 900);
  const malas = ['asterisco','asteriscos','guion','guiones','slash','diagonal','barra','parentesis','paréntesis','corchete','llave','comillas','numeral','almohadilla','arroba','porcentaje','ampersand'];
  t = t.split(' ').filter(w => !malas.includes(w.toLowerCase())).join(' ');
  t = t.replace(/[*#_@%]/g, ' ').replace(/\s+/g, ' ').trim();
  return t || "Que onda, soy tu BF, Dalia, ya hablo yo";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const texto = limpiar(body.texto || body.prompt || body.text || "");
    const key = crypto.createHash("sha256").update(texto).digest("hex");
    if (CACHE.has(key)) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-BF-Cache", "HIT");
      return res.status(200).send(CACHE.get(key));
    }
    const tts = new EdgeTTS();
    await tts.synthesize(texto, "es-MX-DaliaNeural", { rate: "5%", pitch: "+10Hz" });
    const buffer = tts.toBuffer();
    if (!buffer || !buffer.length) return res.status(500).json({ ok: false, error: "TTS vacio - toBuffer 0 bytes" });
    if (CACHE.size >= MAX_CACHE) { const primero = CACHE.keys().next().value; CACHE.delete(primero); }
    CACHE.set(key, buffer);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-BF-Cache", "MISS");
    return res.status(200).send(buffer);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e).slice(0, 300) });
  }
}
