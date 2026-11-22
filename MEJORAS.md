# MEJORAS - 21/11/2026, 10:10:08 p.m.

## Mejora 1 – **Rate‑limit con respuesta clara y sin fuga de memoria**  
**Problema**  
`cerebro.js` usa un `Map` en memoria (`RATE_LIMIT_BF`) para contar peticiones por IP.  
- No devuelve **429 Too Many Requests** cuando se supera el límite.  
- La estructura crece indefinidamente (solo se elimina una clave cuando supera 500).  
- En entornos serverless (Vercel Edge) la memoria se reinicia en cada invocación, por lo que el límite es inefectivo.  

**Qué cambiar**  
Utilizar la librería ligera **`lru-cache`** (compatible con Edge) y devolver 429 cuando el límite se exceda.  

**Código a pegar (en `api/cerebro.js` – sustituir la sección de rate‑limit)**  

```js
// ----------  NUEVO IMPORT ----------
import LRU from "lru-cache";

// ----------  CONFIGURACIÓN ----------
const rateLimiter = new LRU({
  max: 10_000,                     // máximo de IPs guardadas
  ttl: 60_000,                     // 1 minuto de vida de cada registro
  updateAgeOnGet: true,            // refresca TTL al leer
  allowStale: false,
});

// ----------  FUNCIÓN DE LIMITE ----------
function rateLimitBF(req) {
  const ip =
    req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "anon";

  const now = Date.now();
  const record = rateLimiter.get(ip) ?? { count: 0, first: now };

  // Si la ventana expiró, reiniciamos
  if (now - record.first > 60_000) {
    record.count = 0;
    record.first = now;
  }

  record.count += 1;
  rateLimiter.set(ip, record);

  // 30 peticiones por minuto → 429 si supera
  return record.count <= 30;
}

// ----------  USO EN EL HANDLER ----------
export default async function handler(req, res) {
  // …cabezeras CORS…

  if (!rateLimitBF(req)) {
    return res
      .status(429)
      .json({ ok: false, error: "Demasiadas peticiones, intenta más tarde." });
  }

  // resto del código …
}
```

**Riesgo**: **bajo**. Solo se añade una dependencia (`lru-cache`) y se cambia la lógica interna; no afecta la funcionalidad existente, solo mejora la protección contra abuso.

---

## Mejora 2 – **Cache LRU para audio TTS y persistencia opcional**  
**Problema**  
`voz.js` mantiene un `Map` simple (`CACHE`) con capacidad fija (`MAX_CACHE = 50`).  
- No hay política LRU real (se elimina la *primera* clave insertada, no la menos usada).  
- La caché desaparece en cada despliegue/reinicio de la función.  

**Qué cambiar**  
Reemplazar el `Map` por `lru-cache` con TTL y, opcionalmente, almacenar los buffers en **Vercel KV** (o cualquier store) para que sobrevivan a reinicios.  

**Código a pegar (en `api/voz.js`)**  

```js
// ----------  NUEVO IMPORT ----------
import LRU from "lru-cache";

// ----------  CONFIGURACIÓN ----------
const CACHE = new LRU({
  max: 100,                     // número máximo de audios en memoria
  ttl: 24 * 60 * 60 * 1000,     // 24 h de vida
  updateAgeOnGet: true,
});

// ----------  FUNCIÓN DE GUARDADO ----------
function setCache(key, buffer) {
  CACHE.set(key, buffer);
  // ---- Persistencia opcional en Vercel KV (descomentar si se habilita) ----
  // if (process.env.KV_URL && process.env.KV_TOKEN) {
  //   fetch(`${process.env.KV_URL}/set/${key}`, {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${process.env.KV_TOKEN}` },
  //     body: buffer,
  //   }).catch(() => {}); // fallas silenciosas
  // }
}

// ----------  REEMPLAZAR LA LÓGICA DE CACHE ----------
if (CACHE.has(key)) {
  const cached = CACHE.get(key);
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
  res.setHeader("X-BF-Cache", "HIT");
  return res.status(200).send(cached);
}

// … después de generar el buffer …
if (buffer && buffer.length) {
  setCache(key, buffer);
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
  res.setHeader("X-BF-Cache", "MISS");
  return res.status(200).send(buffer);
}
```

**Riesgo**: **medio**. Cambia la forma de almacenar la caché; si se habilita la persistencia en KV se debe crear la variable de entorno correspondiente. Sin KV, la lógica sigue funcionando como antes pero con mejor política de expulsión.

---

## Mejora 3 – **TTL y timestamp correcto en la memoria de usuarios**  
**Problema**  
`memoria.js` define `TTL_MS = 1000 * 60 * 60 * 24` (24 h) pero nunca asigna `_ts` a los objetos guardados, por lo que la limpieza nunca elimina datos viejos. Además, la función `limpiarMemoriaCorrectaBF` no se invoca.  

**Qué cambiar**  
- Añadir `_ts` (timestamp de última actualización) al guardar.  
- Ejecutar `limpiarMemoriaCorrectaBF(MEM)` al inicio de cada petición GET/POST.  

**Código a pegar (en `api/memoria.js`)**  

```js
// ----------  AÑADIR TIMESTAMP ----------
if (req.method === "POST") {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const actual = tieneRedis ? (await leerRedis(id) || MEM[id] || {}) : (MEM[id] || {});
  const nueva = {
    ...actual,
    ...body,
    actualizado: new Date().toISOString(),
    _ts: Date.now(),               // <-- nuevo campo
  };
  MEM[id] = nueva;
  if (tieneRedis) await guardarRedis(id, nueva);
  return res.status(200).json({ ok: true, memoria: nueva, ip, guardado: tieneRedis ? "redis" : "memoria-temporal" });
}

