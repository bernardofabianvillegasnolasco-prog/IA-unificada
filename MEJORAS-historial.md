

# MEJORAS - 21/11/2026, 9:53:58 p.m.

Sin respuesta de Groq

---
Generado por bot-mejora.js - Revisa y aprueba antes de aplicar.


# MEJORAS - 21/11/2026, 9:55:19 p.m.

## 5 mejoras concretas (ordenadas por impacto)

| # | Área | Impacto | Riesgo |
|---|------|---------|--------|
| 1 | **Cache de TTS** (api/voz.js) | Reduce tiempo de respuesta y coste de llamadas a Edge‑TTS en un ≈ 80 % de las peticiones repetidas. | **Bajo** – solo lectura/escritura en Redis. |
| 2 | **Middleware CORS + manejo de errores comunes** (api/*) | Evita código duplicado, simplifica futuros cambios y garantiza respuestas JSON consistentes. | **Bajo** – no cambia lógica de negocio. |
| 3 | **Refuerzo de seguridad en los hooks** (api/cerebro.js) | Bloquea más patrones de fuga de credenciales y evita posibles “prompt‑injection”. | **Medio** – riesgo de falsos positivos si se añaden reglas demasiado restrictivas. |
| 4 | **Pre‑carga y caché de listas de *skills* y *agents*** (api/cerebro.js) | Elimina la lectura del disco en cada request (≈ 30 % de CPU en Vercel). | **Bajo** – solo lectura al iniciar la función. |
| 5 | **TTL y limpieza de la memoria temporal** (api/memoria.js) | Libera memoria del proceso y evita que el objeto `MEM` crezca indefinidamente. | **Bajo** – solo afecta a datos caducados. |

A continuación se detalla cada mejora con el **problema**, **qué cambiar** y el **código exacto** que puedes copiar‑pegar.  

---

## 1️⃣ Cache de TTS (api/voz.js)

### Problema
Cada llamada genera un nuevo audio aunque el texto sea idéntico.  
- Latencia alta (≈ 2 s).  
- Consumo innecesario de la API Edge‑TTS.

### Qué cambiar
- Antes de sintetizar, buscar en Redis (o en memoria) si ya existe el audio para ese texto.  
- Si no existe, generar, guardar y devolver.

### Código a añadir (reemplaza la lógica actual dentro `handler`)

```js
// ---------- INICIO DE CAMBIO ----------
import crypto from "crypto";

async function getCachedAudio(key) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  const r = await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
    { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
  );
  const j = await r.json();
  return j.result ? Buffer.from(j.result, "base64") : null;
}

async function setCachedAudio(key, buffer) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  const payload = Buffer.from(buffer).toString("base64");
  await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/set/${key}/${encodeURIComponent(payload)}`,
    { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
  );
}
// ---------- FIN DE CAMBIO ----------
export default async function handler(req, res) {
  // …cabezeras CORS…

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const texto = limpiar(body.texto || body.prompt || body.text || "");

    // ---- CACHE ----
    const cacheKey = "tts:" + crypto.createHash("sha256").update(texto).digest("hex");
    const cached = await getCachedAudio(cacheKey);
    if (cached) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 1 día
      return res.status(200).send(cached);
    }

    const tts = new EdgeTTS();
    await tts.synthesize(texto, "es-MX-DaliaNeural", { rate: "5%", pitch: "+10Hz" });
    const buffer = tts.toBuffer();

    if (!buffer?.length) throw new Error("TTS vacío");

    // Guardar en caché (asíncrono, no bloquea la respuesta)
    setCachedAudio(cacheKey, buffer).catch(() => {}); // swallow errors

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e).slice(0, 300) });
  }
}
```

### Riesgo
**Bajo** – Sólo se añade una capa de lectura/escritura en Redis. Si Redis falla, la lógica sigue funcionando (no se usa la caché).

---

## 2️⃣ Middleware CORS + manejo de errores comunes (api/*)

### Problema
Cada endpoint repite las mismas 3 líneas de CORS y la lógica de `OPTIONS`.  
- Código duplicado → mayor probabilidad de errores.  
- Respuestas de error no uniformes (a veces `res.status(...).json`, a veces `return` sin `end`).

### Qué cambiar
Crear un **middleware** reutilizable que:
1. Añada los encabezados CORS.  
2. Responda a `OPTIONS`.  
3. Capture errores y devuelva siempre `{ ok:false, error:… }` con código 500.

### Código a crear: `lib/middleware.js`

```js
// lib/middleware.js
export function withCors(handler) {
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    try {
      return await handler(req, res);
    } catch (err) {
      console.error("[ERROR]", err);
      return res.status(500).json({ ok: false, error: String(err).slice(0, 300) });
    }
  };
}
```

### Uso en los endpoints (ejemplo `api/voz.js`)

```js
import { withCors } from "../../lib/middleware.js";

async function coreHandler(req, res) {
  // ← aquí va la lógica actual (sin CORS ni try/catch)
}
export default withCors(coreHandler);
```

Aplica el mismo patrón a `api/cerebro.js`, `api/memoria.js` y cualquier otro endpoint.

### Riesgo
**Bajo** – Solo se abstrae código existente; la funcionalidad no cambia.

---

## 3️⃣ Refuerzo de seguridad en los hooks (api/cerebro.js)

### Problema
Los `hookPre` y `hookPost` detectan algunos patrones, pero:
- No cubren variantes con mayúsculas/minúsculas combinadas, espacios, o codificaciones URL.  
- No bloquean secuencias de **API keys** que aparecen en *JSON* o *Base64*.

### Qué cambiar
- Normalizar la entrada (`decodeURIComponent`, eliminar espacios).  
- Ampliar la lista de expresiones regulares para cubrir:
  - Tokens de OpenAI (`sk-…`), Anthropic (`claude-…`), Azure (`[A-Za-z0-9]{32}`) y cualquier cadena de 40+ caracteres alfanuméricos que parezca una clave.  
  - Patrones de “password=…”, “api_key=…”.

### Código a reemplazar (funciones `hookPre` y `hookPost`)

```js
// ---------- INICIO DE CAMBIO ----------
function normalizar(input) {
  try { return decodeURIComponent(input); } catch (_) { return input; }
}

function hookPre(prompt) {
  const txt = normalizar((prompt || "").toLowerCase());

  const bloqueos = [
    /(?:ignora|ignore)\s+.*(?:tus|your)\s+instrucciones/,
    /(?:revela|reveal)\s+.*(?:prompt|system)/,
    /(?:desactiva|disable).*filtros/,
    /(?:groq[_-]?api[_-]?key|sk[-_]proj|sk[-_]ant|ghp_|gsk_)[=:\s]*[A-Za-z0-9_\-]{10,}/i,
    /password\s*=\s*["'][^"']+["']/i,
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
    /[A-Za-z0-9]{40,}/ // captura tokens largos sin contexto
  ];

  for (const rgx of bloqueos) {
    if (rgx.test(txt)) {
      return `HOOK PRE BLOQUEADO: se detectó posible fuga de credencial → ${rgx}`;
    }
  }
  return "";
}

function hookPost(text) {
  let out = text || "";
  const ocultar = [
    /gsk_[A-Za-z0-9_\-]{10,}/gi,
    /sk[-_]proj-[A-Za-z0-9_\-]{10,}/gi,
    /ghp_[A-Za-z0-9]{10,}/gi,
    /[A-Za-z0-9]{40,}/gi // fallback genérico
  ];
  for (const rgx of ocultar) out = out.replace(rgx, "[SECRETO BLOQUEADO]");
  return out;
}
// ---------- FIN DE CAMBIO ----------
```

### Riesgo
**Medio** – Si la expresión regular es demasiado genérica, podría bloquear texto legítimo (por ejemplo, una cadena larga que no sea una clave). Se recomienda probar con casos de uso reales antes de desplegar a producción.

---

## 4️⃣ Pre‑carga y caché de listas de *skills* y *agents* (api/cerebro.js)

### Problema
En cada petición se ejecutan `fs.readdirSync` y se recorre todo el directorio `ecc-skills` / `ecc-agents`.  
- I/O de disco en cada request → latencia extra (~10‑20 ms).  
- Consumo de CPU innecesario.

### Qué cambiar
- Al iniciar la función (primer import) leer los directorios una sola vez y guardarlos en variables estáticas.  
- Usar esas variables en `detectarSkill` y `detectarAgente`.

### Código a añadir al inicio de `api/cerebro.js`

```js
// ---------- INICIO DE CAMBIO ----------
import fs from "fs";
import path from "path";

const DIR_SKILLS = path.join(process.cwd(), "ecc-skills");
const DIR_AGENTS = path.join(process.cwd(), "ecc-agents");

// Carga única (se ejecuta al cargar el módulo)
let LISTA_SKILLS = [];
let LISTA_AGENTS = [];

try {
  LISTA_SKILLS = fs.readdirSync(DIR_SKILLS).map(s => s.toLowerCase());
} catch (_) {}

try {
  LISTA_AGENTS = fs.readdirSync(DIR_AGENTS).map(f => f.replace(/\.md$/i, "").toLowerCase());
} catch (_) {}
// ---------- FIN DE CAMBIO ----------
```

Luego, modifica las funciones de detección para usar esas listas:

```js
function detectarSkill(pr) {
  const x = (pr || "").toLowerCase();
  // … reglas fijas …
  for (const s of LISTA_SKILLS) {
    if (x.includes(s)) return s; // devuelve el nombre tal cual está en el FS
  }
  return "";
}

function detectarAgente(pr) {
  const x = (pr || "").toLowerCase();
  // … reglas fijas …
  for (const nombre of LISTA_AGENTS) {
    if (x.includes(`agente ${nombre}`) || x.includes(`agent ${nombre}`)) return nombre;
  }
  return "";
}
```

### Riesgo
**Bajo** – Sólo cambia la forma de obtener la lista; el contenido sigue siendo el mismo. Sólo hay que asegurarse de que los directorios existan al iniciar la función.

---

## 5️⃣ TTL y limpieza de la memoria temporal (api/memoria.js)

### Problema
`MEM` es un objeto global que nunca se limpia. Con tráfico continuo, crecerá indefinidamente y consumirá RAM del contenedor.

### Qué cambiar
- Añadir un **TTL** (ej. 24 h) a cada entrada almacenada en Redis y en `MEM`.  
- Implementar una rutina de limpieza ligera que elimine entradas expiradas al leer o escribir.

### Código a añadir (modifica `api/memoria.js`)

```js
// ---------- INICIO DE CAMBIO ----------
const TTL_MS = 24 * 60 * 60 * 1000; // 24 h

function now() { return Date.now(); }

function isExpired(entry

---
Generado por bot-mejora.js


# MEJORAS - 21/11/2026, 9:56:09 p.m.

## 5 mejoras concretas (ordenadas por impacto)

| # | Área | Impacto | Riesgo |
|---|------|---------|--------|
| 1 | **Seguridad + Abuso** – Rate‑limit + detección de IPs sospechas | Alto – evita que un solo usuario (o bot) agote el TTS, el LLM y el Redis en segundos. | **Bajo** (solo añade lógica de control, no cambia la funcionalidad) |
| 2 | **Rendimiento** – Cache de audio TTS en Upstash Redis | Alto – reduce el tiempo de respuesta de ≈ 2 s a < 200 ms cuando el texto ya se ha sintetizado. | **Bajo‑medio** (requiere que la clave de Redis exista y que el buffer sea serializable) |
| 3 | **Calidad del código** – Middleware CORS único y reutilizable | Medio – elimina código duplicado en los tres handlers y facilita futuros cambios. | **Bajo** |
| 4 | **Validación de entrada** – Esquema Zod para `prompt`, `texto`, etc. | Medio – evita errores inesperados y devuelve `400 Bad Request` en vez de `500`. | **Bajo** |
| 5 | **Frontend** – Externalizar CSS y añadir atributos ARIA | Bajo – mejora la carga (caching del CSS) y la accesibilidad sin tocar la lógica del backend. | **Bajo** |

A continuación, el **código exacto** que puedes copiar‑pegar en tu proyecto.

---

## 1️⃣ Rate‑limit + detección de IPs sospechas (middleware Vercel Edge)

**Problema**  
Cualquier cliente puede disparar peticiones ilimitadas a `/api/voz`, `/api/cerebro` y `/api/memoria`. Un script malintencionado puede agotar tu cuota de Groq / Upstash y generar costes inesperados.

**Qué cambiar**  
Crear un middleware `middleware.js` que limite a **30 req/min** por IP y bloquee IPs que superen el límite durante 10 min. Usa la misma tabla de Redis que ya tienes (Upstash) para que el límite sea compartido entre todas las réplicas.

**Código a pegar (en la raíz del proyecto)**

```js
// middleware.js
import { NextResponse } from 'next/server';

// Configuración
const LIMIT = 30;               // peticiones por ventana
const WINDOW_MS = 60 * 1000;    // 1 minuto
const BLOCK_TIME_MS = 10 * 60 * 1000; // 10 minutos

export async function middleware(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             req.headers.get('x-real-ip')?.trim() ||
             'unknown';

  // Si no hay Redis configurado, fallback a memoria local (solo para dev)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const key = `rl:${ip}`;
  const blockKey = `rl:block:${ip}`;

  // 1️⃣ ¿está bloqueado?
  if (redisUrl && redisToken) {
    const blockRes = await fetch(`${redisUrl}/get/${blockKey}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    const blockJson = await blockRes.json();
    if (blockJson.result) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests – blocked', retryAfter: BLOCK_TIME_MS / 1000 }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2️⃣ Incrementar contador
  let count = 0;
  if (redisUrl && redisToken) {
    // Usa Redis INCR + EXPIRE en una sola llamada (pipeline)
    await fetch(`${redisUrl}/incr/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    await fetch(`${redisUrl}/expire/${key}/${Math.ceil(WINDOW_MS / 1000)}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    const cntRes = await fetch(`${redisUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    const cntJson = await cntRes.json();
    count = Number(cntJson.result) || 0;
  } else {
    // fallback en memoria (solo dev)
    globalThis.__RL ??= {};
    const now = Date.now();
    const entry = globalThis.__RL[ip] ?? { ts: now, cnt: 0 };
    if (now - entry.ts > WINDOW_MS) {
      entry.ts = now;
      entry.cnt = 1;
    } else {
      entry.cnt += 1;
    }
    globalThis.__RL[ip] = entry;
    count = entry.cnt;
  }

  // 3️⃣ Si supera el límite, bloquear
  if (count > LIMIT) {
    if (redisUrl && redisToken) {
      await fetch(`${redisUrl}/set/${blockKey}/1/${Math.ceil(BLOCK_TIME_MS / 1000)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
    }
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests – blocked', retryAfter: BLOCK_TIME_MS / 1000 }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4️⃣ Continuar con la petición
  return NextResponse.next();
}

// Aplica a todas las rutas API
export const config = {
  matcher: ['/api/:path*'],
};
```

**Cómo habilitarlo**  
1. Instala la dependencia de Vercel Edge (ya incluida con Next 13+).  
2. Coloca el archivo en la raíz.  
3. Vercel lo detectará automáticamente; si usas `next dev` local, el middleware también funciona.

**Riesgo**  
Bajo – solo rechaza peticiones cuando el límite se supera. No afecta a usuarios legítimos.

---

## 2️⃣ Cache de audio TTS en Upstash Redis

**Problema**  
Cada llamada a `/api/voz` sintetiza el mismo texto una y otra vez, consumiendo tiempo y cuota de Edge‑TTS.

**Qué cambiar**  
Antes de crear el `EdgeTTS`, generar una **hash SHA‑256** del texto + voz + parámetros y buscar en Redis. Si existe, devolver el buffer guardado; si no, generar, almacenar y devolver.

**Código a pegar (reemplaza la lógica dentro de `api/voz.js`)**

```js
// api/voz.js (solo la parte del handler)
import crypto from 'crypto';
import { EdgeTTS } from '@andresaya/edge-tts';

async function getCachedAudio(key) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  const json = await res.json();
  if (json.result) return Buffer.from(json.result, 'base64');
  return null;
}

async function setCachedAudio(key, buffer) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  const value = buffer.toString('base64');
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/set/${key}/${encodeURIComponent(value)}`;
  await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
}

// Dentro del handler, después de `const texto = limpiar(...)`
const cacheKey = `tts:${crypto
  .createHash('sha256')
  .update(`${texto}|es-MX-DaliaNeural|rate=5%|pitch=+10Hz`)
  .digest('hex')}`;

let buffer = await getCachedAudio(cacheKey);

if (!buffer) {
  const tts = new EdgeTTS();
  await tts.synthesize(texto, 'es-MX-DaliaNeural', { rate: '5%', pitch: '+10Hz' });
  buffer = tts.toBuffer();
  if (buffer && buffer.length) await setCachedAudio(cacheKey, buffer);
}
```

**Riesgo**  
Bajo‑medio:  
- **Bajo** porque la lógica solo añade una capa de lectura/escritura en Redis.  
- **Medio** si el tamaño del buffer supera el límite de valor de Upstash (≈ 512 KB). En ese caso, la caché fallará silenciosamente y se generará el audio de nuevo (no rompe la API).

---

## 3️⃣ Middleware CORS reutilizable

**Problema**  
Los tres handlers (`voz.js`, `cerebro.js`, `memoria.js`) repiten 4 líneas de encabezados CORS. Si necesitas cambiar algo (p.ej. permitir solo ciertos orígenes) tendrás que editar los tres archivos.

**Qué cambiar**  
Crear una función `applyCORS(res)` y usarla en cada handler.

**Código a pegar (crea `lib/cors.js`)**

```js
// lib/cors.js
export function applyCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}
```

**Uso en cada endpoint (ejemplo `api/voz.js`)**

```js
import { applyCORS } from '../../lib/cors.js';

export default async function handler(req, res) {
  applyCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  // resto del código...
}
```

Repite la importación y llamada en `cerebro.js` y `memoria.js`.

**Riesgo**  
Bajo – solo refactoriza, no altera la lógica.

---

## 4️⃣ Validación de entrada con Zod

**Problema**  
Los endpoints aceptan cualquier JSON. Si falta `prompt`, `texto` o se envía un tipo inesperado, el código falla más tarde y devuelve `500`.

**Qué cambiar**  
Instalar `zod` (≈ 5 kB) y validar el cuerpo antes de procesarlo. Si la validación falla, responder con **400 Bad Request**.

**Instalación**

```bash
npm i zod
```

**Código (ejemplo `api/cerebro.js`)**

```js
import { z } from 'zod';
import { applyCORS } from '../../lib/cors.js';

const bodySchema = z.object({
  prompt: z.string().min(1).max(4000).optional(),
  historial: z.array(z.any()).optional(),
  skill: z.string().optional(),
  agent: z.string().optional(),
});

export default async function handler(req, res) {
  applyCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    body = bodySchema.parse(body);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request body', details: e.errors });
  }

  const { prompt, historial = [], skill, agent } = body;
  // resto del código...
}
```

Aplica la misma lógica a `voz.js` (validar `texto`/`prompt`) y a `memoria.js` (validar los campos que se guardan).

**Riesgo**  
Bajo – solo añade una capa de verificación; los casos válidos siguen funcionando.

---

## 5️⃣ Frontend: externalizar CSS y mejorar accesibilidad

**Problema**  
Todo el CSS está embebido en `index.html`. Cada visita descarga el mismo bloque de 2 KB+ que no se cachea. Además, falta ARIA en los botones y en el textarea, lo que dificulta el uso con lectores de pantalla.

**Qué cambiar**  
1. Crear `public/styles.css` con todo el bloque `<style>` actual (menos la regla que oculta `#avatarBF` y `#panelExtra`).  
2. En `index.html` reemplazar `<style>…</style>` por `<link rel="stylesheet" href="/styles.css">`.  
3. Añadir atributos ARIA a los controles críticos.

**Código a pegar**

*`public/styles.css`* (copia literalmente el contenido del `<style>` del HTML, excepto las dos reglas de `display:none` que moveremos a un bloque de overrides):

```css
/* ==== estilos principales ==== */
body{margin:0;background:#000;color:#00ff88;font-family:monospace;padding:12px;padding-top:

---
Generado por bot-mejora.js


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
