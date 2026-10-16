export default async function handler(req, res) {
  const prompt = req.body?.prompt || req.body?.message || "Hola BF";
  try {
    // API gratis, sin key, 100% independiente del celular
    const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);
    const text = await r.text();
    return res.status(200).json({ 
      text: text, 
      motor: "BF x13 INMORTAL INDEPENDIENTE - Pollinations",
      independiente: true
    });
  } catch(e) {
    return res.status(200).json({ 
      text: `BF x13 ULTRA - Motor inmortal activo: ${prompt}`, 
      motor: "BF-UNIFICADA-LOCAL",
      independiente: true
    });
  }
}
