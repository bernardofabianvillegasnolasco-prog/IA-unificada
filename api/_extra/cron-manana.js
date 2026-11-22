export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;
    const api = `https://api.telegram.org/bot${TOKEN}`;
    const t = await fetch(`${KV_URL}/get/tareas:${CHAT_ID}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } }).then(r => r.json()).then(r => r?.result ? JSON.parse(r.result) : []).catch(() => []);
    const c = await fetch('https://api.open-meteo.com/v1/forecast?latitude=33.4484&longitude=-112.0740&current=temperature_2m&timezone=America/Phoenix').then(r => r.json());
    const r = await fetch('https://ia-unificada-bf.vercel.app/api/cerebro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Resumen buenos días BF Phoenix. Clima ${c.current.temperature_2m} grados. Tareas: ${t.join(', ') || 'sin tareas'}. Corto, motivador, estilo mexicano.`, historial: [] }) }).then(r => r.json());
    const msg = `☀️ BUENOS DÍAS BF - COPILOTO BF\n\n🌤️ Phoenix: ${c.current.temperature_2m}°C\n📋 TAREAS DE HOY (${t.length}):\n${t.map((x,i) => `${i+1}. ${x}`).join('\n') || 'Sin tareas, día libre jefe'}\n\n🧠 ${r.text}`;
    await fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: msg }) });
    return res.status(200).json({ ok: true });
  } catch (e) { console.error(e); return res.status(200).json({ ok: false }); }
}
