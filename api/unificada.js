export default async function handler(req, res) {
  const prompt = req.body?.prompt || req.body?.message || "Hola BF";
  try {
    const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`, { headers: { "Cache-Control": "no-cache" }});
    const text = await r.text();
    return res.status(200).json({ text: text, motor: "BF x13 INMORTAL INDEPENDIENTE", independiente: true });
  } catch(e) {
    return res.status(200).json({ text: `BF x13 ULTRA: ${prompt} - Motor en linea`, motor: "BF-FALLBACK", independiente: true });
  }
}