// ----------  LIMPIAR ANTES DE LEER ----------
if (req.method === "GET") {
  // Elimina entradas expiradas antes de servir
  limpiarMemoriaCorrectaBF(MEM);
  // … resto del código …
}
```

**Riesgo**: **bajo**. Solo se añaden campos al objeto y se llama a una función ya existente; no rompe la lógica actual y mejora la gestión de datos obsoletos.

---

## Mejora 4 – **Sanitización robusta con `validator`**  
**Problema**  
`sanitizarBF` elimina HTML y caracteres nulos, pero no protege contra **XSS** ni contra inyección de comandos en prompts que luego se envían a LLMs.  

**Qué cambiar**  
Usar la librería **`validator`** (ya ligera) para escapar caracteres peligrosos y limitar la longitud.  

**Código a pegar (en `api/cerebro.js`)**  

```js
// ----------  NUEVO IMPORT ----------
import validator from "validator";

// ----------  REEMPLAZAR sanitizarBF ----------
function sanitizarBF(s) {
  let x = String(s || "").slice(0, 4000);
  // Elimina cualquier etiqueta HTML y escapa caracteres especiales
  x = validator.escape(x);               // &amp; &lt; &gt; etc.
  x = validator.stripLow(x, true);       // quita caracteres de control
  // Opcional: permite solo caracteres imprimibles
  x = x.replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑüÜ]/g, " ");
  return x.trim();
}
```

**Riesgo**: **bajo‑medio**. Cambia la forma de limpiar el texto; `validator.escape` convierte `<` en `&lt;`, lo que puede afectar prompts que necesiten esos símbolos (p. ej., código). Si se necesita preservar símbolos, ajustar la expresión regular o usar `validator.blacklist` en su lugar.

---

## Mejora 5 – **Eliminar dependencias duplicadas y optimizar el bundle**  
**Problema**  
`package.json` incluye tanto `@andresaya/edge-tts` (versión ^1.9.1) como `edge-tts` (^1.0.1). Ambas exportan la misma API y pueden generar **conflictos de versiones** o inflar el bundle.  

**Qué cambiar**  
- Mantener solo `@andresaya/edge-tts`.  
- Desinstalar `edge-tts`.  
- Actualizar los imports (si alguno usa la ruta sin “@”).  

**Código a pegar (en la raíz del proyecto)**  

```bash
# 1. Desinstalar la dependencia duplicada
npm uninstall edge-tts

# 2. Asegurarse de que solo quede la correcta
npm install @andresaya/edge-tts@latest

# 3. (Opcional) Verificar que no haya imports rotos
grep -R "from \"edge-tts\"" -n . && echo "¡Hay imports que deben cambiarse!" || echo "Todo OK"
```

Si se encuentran imports como `import { EdgeTTS } from "edge-tts";`, cambiarlos a:

```js
import { EdgeTTS } from "@andresaya/edge-tts";
```

**Riesgo**: **bajo**. Sólo afecta al proceso de instalación y a los imports; no cambia la lógica de la aplicación. Eliminar la versión duplicada reduce el tamaño del despliegue y evita posibles incompatibilidades.

---

### Resumen de impacto (de mayor a menor)

| # | Mejora | Impacto esperado |
|---|--------|------------------|
| 1 | Rate‑limit con 429 y LRU | **Alto** – protege contra abuso y evita OOM en producción. |
| 2 | Cache LRU + TTL para TTS | **Alto** – reduce latencia, ahorra llamadas a Edge‑TTS y controla memoria. |
| 3 | TTL correcto en memoria de usuarios | **Medio** – evita acumulación indefinida de datos viejos. |
| 4 | Sanitización con `validator` | **Medio** – refuerza la seguridad contra XSS/inyección. |
| 5 | Limpieza de dependencias duplicadas | **Bajo** – mejora tamaño del bundle y elimina posibles conflictos. |

Implementa cada bloque de código en los archivos indicados y revisa que los tests (si los hay) pasen antes de desplegar a Vercel. ¡Éxitos!

---
Generado por bot-mejora.js
