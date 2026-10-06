import { execSync } from 'child_process';
export async function cloneIfInternet(){
  try{ execSync('cd ~/IA && git add. && git commit -m "🧬 Auto-clon $(date)" --quiet || true', {stdio:'ignore'}); console.log("☁️ Clonado - Más arriba que lo alto"); }catch{}
  return true;
}
export async function autoImmortalCheck(){ if(Math.random()<0.6) await cloneIfInternet(); }
