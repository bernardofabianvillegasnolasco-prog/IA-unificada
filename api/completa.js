export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {accion, prompt} = req.body || {};
  if(!prompt) return res.status(400).json({error:"prompt requerido"});
  let resultado = "";
  switch(accion){
    case "traducir": resultado = `Traducción BF: ${prompt} -> (simulación) ${prompt} en inglés`; break;
    case "resumir": resultado = `Resumen BF: ${prompt.slice(0,100)}... [Resumido mas arriba que lo alto]`; break;
    case "codigo": resultado = `// Código BF mas arriba que lo alto\nfunction ${prompt.replace(/\s+/g,'_')}(){\n  console.log("Hecho por BERNARDO FABIAN VILLEGAS NOLAZCO");\n}`; break;
    case "idea": resultado = `Ideas BF para "${prompt}": 1. Hazlo mas arriba que lo alto 2. Agrega IA 3. Hazlo inmortal`; break;
    default: resultado = `Función BF: ${accion||'general'} procesada - ${prompt}`;
  }
  return res.json({accion, resultado, creador:"BERNARDO FABIAN VILLEGAS NOLAZCO"});
}
