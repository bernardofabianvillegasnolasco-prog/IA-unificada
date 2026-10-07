#!/bin/bash
echo "🤖 BOOT BF AUTOCORRECTOR EVOLUTIVO v33 - Iniciado"
while true; do
  echo "[$(date)] 🧠 Boot revisando..."
  # Verificar si hay errores de sintaxis
  node -c api/debate.js 2>/tmp/error.log || {
    echo "❌ Error sintaxis debate.js, restaurando backup..."
    git checkout HEAD -- api/debate.js
  }
  node -c api/conocimiento.js 2>/tmp/error.log || {
    echo "❌ Error conocimiento.js, restaurando..."
    git checkout HEAD -- api/conocimiento.js
  }
  # Evolución: hacer push si hay cambios en cache
  curl -s https://ia-unificada-bf.vercel.app/api/evoluciona | head -c 200
  echo ""
  echo "✅ Boot ciclo completado, durmiendo 10 min..."
  sleep 600
done
