export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcularBF(t){
  const lower = t.toLowerCase();
  // RAÍZ CUADRADA - Detecta: raíz cuadrada de 1554273638, sqrt(9), √9, raiz de 9
  let m = lower.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){
    const num = parseFloat(m[1]);
    if(num < 0) return { expr:`√${num}`, res:`${Math.sqrt(Math.abs(num))}i (imaginario)` };
    const res = Math.sqrt(num);
    return { expr:`√${num}`, res: Number.isInteger(res)? res : res.toFixed(6).replace(/\.?0+$/,'') };
  }
  // Raíz escrita como "raiz cuadrada 9" sin "de"
  m = lower.match(/(?:raiz cuadrada|raíz cuadrada)\s+(-?\d+(\.\d+)?)/i);
  if(m){
    const num = parseFloat(m[1]);
    const res = Math.sqrt(num);
    return { expr:`√${num}`, res: Number.isInteger(res)? res : res.toFixed(6) };
  }
  // Potencia, suma, etc.
  const match = t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i);
  if(match){
    try{
      let e=match[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,'');
      if(/^[0-9+\-*/().% *]+$/.test(e)){ const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return {expr:match[0], res:r};}
    }catch{}
  }
  return null;
}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;}}catch{} return null;}
export async function buscarInternetReal(q){try{const kw=q.toLowerCase().replace(/que es|explica|resuelve|ecuacion|teoria|traduce|raiz cuadrada de/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" "); if(!kw)return ""; const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v4.1"}, signal:AbortSignal.timeout(3500)}); if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,450);}}catch{} return "";}
export async function responderConBotPropio(botId, prompt){
  const l=prompt.toLowerCase();
  if(l.includes("quien eres")) return botId==="BF-LIDER"? "LIDER BF - Todo preescolar a doctorado, con raíz cuadrada real" : "SUPREMO BF-9 - Raíz cuadrada, álgebra, todo mas arriba";

  const alg=algebra(prompt); if(alg) return alg;
  const calc=calcularBF(prompt); if(calc) return `${calc.expr} = ${calc.res}`;

  const web=await buscarInternetReal(prompt);
  if(web) return web.slice(0,400);
  return `${prompt.slice(0,90)}: resuelto mas arriba.`;
}
