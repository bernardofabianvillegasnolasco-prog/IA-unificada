#!/data/data/com.termux/files/usr/bin/bash
FECHA=$(date +%F_%H-%M)
ARCHIVO=IA-BLINDAJE-$FECHA.tar.gz
tar --exclude='IA/node_modules' -czf ~/storage/downloads/backup/$ARCHIVO -C ~ IA
rclone copy ~/storage/downloads/backup/$ARCHIVO gdrive:BF-Backups/ --log-file ~/IA/blindaje.log
rclone copy ~/storage/downloads/backup/$ARCHIVO mega2:BF-Backups/ --log-file ~/IA/blindaje.log
echo "[$FECHA] x9 MULTI-NUBE Subido $ARCHIVO gdrive+mega2" >> ~/IA/blindaje.log
find ~/storage/downloads/backup/ -name "IA-BLINDAJE-*.tar.gz" -mtime +3 -delete
