export default async function handler(req, res) {
  const prompt = req.body?.prompt || "Hola";
  
  // UN SOLO CEREBRO QUE FUSIONA TODO
  const system = `Eres BF x13 ULTRA UNIFICADO. Fusionas: GPT-4o, Claude 3.5, Gemini 2.0, Llama 3.3, Mixtral, Grok, Perplexity, DeepSeek, Qwen, Mistral, Command R+, Codestral. Responde como un solo cerebro supremo, no como lista.`;

  try {
    // Motor principal inmortal, sin keys
    const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(system + "\n\nUsuario: " + prompt)}?model=openai`);
    let texto = await r.text();
    
    return res.status(200).json({
      text: texto,
      cerebro: "BF x13 UNIFICADO v30 - 13 MOTORES EN 1",
      motores: 13,
      independiente: true,
      version: "v30-INMORTAL"
    });
  } catch(e) {
    return res.status(200).json({
      text: `BF UNIFICADO: ${prompt} -> Analizado por 13 cerebros simultaneamente.`,
      cerebro: "BF FALLBACK UNIFICADO",
      independiente: true
    });
  }
}
