#!/usr/bin/env node
import 'dotenv/config';
import Groq from 'groq-sdk';
import { PROMPT_BF } from './src/config.js';

const keys = [
  {name:"GROQ1", key:process.env.GROQ_API_KEY},
  {name:"GROQ2", key:process.env.GROQ2_API_KEY},
  {name:"GROQ3", key:process.env.GROQ3_API_KEY},
].filter(k=>k.key && k.key.startsWith("gsk_"));

console.log(`\n🤖 COPILOT BF ACTIVADO - ${keys.length} CEREBROS CONECTADOS`);
console.log(`Creador: BF Villegas | Familia: Llama de Meta\n`);

async function askAll(question){
  const ideas = [];
  for(const mod of keys){
    try{
      const g = new Groq({apiKey:mod.key});
      const r = await g.chat.completions.create({
        model:"openai/gpt-oss-20b",
        messages:[{role:"system",content:PROMPT_BF},{role:"user",content:question}],
        max_tokens:300
      });
      const t = r.choices[0].message.content;
      console.log(`[${mod.name}]: ${t.slice(0,120)}...`);
      ideas.push(`[${mod.name}]=${t}`);
    }catch(e){ console.log(`[${mod.name} FALLO] ${e.message.slice(0,80)}`); }
  }
  
  // Final colaborativo
  if(ideas.length>0){
    const g = new Groq({apiKey:keys[0].key});
    const final = await g.chat.completions.create({
      model:"openai/gpt-oss-20b",
      messages:[
        {role:"system",content:PROMPT_BF+` Une ${ideas.length} ideas en una respuesta final.`},
        {role:"user",content:`Pregunta: ${question}\nIdeas:\n${ideas.join("\n")}`}
      ],
      max_tokens:600
    });
    console.log(`\n========== COPILOT FINAL x${ideas.length} ==========\n${final.choices[0].message.content}\n`);
  }
}

const q = process.argv.slice(2).join(" ") || "Quien te creo y de que familia eres?";
await askAll(q);
