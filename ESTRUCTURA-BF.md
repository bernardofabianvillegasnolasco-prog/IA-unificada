# BF - Estructura IA

## 1. DATOS
- api/memoria.js - memoria por IP
- perfilBF en index.html - nombre, gustos, ciudad Phoenix
- Upstash Redis - memoria que no se borra al redeploy

## 2. MODELOS Y ALGORITMOS
- api/cerebro.js - Groq + prompt RAE, solo Dalia
- Reglas: RAE, sin nombrar simbolos, sin plebe/mijo/fierro

## 3. INFRAESTRUCTURA
- Vercel - https://ia-unificada-bf.vercel.app
- Termux - dalia_termux.py / hablar_dalia.sh
- Upstash Redis - base de memoria

## 4. APLICACION Y SEGURIDAD
- index.html - chat limpio, sin botones, sin avatar
- voces/ - Dalia MP3s
- .gitignore - sin node_modules, sin .env, sin backup
- backup/ - tar.gz 150K

## 5. CICLO
Preparacion -> Cerebro -> Dalia habla -> Guarda memoria -> Recuerda
