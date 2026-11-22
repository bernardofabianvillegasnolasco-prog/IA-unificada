# MEJORAS - 21/11/2026, 10:11:57 p.m.

## Mejora 1 – **Cache de TTS con LRU y TTL**  
**Impacto:** Alto (reduce uso de memoria, evita “out‑of‑memory” y permite que la caché sea compartida entre instancias en Vercel).  

### Problema  
`api/voz.js` usa un `Map` estático sin límite de tiempo ni de tamaño real (solo elimina el primer elemento cuando supera `MAX_CACHE`). En entornos serverless cada “cold‑start” crea una nueva caché y, si la función se ejecuta mucho, el proceso puede crecer sin control.

### Qué cambiar  
Reemplazar el `Map` por **lru-cache** (ya está en `cerebro.js`) con:
* límite de entradas (`max: 100`)
* TTL (`ttl: 1000 * 60 * 60 * 24` → 24 h)
* opción `dispose` para liberar buffers.

### Código a pegar (en `api/voz.js`)

```js
// ----------  INICIO DE CAMBIOS  ----------
import LRU from "lru-cache";                     // <‑‑ nuevo import

// Cache LRU con límite y TTL de 24 h
const CACHE_TTS = new LRU({
  max: 100,                                      // máximo 100 audios
  ttl: 1000 * 60 * 60 * 24,                      // 24 h
  // opcional: liberar el Buffer cuando se elimina
  dispose: (value) => {
    if (value && typeof value?.close === "function") value.close();
  },
});

// Helper para obtener/guardar en la caché (reemplaza el Map)
function getFromCache(key) {
  return CACHE_TTS.get(key);                     // undefined si no existe o expiró
}
function setInCache(key, buffer) {
  CACHE_TTS.set(key, buffer);
}
// ----------  FIN DE CAMBIOS  ----------
```

Luego, dentro del handler, sustituir las referencias a `CACHE`:

```js
// Antes:
if (CACHE.has(key)) {
  res.setHeader("Content-Type", "audio/mpeg");
  …
  return res.status(200).send(CACHE.get(key));
}

// Después:
const cached = getFromCache(key);
if (cached) {
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("X-BF-Cache", "HIT");
  return res.status(200).send(cached);
}

// Guardar
setInCache(key, buffer);
```

### Riesgo  
**Bajo** – Solo se cambia la forma de almacenar el buffer; la API sigue devolviendo el mismo tipo de respuesta.  

---

## Mejora 2 – **Rate‑limit con respuesta 429 y token‑bucket**  
**Impacto:** Alto (protege contra abusos y evita que un solo IP agote recursos).  

### Problema  
`cerebro.js` usa un LRU que guarda **arrays de timestamps** por IP y nunca devuelve un error cuando se supera el límite; además, la lógica es O(N) por petición.

### Qué cambiar  
Implementar un **token‑bucket** sencillo con LRU (una entrada por IP que guarda `tokens` y `lastRefill`). Cuando el cliente supera los 30 req/min, responder con **429 Too Many Requests**.

### Código a pegar (en `api/cerebro.js`, reemplazar la función `rateLimitBF`)

```js
// ----------  INICIO DE CAMBIOS  ----------
import LRU from "lru-cache";

const RATE_LIMIT_BF = new LRU({
  max: 500,                     // máximo 500 IPs rastreadas
  ttl: 1000 * 60 * 5,           // 5 min, se limpia automáticamente
});

const LIMIT = 30;               // 30 peticiones por minuto
const REFILL_INTERVAL = 60 * 1000; // 1 min en ms
const TOKENS_PER_REFILL = LIMIT;   // recarga completa cada minuto

function rateLimitBF(req, res) {
  const ip = req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim()
           || req.socket?.remoteAddress
           || "anon";

  const now = Date.now();
  let bucket = RATE_LIMIT_BF.get(ip);

  if (!bucket) {
    bucket = { tokens: LIMIT, lastRefill: now };
  } else {
    // recargar tokens según el tiempo transcurrido
    const elapsed = now - bucket.lastRefill;
    if (elapsed >= REFILL_INTERVAL) {
      const refillCount = Math.floor(elapsed / REFILL_INTERVAL);
      bucket.tokens = Math.min(LIMIT, bucket.tokens + refillCount * TOKENS_PER_REFILL);
      bucket.lastRefill = now;
    }
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    RATE_LIMIT_BF.set(ip, bucket);
    return true; // permitido
  }

  // límite excedido → respuesta 429
  res.setHeader("Retry-After", Math.ceil((REFILL_INTERVAL - (now - bucket.lastRefill)) / 1000));
  res.status(429).json({ ok: false, error: "Rate limit exceeded", retryAfter: "1 minute" });
  return false;
}
// ----------  FIN DE CAMBIOS  ----------
```

Y en el handler principal (antes de procesar la petición):

```js
if (!rateLimitBF(req, res)) return;   // <-- sale con 429 si supera el límite
```

### Riesgo  
**Medio** – Introduce una nueva lógica de control de flujo; si se usa en rutas que no esperan un `res` ya enviado, hay que asegurarse de que el `return` interrumpe la ejecución (como en el ejemplo).  

---

## Mejora 3 – **Sanitización más robusta y registro de intentos peligrosos**  
**Impacto:** Medio‑alto (evita que usuarios intenten extraer claves o inyectar prompts).  

### Problema  
`sanitizarBF` solo corta a 4000 caracteres y elimina HTML, pero no escapa caracteres que pueden romper JSON o prompts, y `esPeligroso` solo devuelve `true/false` sin registro ni bloqueo activo.

### Qué cambiar  
1. Mejorar `sanitizarBF` usando una whitelist de caracteres permitidos.  
2. Registrar y bloquear peticiones peligrosas con respuesta **403**.

