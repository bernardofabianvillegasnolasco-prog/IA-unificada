# MEJORAS - 21/11/2026, 10:01:04 p.m.

## 5 mejoras concretas (ordenadas por impacto)

| # | Área / Archivo | Impacto | Riesgo* |
|---|----------------|---------|---------|
| 1 | **`api/voz.js` – Cache HTTP + Edge‑Cache** | Alto – Reduce tiempo de respuesta y consumo de Edge‑TTS (costo) | **Bajo** |
| 2 | **`api/cerebro.js` – Sanitización + Rate‑limit** | Alto – Evita filtraciones de claves y ataques de fuerza bruta | **Medio** |
| 3 | **`api/memoria.js` – TTL correcto + uso de Redis expiración** | Alto – Libera memoria y evita que datos obsoletos se sirvan | **Bajo** |
| 4 | **`api/*` – Migrar a **Edge Runtime** de Vercel** | Medio – Latencia menor y escala automática | **Bajo** |
| 5 | **`api/voz.js` – Manejo de errores y logs estructurados** | Medio – Depuración más fácil y evita respuestas “ciegas” | **Bajo** |

\*Riesgo: **Bajo** = cambio aislado, sin romper dependencias. **Medio** = implica lógica nueva que debe probarse con casos de uso reales.

---

### 1️⃣ `api/voz.js` – Cache HTTP + Edge‑Cache

**Problema**  
* Cuando el audio está en caché se envía `Cache‑Control: public, max‑age=86400`, pero el **miss** usa `no-store`. Cada petición miss vuelve a generar TTS aunque el mismo texto pueda ser reutilizado por la CDN de Vercel (edge‑cache).  

**Qué cambiar**  
* Para los **miss** enviar un `Cache‑Control` que permita a la CDN almacenar el recurso (ej. `public, max‑age=86400, stale‑while‑revalidate=3600`).  
* Añadir la cabecera `Vary: Accept-Encoding` para que la CDN respete la compresión.  

**Código exacto** (reemplaza la sección que envía la respuesta *miss*):

```js
// ... después de generar `buffer`
res.setHeader("Content-Type", "audio/mpeg");
res.setHeader(
  "Cache-Control",
  "public, max-age=86400, stale-while-revalidate=3600"
);
res.setHeader("Vary", "Accept-Encoding");
res.setHeader("X-BF-Cache", "MISS");
return res.status(200).send(buffer);
```

**Riesgo**  
Bajo – Sólo se modifican cabeceras; la lógica de caché en memoria sigue igual.

---

### 2️⃣ `api/cerebro.js` – Sanitización + Rate‑limit

**Problema**  
* La lista `PATRONES_PELIGROSOS` cubre algunos casos, pero es estática y fácil de evadir.  
* No hay control de frecuencia de peticiones, lo que permite ataques de fuerza bruta para descubrir prompts o claves.

**Qué cambiar**  

1. **Sanitización centralizada** – crear una función `sanitizarPrompt` que:
   * Normaliza a minúsculas.
   * Elimina cualquier cadena que coincida con expresiones regulares de secretos (`/g(sk|sk_)?[A-Za-z0-9_-]{10,}/`, `/ghp_[A-Za-z0-9]{10,}/`, etc.).
   * Reemplaza coincidencias con `[SECRETO BLOQUEADO]`.

2. **Rate‑limit** – usar el paquete `lru-cache` (ya incluido en Node) para limitar a **30 peticiones / IP / minuto**.

**Código exacto**

```js
// ---------- al inicio del archivo ----------
import LRU from "lru-cache";

const rateLimiter = new LRU({
  max: 1000,               // máximo número de IPs guardadas
  ttl: 60 * 1000,          // 1 minuto
  updateAgeOnGet: true,
});

function checkRate(ip) {
  const count = rateLimiter.get(ip) || 0;
  if (count >= 30) return false; // bloqueado
  rateLimiter.set(ip, count + 1);
  return true;
}

// ---------- sanitización ----------
const SECRET_REGEX = [
  /g(sk|sk_)?[A-Za-z0-9_-]{10,}/gi,
  /ghp_[A-Za-z0-9]{10,}/gi,
  /sk-proj-[A-Za-z0-9_-]{10,}/gi,
];

function sanitizarPrompt(texto) {
  let s = String(texto || "").toLowerCase();
  // bloqueos rápidos
  if (esPeligroso(s)) return null; // ya está bloqueado por la lista antigua
  // ocultar secretos
  for (const rx of SECRET_REGEX) {
    s = s.replace(rx, "[SECRETO BLOQUEADO]");
  }
  return s;
}
```

Luego, dentro del `handler` (antes de procesar el prompt):

```js
export default async function handler(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] ?? "unknown";

  if (!checkRate(ip)) {
    return res
      .status(429)
      .json({ ok: false, error: "Demasiadas peticiones, intente más tarde." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const prompt = sanitizarPrompt(body.prompt || body.text || "");
  if (prompt === null) {
    return res.status(400).json({ ok: false, error: "Prompt bloqueado por contenido sensible." });
  }

  // … resto del código usando `prompt` …
}
```

**Riesgo**  
Medio – Introduce lógica de control de tráfico; se debe probar que no se bloqueen falsos positivos en usuarios legítimos.

---

### 3️⃣ `api/memoria.js` – TTL correcto + expiración en Redis

**Problema**  
* La función `limpiarMemoriaVieja` busca una propiedad `_ts` que nunca se escribe, por lo que la limpieza nunca ocurre.  
* Cuando se usa Upstash Redis se guarda el objeto sin expiración, lo que genera datos “zombies”.

**Qué cambiar**  

