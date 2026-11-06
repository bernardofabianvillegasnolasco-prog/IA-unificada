export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const hasGroq = Boolean((process.env.GROQ_API_KEY || "").trim());

  const models = [
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "llama/llama-4-scout-17b-16e-instruct",
    "llama/llama-4-maverick-17b-128e-instruct",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
  ];

  return res.status(200).json({
    ok: true,
    project: "IA-unificada",
    version: "v4.0.39",
    cerebro: "BF x13 - Groq + MEMORIA",
    status: hasGroq ? "Copilot Activo x9 ULTRA - 【entity-META¦canonical_name=META】 incluido" : "SIN KEY",
    groq_key: hasGroq ? "OK" : "FALTA - Ve a Vercel > Settings > Environment Variables > GROQ_API_KEY",
    models: models,
    total_modelos: models.length,
    endpoints: {
      status: "https://ia-unificada.vercel.app/api/status",
      cerebro: "https://ia-unificada.vercel.app/api/cerebro",
      web: "https://ia-unificada.vercel.app/"
    },
    time: new Date().toISOString()
  });
}
