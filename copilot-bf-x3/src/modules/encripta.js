import crypto from 'crypto';
import fs from 'fs';

const ALGO = 'aes-256-gcm';
// Llave derivada de tu fecha + Higuera (solo tú la sabes)
const SECRETO = "[STRIPPED 79 bytes]";
const KEY = crypto.scryptSync(SECRETO, 'La Higuera de Zaragoza', 32);

export function encriptar(texto){
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let enc = cipher.update(texto, 'utf8', 'hex');
  enc += cipher.final('hex');
  const auth = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + auth + ':' + enc;
}

export function desencriptar(payload){
  const [ivHex, authHex, encHex] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authHex, 'hex'));
  let dec = decipher.update(encHex, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

// Encripta todo lo sensible
export function blindarLegado(){
  const sensibles = [
    '.bf_bio/legado/supervivencia.log',
    'src/legado/juramento.js',
    'src/config.js'
  ];
  for(const f of sensibles){
    if(fs.existsSync(f)){
      const data = fs.readFileSync(f,'utf8');
      const enc = encriptar(data);
      fs.writeFileSync(f+'.enc', enc);
      console.log(`🔒 Encriptado: ${f} -> ${f}.enc`);
    }
  }
}
