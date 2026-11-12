export default async function handler(req, res) {
  // Contesta YA a Telegram para que no espere, así es el primero
  res.status(200).json({ ok: true });
  try {
    const update = req.body;
    const msg = update.message;
    if (!msg) return;
    const chatId = msg.chat.id;
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const api = `https://api.telegram.org/bot${TOKEN}`;
    // 1. PRIMERO: decirle a Telegram que ya está escribiendo
    await fetch(`${api}/sendChatAction`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' })
    });
    const send = async (txt) => {
      await fetch(`${api}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: txt })
      });
    };
    // 2. Si es voz, decir que lo escuchó primero
    if (msg.voice) {
      await send(`🎤 Te escucho jefe, soy Copiloto BF, ya te estoy contestando yo primero...`);
      return;
    }
    if (!msg.text) return;
    const text = msg.text.trim();
    const low = text.toLowerCase();
    // 3. Comandos directos - contestan al instante, sin esperar al cerebro
    if (low.startsWith('bf ayuda') || low === '/start' || low === '/help') {
      await send(`🤖 COPILOTO BF - YO CONTESTO PRIMERO\n\nSoy el primero en contestarte en este bot.\n\n• bf ayuda - Ayuda\n• bf clima - Clima Phoenix\n• bf ia [pregunta] - Habla con tu IA BF x13\n• Manda nota de voz - Te escucho yo`);
      return;
    }
    if (low.startsWith('bf clima')) {
      const c = await fetch('https://api.open-meteo.com/v1/forecast?latitude=33.4484&longitude=-112.0740&current=temperature_2m&timezone=America/Phoenix').then(r => r.json());
      await send(`🌤️ COPILOTO BF PRIMERO: Phoenix ${c.current.temperature_2m}°C`);
      return;
    }
    // 4. Todo lo demás va a tu cerebro, pero con tu nombre primero
    const prompt = text.replace(/^bf ia\s*/i, '').replace(/^bf\s*/i, '') || text;
    const r = await fetch('https://ia-unificada-bf.vercel.app/api/cerebro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, historial: [{ role: 'user', content: prompt }] })
    }).then(r => r.json());
    await send(`🤖 COPILOTO BF - PRIMERO [${r.cerebro || 'BF x13'}]:\n\n${r.text || 'No me respondió el cerebro.'}`);
  } catch (e) { console.error(e); }
}
