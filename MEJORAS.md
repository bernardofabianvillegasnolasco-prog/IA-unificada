# MEJORAS - 21/11/2026, 10:16:36 p.m.

## Mejora 1 – Rate‑limit con TTL y LRU (alto impacto)

**Problema**  
`RATE_LIMIT_BF` es un `Map` que solo se limpia cuando supera 500 entradas.  
Si un atacante envía peticiones desde miles de IPs, el mapa crecerá indefinidamente y consumirá memoria del contenedor, provocando *OOM*.

**Qué cambiar**  
Reemplazar el mapa manual por **`lru-cache`** (v10) con TTL = 1 min y límite de 5 000 claves. El propio paquete elimina automáticamente los registros expirados.

**Código a pegar (en `api/cerebro.js` – justo antes de `function rateLimitBF`)**

```js
// ---------- NUEVO ----------
import LRU from "lru-cache";

const rateLimiter = new LRU({
  max: 5_000,                     // máximo de IPs simultáneas
  ttl: 60 * 1000,                 // 1 min en milisegundos
  updateAgeOnGet: true,           // refresca TTL al usar
  allowStale: false,
});

function rateLimitBF(req) {
  const ip =
    req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "anon";

  const now = Date.now();
  const record = rateLimiter.get(ip) || { count: 0, first: now };

  // reiniciar contador si pasó más de 1 min desde la primera petición
  if (now - record.first > 60_000) {
    record.count = 0;
    record.first = now;
  }

  record.count += 1;
  rateLimiter.set(ip, record); // actualiza TTL automáticamente

  const MAX = 30; // 30 peticiones por minuto
  return record.count <= MAX;
}
```

**Riesgo** – *bajo*  
Solo se añade una dependencia ligera y se cambia la lógica interna; la API sigue respondiendo igual.

---

## Mejora 2 – Cache de audio con LRU y límite de bytes (alto impacto)

**Problema**  
`CACHE` guarda los buffers de audio sin límite de tamaño ni política de expulsión. Un texto largo o muchos usuarios pueden llenar la memoria del proceso y provocar caída.

**Qué cambiar**  
Usar `lru-cache` también para los audios, limitando el **tamaño total** (ej. 50 MB) y el número máximo de entradas (ej. 100). Cada buffer se almacena como `Uint8Array`.

**Código a pegar (reemplazar la sección de caché en `api/voz.js`)**

```js
// ---------- NUEVO ----------
import LRU from "lru-cache";

const audioCache = new LRU({
  max: 100,                     // máximo número de audios
  maxSize: 50 * 1024 * 1024,    // 50 MiB total
  sizeCalculation: (value, key) => value.byteLength,
  ttl: 24 * 60 * 60 * 1000,     // 24 h
  updateAgeOnGet: true,
});

// ---------- MODIFICADO ----------
const key = crypto.createHash("sha256").update(texto).digest("hex");

if (audioCache.has(key)) {
  const buf = audioCache.get(key);
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("X-BF-Cache", "HIT");
  return res.status(200).send(buf);
}

// ... después de obtener `buffer`:
audioCache.set(key, buffer);
```

**Riesgo** – *medio*  
Se cambia la forma de almacenar y recuperar el buffer; si alguna parte del código espera que `CACHE` sea un `Map`, habrá que actualizar esas referencias (solo en este archivo).  

---

## Mejora 3 – TTL correcto en la memoria de usuarios (medio‑alto impacto)

**Problema**  
`memoria.js` guarda la fecha bajo la clave `actualizado`, pero la función `limpiarMemoriaVieja` y `esViejoBF` revisan `_ts`. Por tanto nunca se eliminan entradas viejas y la memoria crece sin control.

**Qué cambiar**  
Unificar el campo de timestamp a `_ts` y usar la función de limpieza correcta en cada petición (GET/POST).

**Código a pegar (en `api/memoria.js`)**

