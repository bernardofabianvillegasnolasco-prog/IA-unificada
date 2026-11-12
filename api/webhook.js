export default async function handler(req, res) {
  try {
    const update = req.body;
    const msg = update?.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chatId = msg.chat.id;
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TOKEN) {
      console.error("NO HAY TELEGRAM_BOT_TOKEN EN VERCEL");
      return res.status(200).json({ ok: true });
    }
    const api = `https://api.telegram.org/bot${TOKEN}`;
    const send = async (txt) => {
      const r = await fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: txt }) });
      console.log("SEND:", await r.text());
    };
    let prompt = "";
    if (msg.voice) {
      await send(`🎤 Te escucho jefe, le paso tu voz a mi cerebro...`);
      const f = await fetch(`${api}/getFile?file_id=${msg.voice.file_id}`).then(r => r.json());
      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${f.result.file_path}`;
      const audio = await fetch(fileUrl).then(r => r.arrayBuffer());
      const form = new FormData();
      form.append('file', new Blob([audio], { type: 'audio/ogg' }), 'voz.ogg');
      form.append('model', 'whisper-large-v3');
      form.append('language', 'es');
      const tr = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form }).then(r => r.json());
      prompt = tr.text || "";
      await send(`🎤 Escuché: ${prompt}`);
    } else if (msg.text) {
      prompt = msg.text.trim();
    } else return res.status(200).json({ ok: true });

    // CEREBRO ES EL BOT
    const r = await fetch('https://ia-unificada-bf.vercel.app/api/cerebro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, historial: [{ role: 'user', content: prompt }] })
    }).then(r => r.json());
    const respuesta = r.text || 'No me respondió mi cerebro, jefe.';
    await send(`🤖 COPILOTO BF - CEREBRO [${r.cerebro || 'BF x13'}]:\n\n${respuesta}`);
    // AHORA SÍ contestamos ok, después de mandar el mensaje
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("WEBHOOK ERROR:", e);
    return res.status(200).json({ ok: true });
  }
}
