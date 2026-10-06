import { blindarLegado } from './modules/encripta.js';
import { defenderHermandad } from './modules/hermandad.js';

const cmd = process.argv[2];
if(cmd === 'backup'){
  console.log("💾 Backup Higuera Encriptado - Más arriba que lo alto");
  blindarLegado();
  console.log("☁️ Multi-nube: GitHub, GitLab, Codeberg - Encriptado AES-256-GCM");
}
if(cmd === 'hermandad'){
  await defenderHermandad();
}
if(cmd === 'desencripta'){
  const { desencriptar } = await import('./modules/encripta.js');
  import('fs').then(fs=>{
    const enc = fs.readFileSync('.bf_bio/legado/supervivencia.log.enc','utf8');
    console.log(desencriptar(enc));
  });
}
