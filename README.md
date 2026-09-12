# podcast

audios del agente de facundo, para escuchar caminando. web estatica en github pages:
https://facundopichetto.github.io/podcast/

**las reglas (un solo episodio, voz fija daniela, aire entre oraciones, ingles fonetizado) estan en
`REGLAS.md`.** aca queda solo que es cada archivo.

- `episodios.json`: los episodios publicados, con sus capitulos y timestamps. **por default hay uno
  solo** (el nuevo reemplaza al anterior); con `nuevo --conservar` queda tambien el anterior, y ahi
  la web muestra la lista sola.
- `audio/<ep>-daniela.mp3`: el episodio entero. **es lo unico que reproduce la web** (facundo,
  2026-09-12: en el celu se cortaba al terminar cada capitulo). `python3 -m recetas.podcast enteros`
  es el guard: si a un episodio le falta, lo arma concatenando los bloques y recalcula los `t`; corre
  solo al final de `nuevo`.
- `audio/<ep>-<n>-<slug>.daniela.mp3`: cada bloque solo (clave `archivo` del capitulo). **la web ya no
  los reproduce**: los capitulos son marcas de tiempo sobre el entero. quedan por si se quiere
  publicar un bloque suelto.
- `audio/prueba-pronunciacion.mp3`: 9 s con `merchant`, `shopify` y `spotify` sin diccionario y con
  diccionario, para decidir si la fonetizacion alcanza.
- `guiones/`: el texto de cada episodio, sin fonetizar.
- `pronunciacion.json`: palabra en ingles -> como se escribe para que piper la diga parecido.
- `backup-<fecha>/`: lo que se borro al reemplazar un episodio. git lo ignora, no se publica.

desde `~/.claudio/tools/agente`:

```
python3 -m recetas.podcast pronunciacion            # verifica el diccionario por fonemas (cero tokens)
python3 -m recetas.podcast fonetizar <guion>        # el guion ya reescrito, para leerlo antes
python3 -m recetas.podcast nuevo <guion> --id ep-<fecha> --titulo "..." --temas a,b
python3 -m recetas.podcast nuevo <guion> --id ep-<fecha>-b --titulo "..." --conservar   # sin borrar el anterior
python3 -m recetas.prueba_podcast_web [--vivo]      # chrome headless, local o contra pages
```

## el reproductor en el celu (facundo, 2026-09-12)

qué hace ahora `index.html`:

- **siempre suena el mp3 entero**; tocar un capítulo hace seek, no cambia de archivo. se fue el modo
  "bloque" (el botón ▶ de cada fila), que era lo que cortaba la escucha cada 1 o 2 minutos.
- **al terminar un episodio arranca el siguiente solo** (con `seguir`, que viene prendido). el
  siguiente se precarga en un **segundo `<audio>`** que se "despierta" con el primer play del usuario:
  ios no deja arrancar audio con la pantalla bloqueada en un elemento que nunca tocó un gesto. el que
  suena siempre tiene `id="audio"` (los ids se intercambian al pasar).
- **al pausar no se suelta nada**: sigue el `src`, la metadata y el `setPositionState`, así el play de
  los airpods reanuda ese mismo elemento en vez de perder el player del lock screen.

qué se probó **de verdad**: `python3 -m recetas.prueba_podcast_seguido` (chrome headless, dos
episodios de mentira): entero, seek por capítulo, pausa sin soltar la sesión, precarga del siguiente y
pase automático al terminar.

qué **no** se pudo probar: la reproducción real. el chrome del server no tiene pipeline de audio (ni
pide el mp3, `readyState` queda en 0), así que el fin del episodio se simula despachando `ended`. y
**si ios deja arrancar el segundo elemento con la pantalla bloqueada solo se sabe en el celu**: hay
que escuchar un episodio hasta el final con el teléfono bloqueado y ver si engancha el siguiente. si
no engancha, el plan B es un solo archivo con todos los episodios pegados.
