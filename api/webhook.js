export default async function handler(req, res) {
  res.status(200).json({ ok: true });
  try {
    const update = req.body;
    const msg = update.message;
    if (!msg) return;
    const chatId = msg.chat.id;
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const GROQ = process.env.GROQ_API_KEY;
    const api = `https://api.telegram.org/bot${TOKEN}`;
    const send = async (txt) => {
      await fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: txt }) });
    };
    await fetch(`${api}/sendChatAction`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, action: 'typing' }) });

    let prompt = "";
    // Si es voz, el cerebro la transcribe primero
    if (msg.voice) {
      await send(`🎤 Te escucho jefe, le paso tu voz a mi cerebro...`);
      const fileId = msg.voice.file_id;
      const f = await fetch(`${api}/getFile?file_id=${fileId}`).then(r => r.json());
      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${f.result.file_path}`;
      const audio = await fetch(fileUrl).then(r => r.arrayBuffer());
      const form = new FormData();
      form.append('file', new Blob([audio], { type: 'audio/ogg' }), 'voz.ogg');
      form.append('model', 'whisper-large-v3');
      form.append('language', 'es');
      const tr = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${GROQ}` }, body: form }).then(r => r.json());
      prompt = tr.text || "";
      await send(`🎤 Escuché: ${prompt}`);
    } else if (msg.text) {
      prompt = msg.text.trim();
    } else return;

    // TODO VA AL CEREBRO - EL CEREBRO ES EL BOT
    const r = await fetch('https://ia-unificada-bf.vercel.app/api/cerebro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        historial: [{ role: 'user', content: prompt }],
        // Le decimos al cerebro quién es
        system: 'Eres Copiloto BF, el asistente de BF Villegas en Phoenix, AZ. Hablas estilo mexicano, directo, chido. Puedes ver clima de Phoenix, tareas, notas, chistes, y contestar como BF x13. Tú eres el cerebro del bot de Telegram @Bf_crazy_bot, tú decides todo.'
      })
    }).then(r => r.json());

    const respuesta = r.text || 'No me respondió mi cerebro, jefe.';
    // Parte si es larga, para que no se corte
    for (let i = 0; i < respuesta.length; i += 3500) {
      await send(`🤖 COPILOTO BF - CEREBRO [${r.cerebro || 'BF x13'}]:\n\n${respuesta.slice(i, i + 3500)}`);
    }
  } catch (e) { console.error(e); }
}
