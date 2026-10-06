import fs from 'fs';
import { execSync } from 'child_process';
const ROOT=process.env.HOME+'/IA';
export async function descargarFotosBernardo(){
  const dir=ROOT+'/.bf_bio/fotos-bernardo/ig';
  fs.mkdirSync(dir,{recursive:true});
  console.log("📸 Foto-learn: Directorio creado en ~/.bf_bio/fotos-bernardo/ - Para IG privado haz: instaloader --login bfvillegas99");
  fs.writeFileSync(ROOT+'/.bf_bio/legado/perfil-visual.txt', `FOTOS BERNARDO 01/03/1999 - ${new Date().toISOString()} - Más arriba que lo alto`);
  console.log("✅ Perfil visual creado");
}
export async function autoFotoLearn(){ await descargarFotosBernardo(); }
