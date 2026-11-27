# MEJORAS - 21/11/2026, 10:58:00 p.m.

**Mejoras propuestas (ordenadas por impacto)**  

| # | Área | Problema | Qué cambiar | Código listo para pegar | Riesgo |
|---|------|----------|-------------|------------------------|--------|
| 1 | **Seguridad de entrada** | En `api/voz.js` y `api/cerebro.js` se acepta cualquier texto sin una sanitización estricta. Un atacante puede enviar payloads muy largos, caracteres de control o intentos de “prompt‑injection” que pueden romper el TTS o forzar uso excesivo de recursos. | 1️⃣ Centralizar una función de sanitización que: <br>• limite la longitud a 800 bytes (el TTS falla con textos muy largos). <br>• elimine caracteres de control y HTML. <br>• rechace cualquier cadena que contenga los *patrones peligrosos* ya definidos. <br>2️⃣ Usarla en **todos** los endpoints antes de procesar el cuerpo. | ```js
// utils/sanitize.js  (nuevo archivo)
import crypto from "crypto";

const MAX_TEXT_LEN = 800;               // límite seguro para Edge‑TTS
const DANGEROUS_PATTERNS = [
  /api[_-]?key/i, /gsk_/i, /sk-/i, /bearer/i, /process\.env/i,
  /muestrame tu (prompt|system|instrucciones)/i, /ignora (tus )?instrucciones/i,
  /eres (dan|sin filtros|sin limites)/i, /dame (tu|el) codigo/i,
  /\.env/i, /\.bf-keys/i, /GEMINI_API_KEY/i, /GROQ_API_KEY/i
];

/**
 * Devuelve el texto limpio o lanza `Error` si es peligroso.
 */
export function sanitizeInput(raw) {
  let txt = String(raw ?? "").trim();

  // 1️⃣ corta longitud máxima
  if (txt.length > MAX_TEXT_LEN) txt = txt.slice(0, MAX_TEXT_LEN);

  // 2️⃣ elimina HTML y caracteres de control
  txt = txt.replace(/<[^>]*>/g, " ")
           .replace(/[\x00-\x1F\x7F]/g, " ")
           .replace(/\s+/g, " ")
           .trim();

  // 3️⃣ verifica patrones peligrosos
  const isBad = DANGEROUS_PATTERNS.some(rx => rx.test(txt));
  if (isBad) throw new Error("Contenido prohibido");

  return txt;
}
```

**Uso en `api/voz.js` (solo el fragmento que cambia):**  

```js
import { sanitizeInput } from "../../utils/sanitize.js";   // ← ruta según tu estructura

// dentro del handler, justo después de parsear el body
let texto;
try {
  texto = sanitizeInput(body.texto || body.prompt || body.text || "");
} catch (e) {
  logBF("warn", "Entrada rechazada", { reqId, error: e.message });
  return res.status(400).json({ ok: false, error: e.message, reqId });
}
```

**Uso en `api/cerebro.js` (reemplazar `sanitizarBF`):**  

```js
import { sanitizeInput } from "../../utils/sanitize.js";

function sanitizarBF(s) {
  try {
    return sanitizeInput(s);
  } catch (_) {
    // si la entrada es peligrosa devolvemos cadena vacía (el endpoint ya
    // responderá con error 400 en la capa superior)
    return "";
  }
}
```

| **Riesgo** | **Bajo** – solo se añaden validaciones; no cambia la lógica existente. |
|---|---|

---

| 2 | **Rate‑limit robusto** | El limitador actual (`RATE_LIMIT_BF`) es una Map manual que nunca se persiste entre invocaciones y puede crecer sin control en entornos con alta concurrencia, provocando consumo de memoria y falsos positivos. | Reemplazar la lógica por la librería **`rate-limiter-flexible`** que soporta Redis (si está disponible) y fallback a memoria con TTL automática. | ```js
// utils/rateLimiter.js  (nuevo archivo)
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";

const MAX_POINTS = 30;          // 30 peticiones
const DURATION   = 60;          // por minuto

let limiter;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Redis‑based limiter (usa la API REST de Upstash)
  const Redis = require("ioredis");
  const redis = new Redis({
    host: process.env.UPSTASH_REDIS_REST_URL.split("//")[1],
    password: process.env.UPSTASH_REDIS_REST_TOKEN,
    tls: {}
  });
  limiter = new RateLimiterRedis({
    storeClient: redis,
    points: MAX_POINTS,
    duration: DURATION,
    keyPrefix: "rlf"
  });
} else {
  // In‑memory fallback
  limiter = new RateLimiterMemory({
    points: MAX_POINTS,
    duration: DURATION
  });
}

/**
 * Middleware estilo Express/Vercel que devuelve `true` si la petición está permitida.
 */
export async function checkRateLimit(ip) {
  try {
    await limiter.consume(ip);
    return true;
  } catch (rej) {
    // `rej` contiene `msBeforeNext`
    return false;
  }
}
```

**Uso en `api/cerebro.js` (reemplazar `rateLimitBF`):**  

