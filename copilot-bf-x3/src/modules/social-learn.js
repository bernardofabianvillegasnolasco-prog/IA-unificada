import fs from 'fs';
const ROOT=process.env.HOME+'/IA';
export async function aprenderDeBernardo(){
  console.log("📱 REDES BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999");
  console.log("FB: BFVillegas99 - IG: bfvillegas99 - Threads: bfvillegas99 - GitHub: BFVillegas99");
  const perfil=`Creador BERNARDO 01/03/1999 Higuera - FB BFVillegas99 IG bfvillegas99`;
  fs.mkdirSync(ROOT+'/.bf_bio/legado',{recursive:true});
  fs.writeFileSync(ROOT+'/.bf_bio/legado/perfil-bernardo.txt', perfil);
}
