import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "solo POST" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    // body.audio = base64 webm del navegador
    if (!body.audio) return res.status(400).json({ error: "sin audio" });
    const buf = Buffer.from(body.audio, "base64");
    // Groq Whisper
    const file = new File([buf], "voz.webm", { type: "audio/webm" });
    const tr = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo",
      language: "es",
      response_format: "json",
    });
    const texto = (tr.text || "").trim();
    if (!texto) return res.status(200).json({ texto: "", vacio: true });
    return res.status(200).json({ ok: true, texto });
  } catch (e) {
    console.log("escuchar fallo", String(e).slice(0, 300));
    return res.status(500).json({ ok: false, error: String(e).slice(0, 300) });
  }
}
