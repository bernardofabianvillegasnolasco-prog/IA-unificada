export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };
function calcular(t){const m=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i); if(!m)return null; try{let e=m[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(!/^[0-9+\-*/().% *]+$/.test(e))return null; const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r))return{expr:m[0],res:r};}catch{} return null;}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;}}catch{} return null;}
export async function buscarInternetReal(q){try{const kw=q.toLowerCase().replace(/que es|explica|resuelve|ecuacion|teoria|traduce/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" "); if(!kw)return ""; const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v5.0"}, signal:AbortSignal.timeout(3500)}); if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,450);}}catch{} return "";}
export async function responderConBotPropio(botId, prompt, historial=[]){
  const calc=calcular(prompt); if(calc) return `${calc.expr} = ${calc.res}`;
  const alg=algebra(prompt); if(alg) return alg;
  const ctx = historial.length>0? `Contexto previo: ${historial.slice(-3).join(" | ")} - ` : "";
  const web=await buscarInternetReal(prompt);
  if(web) return (botId==="BF-LIDER"? ctx+web.slice(0,400) : ctx+web.slice(0,450));
  return botId==="BF-LIDER"? `${ctx}${prompt.slice(0,100)}: directo mas arriba.` : `${ctx}${prompt.slice(0,100)}: análisis supremo mas arriba.`;
}
