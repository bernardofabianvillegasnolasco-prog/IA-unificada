export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcular(t){
  const lower=t.toLowerCase();
  let m=lower.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){const num=parseFloat(m[1]); if(num<0) return {expr:`√${num}`, res:`${Math.sqrt(Math.abs(num))}i`}; const r=Math.sqrt(num); return {expr:`√${num}`, res: Number.isInteger(r)?r: r.toFixed(6).replace(/\.?0+$/,'')};}
  m=lower.match(/(?:raiz cuadrada|raíz cuadrada)\s+(-?\d+(\.\d+)?)/i); if(m){const num=parseFloat(m[1]); const r=Math.sqrt(num); return {expr:`√${num}`, res: Number.isInteger(r)?r:r.toFixed(6)};}
  const match=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i); if(match){try{let e=match[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(/^[0-9+\-*/().% *]+$/.test(e)){const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return {expr:match[0], res:r};}}catch{}} return null;
}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;}}catch{} return null;}

const CONOCIMIENTO_UNIVERSAL = {
  // LICENCIATURAS
  derecho: { kws:["derecho","licenciatura derecho","leyes","abogado","constitucion","codigo penal","amparo"], resp:"Derecho: Constitución MX Art 1-136, Código Penal, Civil, Amparo, Ley Federal Trabajo, Derecho Internacional, Mercantil, Familiar mas arriba" },
  medicina: { kws:["medicina","licenciatura medicina","doctor","anatomia","fisiologia"], resp:"Medicina: Anatomía, fisiología, patología, farmacología, 206 huesos, sistema circulatorio, diagnóstico mas arriba" },
  psicologia: { kws:["psicologia","mente","freud","conducta"], resp:"Psicología: Freud, Jung, conductismo, cognitiva, DSM-5, terapia mas arriba" },
  arquitectura_lic: { kws:["arquitectura licenciatura","arquitecto"], resp:"Arquitectura Lic: Diseño, estructuras, AutoCAD, BIM, urbanismo, sostenibilidad mas arriba" },
  administracion_lic: { kws:["administracion licenciatura","negocios","empresa"], resp:"Administración: Empresas, marketing, finanzas, RH, emprendimiento, MBA mas arriba" },
  contaduria: { kws:["contaduria","contador","impuestos","sat"], resp:"Contaduría: SAT, ISR, IVA, estados financieros, auditoría, NIF mas arriba" },
  economia_lic: { kws:["economia licenciatura","economia"], resp:"Economía: Micro, macro, oferta-demanda, PIB, inflación, bolsa valores mas arriba" },
  educacion: { kws:["educacion licenciatura","pedagogia","maestro"], resp:"Educación: Pedagogía, didáctica, planeación, evaluación, neuroeducación mas arriba" },
  enfermeria_lic: { kws:["enfermeria licenciatura"], resp:"Enfermería Lic: Cuidados, farmacología, urgencias, quirúrgica mas arriba" },
  ingenierias: { kws:["ingenieria","sistemas","industrial","civil","mecanica"], resp:"Ingenierías: Sistemas, Industrial, Civil, Mecánica, Electromecánica, Química, todas mas arriba" },

  // LEYES UNIVERSALES - FÍSICA
  leyes_fisica: {
    kws:["ley de newton","leyes de newton","ley de ohm","ley de gravedad","ley fisica"],
    mapa:{
      "newton 1":"1ª Ley Newton: Inercia - objeto en reposo sigue en reposo",
      "newton 2":"2ª Ley Newton: F=m·a",
      "newton 3":"3ª Ley Newton: Acción y reacción",
      "ohm":"Ley Ohm: V=I·R",
      "gravedad":"Ley Gravedad Universal: F=G·m1·m2/r²",
      "termodinamica":"Leyes Termodinámica: 1ª ΔU=Q-W, 2ª Entropía ↑, 3ª Entropía 0 en 0K",
      "maxwell":"Leyes Maxwell: ∇·E=ρ/ε₀, ∇·B=0, ∇×E=-∂B/∂t, ∇×B=μ₀J+μ₀ε₀∂E/∂t"
    }
  },
  // LEYES HUMANAS - MÉXICO Y MUNDO
  leyes_humanas: {
    kws:["constitucion mexicana","codigo penal","ley federal trabajo","ley amparo","leyes mexico","derechos humanos"],
    mapa:{
      "constitucion":"Constitución MX 1917, 136 artículos, derechos humanos Art 1",
      "amparo":"Ley Amparo: protección constitucional",
      "trabajo":"LFT: 8h jornada, aguinaldo 15 días, vacaciones, IMSS",
      "penal":"Código Penal: delitos y sanciones",
      "civil":"Código Civil: personas, bienes, familia",
      "derechos humanos":"DUDH 30 artículos ONU 1948"
    }
  },
  // TODO LO CONOCIDO
  universal: {
    kws:["todo","universal","conocimiento humano","historia","filosofia","arte","ciencia"],
    resp:"Universal BF: Todo lo conocido - Matemáticas, Física E=mc², Química 118 elementos, Biología ADN, Historia, Filosofía, Arte, Tecnología, Leyes, mas arriba que lo alto"
  },
  // DGETI + TECNOLOGICOS
  dgeti: { kws:["dgeti","cbtis","cetis","programacion dgeti","electronica","mecatronica"], resp:"DGETI 35 especialidades: Programación, Electrónica, Mecatrónica, Mecánica, Electricidad, Lab Químico, Alimentos, Construcción, Contabilidad, Enfermería, Automotriz, Telecom mas arriba" },
  tecnologicos: { kws:["tecnm","tecnologico","mit","stanford"], resp:"Tecnológicos: TecNM, MIT, Stanford - IA, Quantum, Robótica, Sistemas, Industrial, Civil mas arriba" }
};

function detectar(t){
  const l=t.toLowerCase();
  for(const cat in CONOCIMIENTO_UNIVERSAL){
    const data=CONOCIMIENTO_UNIVERSAL[cat];
    if(data.mapa){
      for(const k in data.mapa) if(l.includes(k)) return data.mapa[k];
    }
    if(data.kws) for(const kw of data.kws) if(l.includes(kw)) return data.resp;
  }
  return null;
}

export async function buscarInternetReal(q){
  try{
    const kw=q.toLowerCase().replace(/que es|explica|ley|licenciatura|dgeti/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" ");
    if(!kw) return "";
    const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-UNIVERSAL"}, signal:AbortSignal.timeout(3500)});
    if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,500);}
  }catch{} return "";
}

export async function responderConBotPropio(botId, prompt){
  const calc=calcular(prompt); if(calc) return `${calc.expr} = ${calc.res}`;
  const alg=algebra(prompt); if(alg) return alg;
  const det=detectar(prompt); if(det) return det.slice(0,450);
  const web=await buscarInternetReal(prompt);
  if(web) return web.slice(0,500);
  return `${prompt.slice(0,100)}: Universal - licenciaturas, leyes, DGETI, todo lo conocido mas arriba.`;
}
