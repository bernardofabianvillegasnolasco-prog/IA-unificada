import { EdgeTTS } from "@andresaya/edge-tts";
import crypto from "crypto";

// Cache en memoria: texto -> audio
const CACHE = new Map();
const MAX_CACHE = 100;
const MAX_CACHE_BYTES = 50 * 1024 * 1024;
let CACHE_BYTES = 0;

function limpiar(texto) {
  let t = String(texto || "").trim().slice(0, 900);
  const malas = ['asterisco','asteriscos','guion','guiones','slash','diagonal','barra','parentesis','paréntesis','corchete','llave','comillas','numeral','almohadilla','arroba','porcentaje','ampersand'];
  t = t.split(' ').filter(w => !malas.includes(w.toLowerCase())).join(' ');
  t = t.replace(/[*#_@%]/g, ' ').replace(/\s+/g, ' ').trim();
  return t || "Que onda, soy tu BF, Dalia, ya hablo yo";
}

function logBF(nivel, msg, extra = {}) { console.log(JSON.stringify({ ts: new Date().toISOString(), nivel, servicio: 'voz', msg, ...extra })); }

export default async function handler(req, res) {
  const reqId = Math.random().toString(36).slice(2, 8);
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
    if (!buffer || !buffer.length) { logBF("error", "TTS vacio", { reqId }); return res.status(500).json({ ok: false, error: "TTS vacio - toBuffer 0 bytes", reqId }); }
    while ((CACHE.size >= MAX_CACHE || CACHE_BYTES + buffer.length > MAX_CACHE_BYTES) && CACHE.size > 0) { const primero = CACHE.keys().next().value; const viejo = CACHE.get(primero); CACHE_BYTES -= viejo?.length || 0; CACHE.delete(primero); }
    CACHE.set(key, buffer); CACHE_BYTES += buffer.length;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    res.setHeader("X-BF-Cache", "MISS");
    res.setHeader("Vary", "Content-Type");
    return res.status(200).send(buffer);
  } catch (e) {
    logBF("error", "voz fallo", { reqId, error: String(e).slice(0, 200) }); return res.status(500).json({ ok: false, error: String(e).slice(0, 300), reqId });
  }
}
