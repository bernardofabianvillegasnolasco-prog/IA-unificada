export default async function handler(req, res) {
  try {
    const msg = req.body?.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chatId = msg.chat.id;
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const GROQ = process.env.GROQ_API_KEY;
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;
    const api = `https://api.telegram.org/bot${TOKEN}`;
    const send = async (txt) => {
      await fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: txt }) });
    };

    // --- TAREAS COPILOTO EN KV ---
    const KEY_TAREAS = `tareas:${chatId}`;
    const KEY_NOTAS = `notas:${chatId}`;
    const kvGet = async (key) => {
      if (!KV_URL) return [];
      const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } }).then(r => r.json()).catch(() => null);
      return r?.result ? JSON.parse(r.result) : [];
    };
    const kvSet = async (key, val) => {
      await fetch(`${KV_URL}/set/${key}`, { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(JSON.stringify(val)) });
    };

    let prompt = msg.text ? msg.text.trim() : "";
    let texto = prompt.toLowerCase();

    // --- COMANDOS DE TAREAS IGUAL QUE EN TERMUX ---
    if (texto === 'bf ayuda' || texto === '/start') {
      await send(`🤖 COPILOTO BF INMORTAL - AYUDA\n\n📋 TAREAS:\nbf tareas - ver tus tareas\nbf agregar <tarea> - agregar tarea\nbf borrar <numero> - borrar tarea\nbf limpiar - borrar todas\n\n📝 NOTAS:\nbf nota <texto> - guardar nota\nbf notas - ver notas\n\n🧠 IA:\nbf ia <pregunta> - preguntarle a mi cerebro\nbf clima - clima Phoenix\nbf resumen - resumen de tu día\n\n🎤 Mándame nota de voz y te contesto con voz`);
      return res.status(200).json({ ok: true });
    }
    if (texto === 'bf tareas') {
      const t = await kvGet(KEY_TAREAS);
      if (!t.length) await send(`📋 No tienes tareas, jefe. Agrega una con:\nbf agregar comprar tortillas`);
      else await send(`📋 TUS TAREAS (${t.length}):\n\n` + t.map((x,i) => `${i+1}. ${x}`).join('\n'));
      return res.status(200).json({ ok: true });
    }
    if (texto.startsWith('bf agregar ')) {
      const tarea = prompt.slice(11).trim();
      const t = await kvGet(KEY_TAREAS); t.push(tarea); await kvSet(KEY_TAREAS, t);
      await send(`✅ Agregada: ${tarea}\n\nTienes ${t.length} tareas. Escribe bf tareas para verlas.`);
      return res.status(200).json({ ok: true });
    }
    if (texto.startsWith('bf borrar ')) {
      const n = parseInt(prompt.split(' ')[2]) - 1;
      const t = await kvGet(KEY_TAREAS);
      if (t[n]) { const borrada = t.splice(n,1)[0]; await kvSet(KEY_TAREAS, t); await send(`🗑️ Borrada: ${borrada}`); }
      else await send(`❌ No hay tarea con ese número. Escribe bf tareas`);
      return res.status(200).json({ ok: true });
    }
    if (texto === 'bf limpiar') { await kvSet(KEY_TAREAS, []); await send(`🧹 Listo, borré todas tus tareas.`); return res.status(200).json({ ok: true }); }
    if (texto.startsWith('bf nota ')) {
      const nota = prompt.slice(8).trim();
      const n = await kvGet(KEY_NOTAS); n.push(nota); await kvSet(KEY_NOTAS, n);
      await send(`📝 Nota guardada: ${nota}`); return res.status(200).json({ ok: true });
    }
    if (texto === 'bf notas') {
      const n = await kvGet(KEY_NOTAS);
      if (!n.length) await send(`📝 No tienes notas. Guarda una con:\nbf nota mi idea`);
      else await send(`📝 TUS NOTAS:\n\n` + n.map((x,i) => `${i+1}. ${x}`).join('\n'));
      return res.status(200).json({ ok: true });
    }
    if (texto === 'bf tareas' || texto === 'bf resumen' || texto === 'bf clima') {
      const t = await kvGet(KEY_TAREAS);
      const c = await fetch('https://api.open-meteo.com/v1/forecast?latitude=33.4484&longitude=-112.0740&current=temperature_2m&timezone=America/Phoenix').then(r => r.json());
      const r = await fetch('https://ia-unificada-bf.vercel.app/api/cerebro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Resumen del día para BF. Clima ${c.current.temperature_2m} grados en Phoenix. Tareas: ${t.join(', ') || 'sin tareas'}. Que sea corto y estilo mexicano.`, historial: [] }) }).then(r => r.json());
      await send(`📋 RESUMEN COPILOTO BF\n\n🌤️ Phoenix: ${c.current.temperature_2m}°C\n📋 Tareas (${t.length}):\n${t.map((x,i) => `${i+1}. ${x}`).join('\n') || 'Sin tareas'}\n\n🧠 ${r.text}`);
      return res.status(200).json({ ok: true });
    }

    
// --- FB POST ---
if (texto.startsWith('bf post fb ')) {
  const contenido = prompt.slice(11).trim();
  const r = await fetch('https://ia-unificada-bf.vercel.app/api/post-fb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: contenido })
  });
  const d = await r.json();
  if (d.id) await send(`OK Publicado en FB:\n${contenido}`);
  else await send(`Error FB: ${JSON.stringify(d)}`);
  return res.status(200).json({ ok: true });
}

// --- VOZ + IA (lo que ya tenías) ---
    if (msg.voice) {
      await send(`🎤 Te escucho jefe...`);
      const f = await fetch(`${api}/getFile?file_id=${msg.voice.file_id}`).then(r => r.json());
      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${f.result.file_path}`;
      const audio = await fetch(fileUrl).then(r => r.arrayBuffer());
      const form = new FormData();
      form.append('file', new Blob([audio], { type: 'audio/ogg' }), 'voz.ogg');
      form.append('model', 'whisper-large-v3'); form.append('language', 'es');
      const tr = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${GROQ}` }, body: form }).then(r => r.json());
      prompt = tr.text || "";
      await send(`🎤 Escuché: ${prompt}`);
    }
    if (!prompt) return res.status(200).json({ ok: true });
    if (texto.startsWith('bf ia ')) prompt = prompt.slice(6);

    const r = await fetch('https://ia-unificada-bf.vercel.app/api/cerebro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, historial: [{ role: 'user', content: prompt }] }) }).then(r => r.json());
    const respuesta = r.text || 'No me respondió mi cerebro.';
    await send(`🤖 COPILOTO BF - CEREBRO [${r.cerebro || 'BF x13'}]:\n\n${respuesta}`);

    try {
      const tts = await fetch('https://api.groq.com/openai/v1/audio/speech', { method: 'POST', headers: { Authorization: `Bearer ${GROQ}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'playai-tts', input: respuesta.slice(0, 800), voice: 'Atlas-PlayAI', response_format: 'mp3' }) });
      if (tts.ok) {
        const buf = Buffer.from(await tts.arrayBuffer());
        const form2 = new FormData();
        form2.append('chat_id', String(chatId));
        form2.append('voice', new Blob([buf], { type: 'audio/mpeg' }), 'respuesta.mp3');
        await fetch(`${api}/sendVoice`, { method: 'POST', body: form2 });
      }
    } catch (e) { console.error("TTS", e); }
    return res.status(200).json({ ok: true });
  } catch (e) { console.error(e); return res.status(200).json({ ok: true }); }
}
