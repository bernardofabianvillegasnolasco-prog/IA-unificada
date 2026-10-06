export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcular(t){
  const lower=t.toLowerCase();
  let m=lower.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){const num=parseFloat(m[1]); if(num<0) return {expr:`√${num}`, res:`${Math.sqrt(Math.abs(num))}i`}; const r=Math.sqrt(num); return {expr:`√${num}`, res: Number.isInteger(r)?r: r.toFixed(4)};}
  m=lower.match(/(?:raiz cuadrada|raíz cuadrada)\s+(-?\d+(\.\d+)?)/i); if(m){const num=parseFloat(m[1]); const r=Math.sqrt(num); return {expr:`√${num}`, res: Number.isInteger(r)?r:r.toFixed(4)};}
  const match=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i); if(match){try{let e=match[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(/^[0-9+\-*/().% *]+$/.test(e)){const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return {expr:match[0], res:r};}}catch{}} return null;
}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;}}catch{} return null;}

const OMNI = {
  // ALBAÑILERÍA - FIX PRINCIPAL
  albanileria: { kws:["albañileria","albañil","ladrillo","tabique","pegar ladrillo","como pegar","muro","block","mezcla","mortero","cemento"], resp:"ALBAÑILERÍA - Como pegar ladrillo/tabique:\n1. Traza con hilo y plomada, escuadra 3-4-5\n2. Mezcla mortero 1:4 (1 bote cemento + 4 arena + agua)\n3. Moja el tabique 10min\n4. Pon mezcla 1.5cm en base\n5. Asienta tabique, golpea con mango cuchara, junta 1-1.5cm\n6. Nivela con nivel de mano, plomea cada 3 hiladas\n7. Cuatrapea (mitad de tabique) para amarrar\n8. 1m² = 25 tabiques 7x14x28, 0.04m³ mezcla, 7kg cemento. Mas arriba" },
  agricultura: { kws:["agricultura","agronomia","cultivo","siembra"], resp:"Agricultura: Suelo pH 6-7, NPK, riego goteo, maíz 8t/ha, hidroponía mas arriba" },
  ganaderia: { kws:["ganaderia","ganado","bovino"], resp:"Ganadería: Bovino 450kg, Angus, leche 25L/día, pastoreo rotacional mas arriba" },
  nutriologia: { kws:["nutriologia","nutricion","dieta"], resp:"Nutriología: 4-4-9 kcal, TMB, 2000kcal, vitaminas mas arriba" },
  medicina: { kws:["medicina","doctor","anatomia"], resp:"Medicina: 206 huesos, 120/80, O+, farmacología mas arriba" },
  balistica: { kws:["balistica","bala","proyectil","arma"], resp:"Balística: y=x tanθ - gx²/2v²cos²θ, 9mm 350m/s, 7.62 800m/s mas arriba" },
  astrologia: { kws:["astrologia","zodiaco","aries","horoscopo"], resp:"Astrología: 12 signos, Aries fuego 21mar-19abr, carta astral mas arriba" },
  derecho: { kws:["derecho","leyes","constitucion"], resp:"Derecho: Constitución 136 arts, Penal, Civil, LFT, Amparo mas arriba" },
  leyes_fisica: { kws:["ley newton","ley ohm","newton","ohm"], resp:"Leyes Física: Newton F=ma, Ohm V=IR, Gravedad F=Gm1m2/r² mas arriba" },
  dgeti: { kws:["dgeti","cbtis","programacion dgeti","electronica"], resp:"DGETI 35: Programación, Electrónica, Mecatrónica, Mecánica, Electricidad mas arriba" }
};

function detectar(t){
  const l=t.toLowerCase().replace(/[()]/g," ");
  for(const cat in OMNI){
    for(const kw of OMNI[cat].kws) if(l.includes(kw)) return OMNI[cat].resp;
  }
  return null;
}

export async function buscarInternetReal(q){
  try{
    const clean=q.toLowerCase().replace(/como|que es|explica|pegar|un/g,"").trim();
    const kw=clean.split(" ").filter(w=>w.length>2).slice(0,2).join(" ");
    if(!kw) return "";
    const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v6.1"}, signal:AbortSignal.timeout(3000)});
    if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,500);}
  }catch{} return "";
}

export async function responderConBotPropio(botId, prompt){
  const calc=calcular(prompt); if(calc) return `${calc.expr} = ${calc.res}`;
  const alg=algebra(prompt); if(alg) return alg;
  const det=detectar(prompt); if(det) return det.slice(0,600);
  const web=await buscarInternetReal(prompt);
  if(web) return web.slice(0,500);
  return `${prompt.slice(0,100)}: explicado mas arriba.`;
}
