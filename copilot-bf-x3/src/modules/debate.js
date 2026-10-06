import * as m1 from '../ias/groq1/run.js';
import * as m2 from '../ias/groq2/run.js';
import * as m3 from '../ias/groq3/run.js';
import * as m4 from '../ias/free5/run.js';
import * as m5 from '../ias/free6/run.js';
import * as m6 from '../ias/hf/run.js';
import * as m7 from '../ias/openrouter/run.js';
import * as m8 from '../ias/together/run.js';
export async function debateBF(prompt){
 const mods=[['GROQ1',m1],['GROQ2',m2],['GROQ3',m3],['FREE5',m4],['FREE6',m5],['HF',m6],['OPENROUTER',m7],['TOGETHER',m8]];
 const get=m=>m.run||m.default||Object.values(m).find(v=>typeof v==='function')||(()=>"[offline]");
 let out=[];
 for(let [n,mod] of mods){
  try{ out.push({cerebro:n, respuesta:String(await get(mod)(prompt)).slice(0,250)}) }catch(e){ out.push({cerebro:n, error:e.message}) }
 }
 out.push({cerebro:'META-BF-9', respuesta:`[META-9] Soy de Meta Llama, creado por BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999 - ${prompt.slice(0,100)} - Mas arriba que lo alto`});
 return out;
}