```js
// ---------- MODIFICADO ----------
async function handler(req, res) {
  // ... código existente ...

  // Antes de responder, limpiar entradas viejas
  limpiarMemoriaCorrectaBF(MEM);   // <-- llamada añadida

  // resto del handler...
}

// ---------- NUEVO ----------
function normalizarTS(obj) {
  if (obj && typeof obj === "object") {
    // si viene con `actualizado`, lo copiamos a `_ts`
    if (obj.actualizado && !obj._ts) obj._ts = new Date(obj.actualizado).getTime();
    // si no tiene timestamp, lo creamos
    if (!obj._ts) obj._ts = Date.now();
  }
  return obj;
}

// al leer o crear la memoria:
let memoria = null;
if (tieneRedis) memoria = await leerRedis(id);
if (!memoria) memoria = MEM[id];
memoria = normalizarTS(memoria);
if (!memoria) memoria = { nombre: "", gustos: [], ciudad: "Phoenix", estado: "", historial: [], _ts: Date.now() };
```

**Riesgo** – *bajo*  
Solo se añaden comprobaciones y una llamada a la función de limpieza; no afecta la lógica de negocio.

---

## Mejora 4 – Eliminar dependencia duplicada y usar la versión correcta de Edge‑TTS (bajo impacto)

**Problema**  
`package.json` declara tanto `@andresaya/edge-tts` como `edge-tts`. El código importa `@andresaya/edge-tts`, pero la presencia de la otra dependencia genera un **bundle más grande** y posibles conflictos de versiones.

**Qué cambiar**  
- Desinstalar `edge-tts`.
- Añadir una **script** de post‑install que verifica que solo exista la dependencia correcta.

**Código a pegar (en `package.json`)**

```json
{
  // ... resto del package.json ...
  "scripts": {
    "postinstall": "npm ls edge-tts && echo '⚠️  edge-tts está instalado, elimínalo: npm uninstall edge-tts' || true"
  },
  "dependencies": {
    "@andresaya/edge-tts": "^1.9.1",
    // <-- eliminar la línea "edge-tts": "^1.0.1"
    // resto de dependencias...
  }
}
```

Luego ejecutar:

```bash
npm uninstall edge-tts
npm install   # volver a generar lockfile
```

**Riesgo** – *muy bajo*  
Solo afecta al árbol de dependencias; la API sigue importando la misma módulo.

---

## Mejora 5 – Protección básica con API‑Key en los endpoints críticos (alto impacto)

**Problema**  
Todas las rutas (`/api/voz`, `/api/cerebro`, `/api/memoria`) están abiertas a cualquier origen. Un atacante puede abusar del TTS, del rate‑limit o de la memoria sin restricción.

**Qué cambiar**  
- Añadir una verificación de encabezado `x-api-key` contra una variable de entorno `BF_API_KEY`.
- Aplicar la verificación en un **middleware** reutilizable.

**Código a pegar (crear `lib/auth.js`)**

```js
// lib/auth.js
export function requireApiKey(req, res) {
  const key = req.headers["x-api-key"];
  const expected = process.env.BF_API_KEY;
  if (!expected) return true; // modo desarrollo sin clave
  if (key !== expected) {
    res.status(401).json({ ok: false, error: "API key inválida" });
    return false;
  }
  return true;
}
```

**Uso en cada handler (ejemplo `api/voz.js`)**

```js
import { requireApiKey } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return; // <-- línea añadida

  // resto del código...
}
```

Repetir la misma línea al inicio de `cerebro.js` y `memoria.js`.

**Riesgo** – *medio*  
Requiere que el cliente envíe la cabecera `x-api-key`. En entornos de desarrollo se puede omitir definiendo `BF_API_KEY` vacío, por lo que no rompe la experiencia local.

---

### Resumen de prioridades (de mayor a menor impacto)

| # | Mejora | Impacto | Riesgo |
|---|--------|---------|--------|
| 1 | Rate‑limit con LRU + TTL | Alto (evita OOM por DoS) | Bajo |
| 2 | Cache de audio con LRU y límite de bytes | Alto (control de memoria) | Medio |
| 3 | TTL correcto en la memoria de usuarios | Medio‑alto (limpia datos obsoletos) | Bajo |
| 5 | Protección con API‑Key | Alto (cierra acceso no autorizado) | Medio |
| 4 | Eliminar dependencia duplicada | Bajo (optimiza bundle) | Muy bajo |

Implementando estas cinco mejoras el proyecto gana **seguridad**, **estabilidad** y **eficiencia** sin introducir cambios disruptivos. ¡Listo para copiar‑pegar!

---
Generado por bot-mejora.js
