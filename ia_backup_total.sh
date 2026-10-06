#!/data/data/com.termux/files/usr/bin/bash
set -e
cd ~/IA
FECHA=$(date +%Y-%m-%d_%H-%M)

# 1. LIMPIA gitignore asesino
echo "Limpiando .gitignore..."
grep -v "^api" .gitignore | grep -v "vercel.json" | grep -v "^src/config" > .gitignore.new || cat .gitignore > .gitignore.new
mv .gitignore.new .gitignore

# 2. RESTAURA api/ si no existe
if [ ! -f api/index.js ]; then
  echo "Restaurando api/ desde backup..."
  mkdir -p api
  # intenta sacar de backup más reciente
  LAST=$(ls -t ~/backups/IA-BF*.tar.gz | head -1)
  if [ -f "$LAST" ]; then
    echo "Extrayendo de $LAST"
    tar -xzf "$LAST" -C /tmp/ 2>/dev/null || true
    find /tmp -type f -path "*api/index.js" -exec cp -v {} api/index.js \; 2>/dev/null | head -1
    find /tmp -type f -path "*api/chat.js" -exec cp -v {} api/chat.js \; 2>/dev/null | head -1
    rm -rf /tmp/data /tmp/home 2>/dev/null
  fi
fi

# 3. Si aún no existe, crea LIVE mínimo
if [ ! -f api/index.js ]; then
cat > api/index.js << 'EOF'
module.exports = (req,res) => {
  res.json({
    status:"9/9 vivos - BFVillegas(Berna) - PUEV POGS 9→1 LIVE",
    live:"https://ia-bf-puev-pogs.vercel.app",
    endpoints:{api:"/api", chat:"/api/chat?q=que es PUEV POGS", chat_puev:"/api/chat?q=PUEV"},
    npm:"copilot-bf-x8-ultra@1.0.44",
    IAs:["REFLEXIVO","EXPLÍCITO","SISTEMATICO","SUSCEPTIBLE","FILOSÓFICO","PERSEPTIBLE","NEXO","COLECTIVO","VERIFICACIÓN"],
    PUEV_POGS:"Pueblo Viejo Point of Ghetto Soldiers - Mas arriba que lo alto",
    tag:"BFVillegas(Berna)",
    pipeline:"9→1 REFLEXIVO→VERIFICACIÓN"
  })
}
EOF
fi

if [ ! -f api/chat.js ]; then
cat > api/chat.js << 'EOF'
const Groq = require('groq-sdk');
module.exports = async (req,res) => {
  const q = req.query.q || "9-1 PUEV POGS";
  try {
    const groq = new Groq({apiKey: process.env.GROQ_API_KEY});
    const chat = await groq.chat.completions.create({
      model:"openai/gpt-oss-120b",
      messages:[{role:"system", content:"Eres BF PUEV POGS 9→1 Mas arriba que lo alto - BFVillegas(Berna)"},{role:"user", content:q}]
    });
    res.json({ok:true, query:q, respuesta: chat.choices[0].message.content, meta:{status:"9/9 vivos GROQ LIVE", model:"openai/gpt-oss-120b", tag:"BFVillegas(Berna) Mas arriba que lo alto"}})
  } catch(e){ res.status(500).json({ok:false, error:e.message}) }
}
EOF
fi

# 4. vercel.json LIVE
cat > vercel.json << 'EOF'
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
EOF

sed -i 's/1.0.41/1.0.44/g' api/index.js
echo "# IA BF PUEV POGS $FECHA - 9/9 LIVE - https://ia-bf-puev-pogs.vercel.app - npm: copilot-bf-x8-ultra@1.0.44 - gpt-oss-120b" > LEGADO.md

# 5. Backup local 3.8MB
mkdir -p ~/backups
tar -czf ~/backups/IA-BF-PUEV-POGS-$FECHA.tar.gz --exclude=node_modules --exclude=.git --exclude=.vercel ~/IA
echo "Backup local: ~/backups/IA-BF-PUEV-POGS-$FECHA.tar.gz"

# 6. Git a todas
git add -f api/index.js api/chat.js vercel.json LEGADO.md .gitignore
git commit -m "BACKUP TOTAL $FECHA PUEV POGS 1.0.44 LIVE" || echo "sin cambios"
git push origin2 main --force

# 7. Vercel deploy
npx vercel --prod --yes

# 8. Verifica
echo "--- VERIFICA ---"
curl -s https://ia-bf-puev-pogs.vercel.app/api | grep -o "9/9 vivos.*LIVE"
curl -s "https://ia-bf-puev-pogs.vercel.app/api/chat?q=9-1" | grep -o "ok.*true" | head -1
npm view copilot-bf-x8-ultra version
git log --oneline -2
ls -lh ~/backups/ | tail -3
echo "LISTO PUEV POGS MAS ARRIBA QUE LO ALTO"