1. **Guardar timestamp** (`_ts`) al crear/actualizar la memoria.  
2. **Usar la API de Redis `EX`** para que el propio Redis elimine la clave después de `TTL_MS`.  
3. **Eliminar la función `limpiarMemoriaVieja`** (ya no necesaria) o dejarla sólo para la caché en‑memoria.

**Código exacto**

```js
// ---------- constantes ----------
const TTL_MS = 1000 * 60 * 60 * 24; // 24h
const TTL_SECONDS = Math.floor(TTL_MS / 1000);

// ---------- POST ----------
if (req.method === "POST") {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const ahora = new Date().toISOString();

  const actual = tieneRedis
    ? (await leerRedis(id)) || MEM[id] || {}
    : MEM[id] || {};

  const nueva = {
    ...actual,
    ...body,
    actualizado: ahora,
    _ts: Date.now(),          // <-- timestamp para la caché en‑memoria
  };

  MEM[id] = nueva;

  if (tieneRedis) {
    // Guardar con expiración en Redis
    await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/set/${id}/${encodeURIComponent(
        JSON.stringify(nueva)
      )}?EX=${TTL_SECONDS}`,
      { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
    );
  }

  return res.status(200).json({ ok: true, memoria: nueva, ip, guardado: tieneRedis ? "redis" : "memoria-temporal" });
}
```

*Opcional*: eliminar `limpiarMemoriaVieja` o dejarla solo para `MEM` sin TTL:

```js
export function limpiarMemoriaVieja() {
  const ahora = Date.now();
  for (const k of Object.keys(MEM)) {
    const v = MEM[k];
    if (v && v._ts && ahora - v._ts > TTL_MS) delete MEM[k];
  }
}
```

**Riesgo**  
Bajo – Solo se añaden campos y se usa la opción `EX` de Redis, que es compatible con Upstash.

---

### 4️⃣ `api/*` – Migrar a **Edge Runtime** de Vercel

**Problema**  
* Actualmente los endpoints se ejecutan como **Node.js Serverless Functions**. En Vercel, los Edge Functions son más rápidos (latencia ~1‑2 ms) y pueden usar `fetch` sin polyfills.

**Qué cambiar**  
* Añadir `export const config = { runtime: "edge" };` al final de cada archivo API.  
* Reemplazar `node-fetch` por la API nativa `fetch` (ya está usado en `memoria.js`).  
* Eliminar dependencias que no funcionan en Edge (por ejemplo, `fs` no está disponible). En `cerebro.js` y `memoria.js` el acceso a disco es solo para leer *skills* y *agents*; esos archivos pueden pre‑cargar en tiempo de build y exportarse como JSON estático (pero para la mejora mínima solo añadimos la configuración; la funcionalidad seguirá funcionando en Node‑JS cuando Vercel lo necesite).

**Código exacto** (añadir al final de cada archivo `api/*.js`):

```js
export const config = {
  runtime: "edge",          // <-- ejecuta en la red de Vercel
  // opcional: permite body parsing sin límite
  // maxDuration: 10,       // segundos (si se necesita más tiempo)
};
```

**Riesgo**  
Bajo – Edge Runtime es compatible con la mayoría del código (no usa `fs` en tiempo de ejecución). Si alguna librería falla, Vercel automáticamente cae a la versión Node, por lo que el despliegue no se rompe.

---

### 5️⃣ `api/voz.js` – Manejo de errores y logs estructurados

**Problema**  
* En caso de error de `EdgeTTS` se devuelve directamente el mensaje crudo (`String(e)`). No hay trazas en los logs de Vercel y el cliente no recibe información útil (p.ej., “rate‑limit excedido”).

**Qué cambiar**  
* Envolver la llamada a `tts.synthesize` en `try/catch` y registrar el error con `console.error` (Vercel captura los logs).  
* Normalizar la respuesta de error con un código HTTP apropiado (429 para rate‑limit, 500 para fallos internos).

**Código exacto** (reemplaza el bloque dentro de `handler` donde se llama a `tts`):

```js
try {
  await tts.synthesize(texto, "es-MX-DaliaNeural", {
    rate: "5%",
    pitch: "+10Hz",
  });
} catch (err) {
  console.error("[VOICE] Error en EdgeTTS:", {
    mensaje: err.message,
    stack: err.stack,
    texto,
  });

  // Si el error proviene de rate‑limit de Azure, devolver 429
  if (/429|rate limit/i.test(err.message)) {
    return res.status(429).json({ ok: false, error: "Demasiadas peticiones al motor TTS, intente más tarde." });
  }

  return res.status(500).json({ ok: false, error: "Fallo interno al generar audio." });
}
```

**Riesgo**  
Bajo – Solo se añade manejo de excepción y logging; la lógica principal no cambia.

---

## Resumen rápido de los cambios

| Archivo | Línea aproximada | Cambio |
|--------|------------------|--------|
| `api/voz.js` | después de `CACHE.set(key, buffer);` | Cabecera `Cache-Control` pública + `Vary` |
| `api/voz.js` | alrededor de `await tts.synthesize` | `try/catch` + logs estructurados |
| `api/cerebro.js` | inicio del archivo | Importar `lru-cache`, crear `rateLimiter`, función `checkRate` |
| `api/cerebro.js` | antes de procesar prompt | `sanitizarPrompt` + bloqueo de prompts peligrosos |
| `api/memoria.js` | dentro del `POST` | Guardar `_ts`, usar `?EX=` en la URL de Upstash |
| `api/memoria.js` | (opcional) eliminar o simplificar `limpiarMemoriaVieja` |
| `api/*.js` (voz, cerebro, memoria) | final del

---
Generado por bot-mejora.js
