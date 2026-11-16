export default async function handler(req, res){
  const q = (req.query.q||'').toLowerCase();
  const ciudad = req.query.ciudad || 'Phoenix';
  if(q.includes('clima') || q.includes('tiempo')){
    try{
      const r = await fetch(`https://wttr.in/${encodeURIComponent(ciudad)}?format=j1`);
      const j = await r.json();
      const c = j.current_condition?.[0];
      return res.json({ tipo:'clima', ciudad, temp_c:c?.temp_C, sensacion:c?.FeelsLikeC, humedad:c?.humidity, descripcion:c?.weatherDesc?.[0]?.value, viento:c?.windspeedKmph });
    }catch(e){ return res.json({ tipo:'clima', ciudad, error:'no pude traer clima' }); }
  }
  if(q.includes('manejo') || q.includes('conduciendo')) return res.json({ tipo:'manejo', modo:'manejo', mensaje:'Modo manejo activado, Berna. Solo voz, sin texto largo. Dalia te lee todo.' });
  if(q.includes('gym') || q.includes('rutina') || q.includes('ejercicio')) return res.json({ tipo:'gym', rutina:['Calentamiento 5 min','Press banca 4x10','Sentadilla 4x12','Remo 4x10','Plancha 3x45s'], nota:'Rutina BF - dale con todo, Berna.' });
  if(q.includes('focus') || q.includes('concentr')) return res.json({ tipo:'focus', minutos:25, mensaje:'Focus BF 25 minutos, sin distracciones.' });
  if(q.includes('diario') || q.includes('nota') || q.includes('apunta')) return res.json({ tipo:'nota', mensaje:'Dime qué apunto y lo guardo en tu memoria, Berna.' });
  return res.json({ tipo:'ayuda', funciones:['clima','recordatorios','gym','manejo','focus','notas','musica','diario'] });
}
