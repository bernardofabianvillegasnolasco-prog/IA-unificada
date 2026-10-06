#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
crond
cd ~/IA
npm start > ~/IA/x9.log 2>&1 &
echo "BF x9 levantado $(date)" >> ~/IA/x9.log
