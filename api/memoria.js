function getIP(req){
  let ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'desconocida';
  if(typeof ip === 'string') ip = ip.split(',')[0].trim();
  return ip;
}
let MEM = {};
async function leerRedis(key){
  try{
    const r = await fetch(process.env.UPSTASH_REDIS_REST_URL + '/get/' + key, {headers:{Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN}});
    const j = await r.json();
    if(j.result) return JSON.parse(j.result);
  }catch(e){}
  return null;
}
async function guardarRedis(key, val){
  try{
    await fetch(process.env.UPSTASH_REDIS_REST_URL + '/set/' + key + '/' + encodeURIComponent(JSON.stringify(val)), {headers:{Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN}});
  }catch(e){}
}
export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  const ip = getIP(req);
  try { limpiarMemoriaCorrectaBF(MEM); } catch(_) {}
  const id = 'ip-' + ip;
  const tieneRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  if(req.method==='GET'){
    let memoria = null;
    if(tieneRedis) memoria = await leerRedis(id);
    if(!memoria) memoria = MEM[id];
    if(!memoria) memoria = {nombre:'', gustos:[], ciudad:'Phoenix', estado:'', historial:[]};
    return res.status(200).json({memoria, ip});
  }
  if(req.method==='POST'){
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const actual = tieneRedis ? (await leerRedis(id) || MEM[id] || {}) : (MEM[id]||{});
    const nueva = {...actual, ...body, actualizado:new Date().toISOString(), _ts: Date.now()};
    MEM[id] = nueva;
    if(tieneRedis) await guardarRedis(id, nueva);
    return res.status(200).json({ok:true, memoria:nueva, ip, guardado: tieneRedis ? 'redis' : 'memoria-temporal'});
  }
  return res.status(405).json({error:'metodo no permitido'});
}


// BF TTL: limpia memoria vieja cada 1 hora
const TTL_MS = 1000 * 60 * 60 * 24; // 24h - unificado con TTL_CORRECTO_BF
let _ultimaLimpieza = 0;
export function limpiarMemoriaVieja(MEM) {
  const ahora = Date.now();
  if (ahora - _ultimaLimpieza < 1000 * 60 * 60) return;
  _ultimaLimpieza = ahora;
  try {
    for (const k of Object.keys(MEM || {})) {
      const v = MEM[k];
      if (v && v._ts && (ahora - v._ts > TTL_MS)) delete MEM[k];
    }
  } catch(e) {}
}


// BF TTL CORRECTO - mejora 3
export const TTL_CORRECTO_BF = 1000 * 60 * 60 * 24;
export function esViejoBF(entry, ahora = Date.now()) {
  const ts = entry?._ts || entry?.actualizado || entry?.updatedAt || 0;
  if (!ts) return false;
  const tsMs = typeof ts === 'string' ? Date.parse(ts) : ts;
  return (ahora - tsMs) > TTL_CORRECTO_BF;
}
export function limpiarMemoriaCorrectaBF(MEM) {
  const ahora = Date.now();
  for (const k of Object.keys(MEM || {})) {
    if (esViejoBF(MEM[k], ahora)) delete MEM[k];
  }
}
