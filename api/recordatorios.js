export default async function handler(req, res){
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  const ip = (req.headers['x-forwarded-for']||'').split(',')[0].trim() || req.socket?.remoteAddress || 'sin-ip';
  const key = `bf:recordatorios:${ip}`;
  const headers = { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` };
  if(req.method === 'POST'){
    const { texto, cuando } = await new Promise(r=>{ let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(JSON.parse(d||'{}'))); });
    if(!texto) return res.status(400).json({ error:'falta texto' });
    const item = { id: Date.now(), texto, cuando: cuando||'', creado: new Date().toISOString() };
    let lista = [];
    try{
      const r = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, { headers });
      const j = await r.json();
      if(j.result) lista = JSON.parse(j.result);
    }catch(e){}
    lista.push(item);
    await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, { method:'POST', headers:{...headers,'Content-Type':'application/json'}, body: JSON.stringify(JSON.stringify(lista)) });
    return res.json({ ok:true, guardado:item, total:lista.length });
  }
  if(req.method === 'GET'){
    try{
      const r = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, { headers });
      const j = await r.json();
      return res.json({ recordatorios: j.result ? JSON.parse(j.result) : [] });
    }catch(e){ return res.json({ recordatorios:[] }); }
  }
  if(req.method === 'DELETE'){
    await fetch(`${UPSTASH_REDIS_REST_URL}/del/${key}`, { method:'POST', headers });
    return res.json({ ok:true, limpio:true });
  }
  return res.status(405).json({ error:'metodo no permitido' });
}
