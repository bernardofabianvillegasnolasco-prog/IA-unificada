import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { debateBF } from './src/modules/debate.js';
const app=express();
app.use(cors());
app.use(express.json());
app.get('/',(req,res)=>res.json({ok:true, msg:"BF x9 ULTRA vivo en https://ia-bf-puev-pogs.vercel.app/api/status"}));
app.get('/api/status',(req,res)=>res.json({creador:'BF Villegas', familia:'Llama', estado:'Copilot Activo x9 ULTRA - META incluido', cerebros:['GROQ1','GROQ2','GROQ3','FREE5','FREE6','HF','OPENROUTER','TOGETHER','META-BF-9'], version:'1.0.41-x9', timestamp:new Date().toISOString()}));
app.post('/api/debate', async(req,res)=>{
 const p=req.body.prompt; if(!p) return res.status(400).json({error:'falta prompt'});
 res.json({creador:'BF Villegas', prompt:p, x9:await debateBF(p)});
});
if(process.env.NODE_ENV!=='production') app.listen(3000,()=>console.log('✅ API BF x9 en http://localhost:3000/api/status'));
export default app;