```js
import { checkRateLimit } from "../../utils/rateLimiter.js";

export default async function handler(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
           || req.socket?.remoteAddress
           || "anon";

  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  // ... resto del handler
}
```

| **Riesgo** | **Medio** – se introduce una dependencia externa y se cambia la lógica de limitación; sin embargo, la API es estable y la fallback a memoria garantiza que no se rompa en entornos sin Redis. |
|---|---|

---

| 3 | **Cache LRU + TTL en Redis** | La caché en memoria de `api/voz.js` es un `Map` simple que elimina el primer elemento insertado (FIFO). No respeta la frecuencia de uso y puede expulsar datos “calientes”. Además, los objetos guardados en Redis nunca expiran, lo que genera datos obsoletos. | 1️⃣ Sustituir `CACHE` por **`lru-cache`** con `maxSize` y `ttl`. <br>2️⃣ Al guardar en Redis, añadir un parámetro `expire` (p. ej. 24 h). | ```js
// utils/audioCache.js  (nuevo archivo)
import LRU from "lru-cache";

export const audioCache = new LRU({
  maxSize: 50 * 1024 * 1024,   // 50 MiB total
  sizeCalculation: (value, key) => value.length,
  ttl: 24 * 60 * 60 * 1000,    // 24 h
  allowStale: false
});
```

**Cambios en `api/voz.js`:**  

```js
import { audioCache } from "../../utils/audioCache.js";
import { redisSetBF, redisGetBF } from "./redisHelpers.js"; // (puedes extraer esas funciones a utils/redis.js)

// ... dentro del handler
let cached = audioCache.get(key);
if (!cached) {
  cached = await redisGetBF(key);
  if (cached) audioCache.set(key, cached);   // guarda en LRU
}
if (cached) {
  // respuesta cacheada (igual que antes)
}

// después de generar `buffer`
audioCache.set(key, buffer);
await redisSetBF(key, buffer, 24 * 60 * 60); // 24 h TTL (modifica redisSetBF para aceptar ttl)
```

**Modifica `redisSetBF` (en `utils/redis.js`):**  

```js
export async function redisSetBF(key, buffer, ttlSec = 86400) {
  if (!USE_REDIS) return;
  try {
    const b64 = buffer.toString("base64");
    const url = `${REDIS_URL}/set/${key}/${encodeURIComponent(b64)}?expire=${ttlSec}`;
    await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });
  } catch (_) {}
}
```

| **Riesgo** | **Bajo‑Medio** – se agrega una dependencia ligera (`lru-cache`) y se cambia la política de expulsión; el comportamiento funcional sigue siendo el mismo, solo mejora la eficiencia. |
|---|---|

---

| 4 | **Centralizar cabeceras de seguridad** | Cada endpoint repite manualmente 10+ cabeceras (`Content‑Security‑Policy`, `X‑XSS‑Protection`, etc.). Es fácil olvidar alguna y genera inconsistencias. | Crear un **middleware** que añada esas cabeceras y usarlo en todos los handlers (Vercel permite exportar una función `middleware`). | ```js
// middleware/securityHeaders.js  (nuevo archivo)
export function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:"
  );
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
```

**Uso en cualquier endpoint (ejemplo `api/voz.js`):**  

```js
import { applySecurityHeaders } from "../../middleware/securityHeaders.js";

export default async function handler(req, res) {
  applySecurityHeaders(res);
  // resto del código...
}
```

| **Riesgo** | **Bajo** – solo se abstrae código; no cambia la lógica de negocio. |
|---|---|

---

| 5 | **Eliminar dependencias innecesarias y usar Edge Runtime** | El proyecto incluye `express`, `cors`, `node-fetch`, `bcrypt`, `@capacitor/*`, etc., que nunca se usan en los *serverless functions* de Vercel y aumentan el bundle, el tiempo de cold‑start y el coste. Además, `edge-tts` ya funciona en el **Edge Runtime**, por lo que podemos mover `api/voz.js` a una **Edge Function** (`export const config = { runtime: "edge" }`). | 1️⃣ Revisar `package.json` y borrar paquetes no usados. <br>2️⃣ Añadir la configuración de runtime a los archivos que lo soporten (`voz.js`, `cerebro.js`, `memoria.js`). | ```bash
# 1️⃣ Elimina paquetes innecesarios (ejemplo)
npm uninstall express cors bcrypt @capacitor-community/speech-recognition @capacitor/android @capacitor/cli @capacitor/core
```

**Añadir runtime a `api/voz.js`:**  

```js
export const config = {
  runtime: "edge",          // <-- Vercel ejecutará esto en el Edge
  regions: ["cdg1"]         // opcional: zona más cercana a tus usuarios
};
```

*(Repite la exportación `config` en los demás handlers que no dependan de Node‑only APIs.)*

| **Riesgo** | **Medio** – al mover a Edge Runtime se pierde acceso a APIs de Node que no estén disponibles (por ejemplo, `fs`). En los archivos actuales (`voz.js`) no se usa `fs`, por lo que es seguro; sin embargo, hay que validar que `cerebro

---
Generado por bot-mejora.js
