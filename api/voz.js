import crypto from "crypto";
import { EdgeTTS } from "@andresaya/edge-tts";
// BF Ronda 5: Redis opcional, si no hay env sigue con local
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);
async function redisGetBF(key){ if(!USE_REDIS) return null; try{ const r = await fetch(`${REDIS_URL}/get/${key}`, {headers:{Authorization:`Bearer ${REDIS_TOKEN}`}}); const j = await r.json(); return j.result ? Buffer.from(j.result,"base64") : null; }catch(_){ return null; } }
async function redisSetBF(key, buffer){ if(!USE_REDIS) return; try{ const b64 = buffer.toString("base64"); await fetch(`${REDIS_URL}/set/${key}/${encodeURIComponent(b64)}?EX=86400`, {method:"POST", headers:{Authorization:`Bearer ${REDIS_TOKEN}`}}); }catch(_){} }

// Cache en memoria: texto -> audio
const CACHE = new Map();
const MAX_CACHE = 100;
const MAX_CACHE_BYTES = 50 * 1024 * 1024;
let CACHE_BYTES = 0;

function limpiar(texto) {
  let t = String(texto || "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,"").trim().slice(0, 900);
  const malas = ['asterisco','asteriscos','guion','guiones','slash','diagonal','barra','parentesis','paréntesis','corchete','llave','comillas','numeral','almohadilla','arroba','porcentaje','ampersand'];
  t = t.split(' ').filter(w => !malas.includes(w.toLowerCase())).join(' ');
  t = t.replace(/[*#_@%<>{}\[\]\\\/|_=+`~^$&]/g, ' ').replace(/\s+/g, ' ').trim();
  return t || "Que onda, soy tu BF, Dalia, ya hablo yo";
}

function logBF(nivel, msg, extra = {}) { console.log(JSON.stringify({ ts: new Date().toISOString(), nivel, servicio: 'voz', msg, ...extra })); }

export default async function handler(req, res) {
  const reqId = Math.random().toString(36).slice(2, 8);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    let texto = limpiar(body.texto || body.prompt || body.text || "");
    const key = crypto.createHash("sha256").update(texto).digest("hex");
    let cached = CACHE.get(key) || null;
    if (!cached) { try { cached = await redisGetBF(key); if (cached) { CACHE.set(key, cached); CACHE_BYTES += cached.length; } } catch(_) {} }
    if (cached) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-BF-Cache", "HIT");
      return res.status(200).send(cached);
    }
    const tts = new EdgeTTS();
    await tts.synthesize(texto, "es-MX-DaliaNeural", { rate: "-2%", pitch: "-4Hz" });
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
