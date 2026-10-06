import fs from "fs";
import { execSync } from "child_process";

export function runRestore() {
  const root = "/sdcard/IA-backup";
  if (!fs.existsSync(root)) { console.log("❌ No hay backups en /sdcard/IA-backup"); return; }
  const dirs = fs.readdirSync(root).filter(d => { try { return fs.statSync(`${root}/${d}`).isDirectory(); } catch { return false; } }).sort().reverse();
  if (dirs.length === 0) { console.log("❌ No hay backups"); return; }
  console.log(`📦 Backups disponibles (${dirs.length}):`);
  dirs.slice(0,10).forEach((d,i)=> console.log(` ${i+1}. ${d}`));
  const latest = dirs[0];
  console.log(`\n♻️ Restaurando último: ${latest} -> ~/IA`);
  execSync(`rsync -av --progress --exclude='node_modules' --exclude='.git' --exclude='.env' "${root}/${latest}/" "$HOME/IA/"`, { stdio: "inherit" });
  console.log(`✅ Restore completado desde ${latest}`);
}

export function runFullStatus(keys) {
  console.log(`\n🤖 ${keys.length} CEREBROS`);
  keys.forEach(k=>console.log(` ✅ ${k.name}`));
  const root = "/sdcard/IA-backup";
  try {
    const dirs = fs.readdirSync(root).filter(d => fs.statSync(`${root}/${d}`).isDirectory());
    const size = execSync(`du -sh ${root} | cut -f1`, { encoding: "utf8" }).trim();
    console.log(`\n📦 BACKUPS: ${dirs.length} en ${root} (${size})`);
    dirs.sort().reverse().slice(0,5).forEach(d=>console.log(` - ${d}`));
  } catch { console.log("\n📦 BACKUPS: 0"); }
  console.log("");
}
