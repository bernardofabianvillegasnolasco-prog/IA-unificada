export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };
function calcular(t){
  const l=t.toLowerCase();
  let m=l.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){const n=parseFloat(m[1]); if(n<0) return {expr:`√${n}`, res:`${Math.sqrt(Math.abs(n))}i`}; const r=Math.sqrt(n); return {expr:`√${n}`, res: Number.isInteger(r)?r: r.toFixed(4)};}
  m=l.match(/(?:raiz cuadrada|raíz cuadrada)\s+(-?\d+(\.\d+)?)/i); if(m){const n=parseFloat(m[1]); const r=Math.sqrt(n); return {expr:`√${n}`, res: Number.isInteger(r)?r:r.toFixed(4)};}
  const mt=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i); if(mt){try{let e=mt[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(/^[0-9+\-*/().% *]+$/.test(e)){const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return {expr:mt[0], res:r};}}catch{}} return null;
}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;}}catch{} return null;}

const OMNI = {
  albanileria: { kws:["albañileria","albañil","ladrillo","tabique","pegar ladrillo","como pegar","muro","block","mezcla","mortero","castillo","cemento","cimbra"], resp:"ALBAÑILERÍA BF REAL:\n1. Traza hilo + plomada, escuadra 3-4-5 (60-80-100cm)\n2. Mortero 1:4 = 1 bote cemento + 4 arena + agua hasta pastosa\n3. Moja tabique 10min para no chupe agua\n4. Cama mezcla 1.5cm, asienta tabique golpeando mango cuchara\n5. Junta vertical 1cm, horizontal 1.5cm, nivel cada hilada\n6. Cuatrapea: cada hilada mitad para amarrar, castillo cada 3m con 4 varillas 3/8\n7. Cálculo: 1m² = 25 tabiques 7x14x28, 0.04m³ mezcla, 7kg cemento, 0.03m³ arena\n8. Concreto dala 15x20 f'c150 = 1:2:3" },
  agricultura: { kws:["agricultura","agronomia","cultivo","siembra","maiz","hidroponia"], resp:"Agricultura: Suelo pH 6-7, NPK 120-60-60 maíz, riego goteo 5L/m²/día, maíz 8t/ha, trigo 6t/ha, hidroponía NFT, agricultura regenerativa" },
  ganaderia: { kws:["ganaderia","ganado","bovino","vaca","cerdo","ovino"], resp:"Ganadería: Bovino 450kg, Angus/Brahman, consumo 2.5% peso, leche 25L/día, IA, pastoreo rotacional, sanidad" },
  nutriologia: { kws:["nutriologia","nutricion","dieta","calorias"], resp:"Nutriología: Macros 4-4-9 kcal/g, TMB Mifflin, 2000kcal dieta, proteína 1.6g/kg, vitaminas A-Z" },
  medicina: { kws:["medicina","medico","anatomia","cirugia"], resp:"Medicina: 206 huesos, corazón 70lpm, 120/80 mmHg, O+, farmacología, diagnóstico" },
  balistica: { kws:["balistica","bala","proyectil","arma","calibre"], resp:"Balística: Trayectoria y=x tanθ - gx²/2v²cos²θ, 9mm 350m/s 400J, 7.62 800m/s 2000J, peritaje forense" },
  astrologia: { kws:["astrologia","zodiaco","aries","horoscopo","carta astral"], resp:"Astrología: 12 signos - Aries fuego 21mar-19abr líder, Tauro tierra, Géminis aire, Cáncer agua, etc. Planetas, casas, ascendente" },
  derecho: { kws:["derecho","constitucion","leyes","penal"], resp:"Derecho: Constitución MX 136 arts, Penal, Civil, LFT 8h + 15d aguinaldo, Amparo, Mercantil" },
  dgeti: { kws:["dgeti","cbtis","cetis","programacion","electronica"], resp:"DGETI 35 especialidades: Programación, Electrónica, Mecatrónica, Mecánica, Electricidad, Lab Químico, Construcción, Contabilidad, etc." },
  universal: { kws:["universal","todo","conocimiento"], resp:"Universal BF: Todo lo conocido preescolar-doctorado, todas las carreras mas arriba" }
};
function detectar(t){const l=t.toLowerCase().replace(/[()]/g," "); for(const c in OMNI) for(const k of OMNI[c].kws) if(l.includes(k)) return OMNI[c].resp; return null;}
export async function buscarInternetReal(q){try{const kw=q.toLowerCase().replace(/como|que es|explica|pegar|un|de/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" "); if(!kw) return ""; const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v7"}, signal:AbortSignal.timeout(3000)}); if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,550);}}catch{} return "";}
export async function responderConBotPropio(botId, prompt, hist=[]){
  const calc=calcular(prompt); if(calc) return `${calc.expr} = ${calc.res}`;
  const alg=algebra(prompt); if(alg) return alg;
  const det=detectar(prompt); if(det) return det.slice(0,650);
  const web=await buscarInternetReal(prompt); if(web) return web.slice(0,600);
  return `${prompt.slice(0,100)}: BF Omni - todas las carreras, albañilería, todo mas arriba.`;
}
