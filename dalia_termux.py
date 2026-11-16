import asyncio, sys
import edge_tts
async def dalia(texto, archivo):
    malas = ['asterisco','asteriscos','guion','guiones','slash','diagonal','barra','parentesis','paréntesis','corchete','llave','comillas','numeral','almohadilla','arroba','porcentaje','ampersand']
    palabras = texto.split(' ')
    palabras = [w for w in palabras if w.lower() not in malas]
    texto = ' '.join(palabras)
    texto = texto.replace('*',' ').replace('#',' ').replace('_',' ').strip()
    tts = edge_tts.Communicate(texto, "es-MX-DaliaNeural", rate="+15%")
    await tts.save(archivo)
    print(f"Dalia hablo -> {archivo}")
texto = ' '.join(sys.argv[1:]) if len(sys.argv)>1 else "Que onda, soy tu BF, Dalia, ya solo hablo yo en Termux"
asyncio.run(dalia(texto, "dalia-termux.mp3"))
