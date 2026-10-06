# NOTA RESTAURAR - BF PUEV POGS 9→1
# Fecha: 2026-09-22_18-45
# Tag: BFVillegas(Berna) Mas arriba que lo alto

## QUE ES ESTO
Backup total de IA Unificada 9→1 LIVE
- Vercel: https://ia-bf-puev-pogs.vercel.app
- NPM: copilot-bf-x8-ultra@1.0.44
- GitHub: copilot-bf-x3 main
- GROQ: openai/gpt-oss-120b

## DONDE ESTA EL BACKUP
- Telefono: /sdcard/Download/IA-BF-PUEV-POGS-2026-09-22_18-45-TELEFONO.tar.gz
- Termux: ~/backups/IA-BF-PUEV-POGS-2026-09-22_18-45-TELEFONO.tar.gz
- GitHub backup branch: origin2/backup
- GitHub main: origin2/main

## COMO RESTAURAR EN 1 MINUTO
cd ~
rm -rf IA
mkdir IA
tar -xzf /sdcard/Download/IA-BF-PUEV-POGS-2026-09-22_18-45-TELEFONO.tar.gz -C ~ --strip-components=2
# o si lo tienes en ~/backups/
# tar -xzf ~/backups/IA-BF-PUEV-POGS-2026-09-22_18-45-TELEFONO.tar.gz -C ~ --strip-components=2

cd ~/IA
npm install
# pon tu GROQ_API_KEY en .env.local:
echo "GROQ_API_KEY=gsk_tu_key" > .env.local
npx vercel --prod --yes
curl https://ia-bf-puev-pogs.vercel.app/api
curl "https://ia-bf-puev-pogs.vercel.app/api/chat?q=9-1"

## SI VERCEL FALLA (FUNCTION_INVOCATION_FAILED)
cat > vercel.json << 'EOV'
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" },
    { "src": "api/chat.js", "use": "@vercel/node" },
    { "src": "index.html", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/chat", "dest": "/api/chat.js" },
    { "src": "/api", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOV
npx vercel --prod --yes

## SI GIT FALLA
git pull origin2 main --rebase
git add -f api/index.js api/chat.js vercel.json
git commit -m "RESTORE PUEV POGS LIVE"
git push origin2 main --force

## CONTACTO / CLAVE
FB: BFVillegas99
LEMA: Mas arriba que lo alto
PUEV POGS: Pueblo Viejo Point of Ghetto Soldiers
PIPELINE: REFLEXIVO→EXPLÍCITO→SISTEMATICO→SUSCEPTIBLE→FILOSÓFICO→PERSEPTIBLE→NEXO→COLECTIVO→VERIFICACIÓN
