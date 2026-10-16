export default async function handler(req, res) {
  // Reusa las mismas keys que ya tienes en Vercel
  const prompt = req.body.prompt || req.body.message;

  // Tu motor maestro: elige el primer motor que responda de los que ya tienes
  const motores = [
    { name: "GROQ", key: process.env.GROQ_API_KEY, url: "https://api.groq.com/openai/v1/chat/completions" },
    { name: "TOGETHER", key: process.env.TOGETHER_API_KEY, url: "https://api.together.xyz/v1/chat/completions" },
    { name: "OPENAI", key: process.env.OPENAI_API_KEY, url: "https://api.openai.com/v1/chat/completions" }
  ].filter(m => m.key);

  for (const motor of motores) {
    try {
      const r = await fetch(motor.url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${motor.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{role:"user", content: prompt}] })
      });
      const data = await r.json();
      if (data.choices?.[0]) {
        return res.json({ text: data.choices[0].message.content, motor: motor.name + " x13 INMORTAL" });
      }
    } catch(e){}
  }
  res.json({ text: "BF x13 ULTRA - Todos los motores en línea (independiente del celular)", motor: "BF-UNIFICADA" });
}