### Código a pegar (en `api/cerebro.js`, reemplazar ambas funciones)

```js
// ----------  INICIO DE CAMBIOS  ----------
/**
 * Sanitiza el texto permitiendo solo caracteres imprimibles comunes.
 * Elimina cualquier secuencia que pueda contener código o claves.
 */
function sanitizarBF(s) {
  let x = String(s || "").slice(0, 4000);
  // Quitar etiquetas HTML y entidades
  x = x.replace(/<[^>]*>/g, " ");
  // Eliminar caracteres de control (excepto salto de línea y tab)
  x = x.replace(/[\u0000-\u001F\u007F]/g, "");
  // Permitir solo letras, números, puntuación básica y espacios
  x = x.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ.,;:!?¡¿'"()\-\s]/g, " ");
  // Colapsar espacios múltiples
  x = x.replace(/\s+/g, " ").trim();
  return x;
}

/**
 * Detecta patrones peligrosos y, si los encuentra, devuelve true.
 * Además, escribe un log estructurado para auditoría.
 */
function esPeligroso(texto, reqId) {
  const s = String(texto || "");
  const peligro = PATRONES_PELIGROSOS.some(rx => rx.test(s));
  if (peligro) {
    logBF("warn", "Intento de contenido prohibido", { reqId, texto: s.slice(0, 200) });
  }
  return peligro;
}

// En el handler, justo después de leer el body:
const reqId = Math.random().toString(36).slice(2, 8);
if (esPeligroso(body.prompt || body.texto || "", reqId)) {
  return res.status(403).json({ ok: false, error: "Contenido prohibido", reqId });
}
// ----------  FIN DE CAMBIOS  ----------
```

### Riesgo  
**Bajo‑medio** – La nueva sanitización podría recortar caracteres que el usuario necesite (p.ej. símbolos de código). Se recomienda probar con casos de uso antes de lanzar a producción.  

---

## Mejora 4 – **TTL y timestamp correcto en la memoria de sesión**  
**Impacto:** Medio (garantiza que la información de usuario no quede indefinidamente en RAM y que la limpieza sea efectiva).  

### Problema  
`api/memoria.js` define `_ts` en la función `esViejoBF`, pero nunca lo escribe al guardar; por tanto, la limpieza nunca elimina datos. Además, la constante `TTL_MS` está duplicada y confusa.

### Qué cambiar  
1. Al guardar, añadir ` _ts: Date.now()` al objeto.  
2. Unificar la constante TTL y usarla tanto en la función de limpieza como en la exportada.  
3. Ejecutar la limpieza automáticamente cada hora con `setInterval`.

### Código a pegar (en `api/memoria.js`)

```js
// ----------  INICIO DE CAMBIOS  ----------
const TTL_MS = 1000 * 60 * 60 * 24; // 24 h (un solo lugar)

// Cuando se guarda (POST)
if (req.method === "POST") {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const actual = tieneRedis ? (await leerRedis(id) || MEM[id] || {}) : (MEM[id] || {});
  const nueva = {
    ...actual,
    ...body,
    actualizado: new Date().toISOString(),
    _ts: Date.now()                     // <-- marca de tiempo para TTL
  };
  MEM[id] = nueva;
  if (tieneRedis) await guardarRedis(id, nueva);
  return res.status(200).json({ ok: true, memoria: nueva, ip, guardado: tieneRedis ? "redis" : "memoria-temporal" });
}

// Limpieza automática cada hora
setInterval(() => {
  const ahora = Date.now();
  for (const key of Object.keys(MEM)) {
    const entry = MEM[key];
    if (entry && entry._ts && ahora - entry._ts > TTL_MS) {
      delete MEM[key];
    }
  }
}, 1000 * 60 * 60); // 1 h
// ----------  FIN DE CAMBIOS  ----------
```

### Riesgo  
**Bajo** – Solo añade un campo y una tarea de limpieza; no afecta la lógica de lectura.  

---

## Mejora 5 – **Separar CSS/JS y aplicar CSP**  
**Impacto:** Medio (mejora rendimiento, permite que Vercel sirva assets estáticos con caché y refuerza la seguridad contra XSS).  

### Problema  
`index.html` contiene **más de 27 KB** de CSS inline y no define una **Content‑Security‑Policy**. Cada visita descarga todo el HTML + CSS + JS, y la ausencia de CSP facilita ataques de inyección.

### Qué cambiar  
1. Mover todo el bloque `<style>` a un archivo `public/styles.css`.  
2. Añadir `<link rel="stylesheet" href="/styles.css">` en el `<head>`.  
3. Incluir una meta CSP que permita solo recursos internos y `blob:` para audio.

### Código a pegar (crea `public/styles.css`)

```css
/* ==== styles.css ==== */
body{margin:0;background:#000;color:#00ff88;font-family:monospace;padding:12px;padding-top:46px;padding-bottom:30px;overflow-x:hidden}
#reloj{position:fixed;top:8px;right:12px;z-index:9999;font-family:'Orbitron',monospace;text-align:right;background:rgba(0,0,0,0.8);border:1px solid #333;border-radius:8px;padding:5px 10px}
#fecha{font-size:10px;color:#fff}
#hora{font-size:13px;color:#fff;font-weight:900;letter-spacing:2px;margin-top:2px}
#btnAjustes{position:fixed;top:8px;left:12px;z-index:9999;background:#111;border:1px solid #333;color:#fff;border-radius:8px;padding:6px 10px;font-size:16px}
#panelAjustes{position:fixed;top:48px;left:12px;z-index:10000;background:#111;border:1px solid

---
Generado por bot-mejora.js
