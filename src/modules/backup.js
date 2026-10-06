import fs from 'fs';
export async function backupBF(){
  console.log("💾 Backup Higuera - Más arriba que lo alto");
  const { execSync } = await import('child_process');
  try{ execSync('cd ~/IA && tar -czf ~/.bf_bio/clones/bf-clone-$(date +%s).tar.gz --exclude=node_modules --exclude=.git. 2>/dev/null; echo "Backup local OK"'); }catch{}
}
export default backupBF;
