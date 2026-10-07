#!/data/data/com.termux/files/usr/bin/bash
echo "🤖 BOOT BF v33.1 - Iniciado"
while true; do
  echo "[$(date)] Revisando..."
  node -c api/debate.js && echo "✅ debate.js OK" || git checkout HEAD -- api/debate.js
  node -c api/evoluciona.js && echo "✅ evoluciona.js OK" || git checkout HEAD -- api/evoluciona.js
  node -c api/conocimiento.js && echo "✅ conocimiento.js OK" || git checkout HEAD -- api/conocimiento.js
  curl -s https://ia-unificada-bf.vercel.app/api/evoluciona
  echo ""
  echo "Durmiendo 10 min..."
  sleep 600
done
