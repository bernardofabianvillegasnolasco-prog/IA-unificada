export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  try {
    const update = req.body;
    const msg = update.message;
    if (!msg || !msg.text) return res.status(200).json({ ok: true });
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const send = async (txt) => {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: txt })
      });
    };
    // Comandos Copiloto BF
    if (text.toLowerCase().startsWith('bf ayuda')) {
      await send(`🤖 COPILOTO BF INMORTAL - VERCEL\n\n• bf clima - Clima Phoenix\n• bf tareas - Tus tareas\n• bf ia [pregunta] - Habla con tu IA BF x13\n• Manda nota de voz - Te contesta con IA`);
      return res.status(200).json({ ok: true });
    }
    if (text.toLowerCase().startsWith('bf clima')) {
      const c = await fetch('https://api.open-meteo.com/v1/forecast?latitude=33.4484&longitude=-112.0740&current=temperature_2m,weather_code&timezone=America/Phoenix').then(r => r.json());
      await send(`🌤️ Phoenix: ${c.current.temperature_2m}°C - COPILOTO BF`);
      return res.status(200).json({ ok: true });
    }
    // Todo lo demás va a tu cerebro de Vercel
    const prompt = text.replace(/^bf ia\s*/i, '').replace(/^bf\s*/i, '') || text;
    const r = await fetch('https://ia-unificada-bf.vercel.app/api/cerebro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, historial: [{ role: 'user', content: prompt }] })
    }).then(r => r.json());
    const respuesta = r.text || 'No me respondió el cerebro.';
    await send(`🤖 COPILOTO BF IA [${r.cerebro || 'BF x13'}]:\n\n${respuesta}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true });
  }
}
