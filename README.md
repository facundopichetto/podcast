# podcast

audios del agente de facundo, para escuchar caminando. web estatica en github pages:
https://facundopichetto.github.io/podcast/

**las reglas (un solo episodio, voz fija daniela, aire entre oraciones, ingles fonetizado) estan en
`REGLAS.md`.** aca queda solo que es cada archivo.

- `episodios.json`: los episodios publicados, con sus capitulos y timestamps. **por default hay uno
  solo** (el nuevo reemplaza al anterior); con `nuevo --conservar` queda tambien el anterior, y ahi
  la web muestra la lista sola.
- `audio/<ep>-daniela.mp3`: el episodio entero.
- `audio/<ep>-<n>-<slug>.daniela.mp3`: cada bloque solo (clave `archivo` del capitulo). la web lo
  reproduce aparte y salta al siguiente al terminar (nexttrack / previoustrack en la pantalla bloqueada).
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
