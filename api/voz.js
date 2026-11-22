import { EdgeTTS } from "@andresaya/edge-tts";

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
    const tts = new EdgeTTS();
    await tts.synthesize(texto, "es-MX-DaliaNeural", { rate: "5%", pitch: "+10Hz" });
    const buffer = tts.toBuffer();
    if (!buffer || !buffer.length) return res.status(500).json({ ok: false, error: "TTS vacio - toBuffer 0 bytes" });
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e).slice(0, 300) });
  }
}
