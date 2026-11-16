let MEM = {};
function getIP(req){
  let ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'desconocida';
  if(typeof ip === 'string') ip = ip.split(',')[0].trim();
  return ip;
}
export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  const id = 'ip-' + getIP(req);
  if(req.method==='GET'){
    return res.status(200).json({memoria: MEM[id] || {nombre:'', gustos:[], ciudad:'Phoenix', estado:'', historial:[]}, ip: getIP(req)});
  }
  if(req.method==='POST'){
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    MEM[id] = {...(MEM[id]||{}), ...body, actualizado:new Date().toISOString()};
    return res.status(200).json({ok:true, memoria: MEM[id], ip: getIP(req)});
  }
  return res.status(405).json({error:'metodo no permitido'});
}
