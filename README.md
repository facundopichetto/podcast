# podcast

audios del agente de facundo, para escuchar caminando. web estatica en github pages:
https://facundopichetto.github.io/podcast/

- `episodios.json`: lista de episodios, voces y capitulos con timestamps (uno por voz).
- `audio/<ep>-<voz>.mp3`: cada episodio en cada voz (piper, offline).
- `audio/<ep>-<n>-<slug>.<voz>.mp3`: cada bloque solo (clave `archivo` del capitulo). la web lo reproduce
  aparte y salta al siguiente al terminar (nexttrack / previoustrack en la pantalla bloqueada).
- `guiones/`: el texto de cada episodio.

nuevo episodio: `python3 -m recetas.podcast nuevo guion.txt --id epN --titulo "..."` (en `~/.claudio/tools/agente`).
bloques de episodios ya publicados: `python3 -m recetas.podcast bloques [epN]`. prueba headless: `python3 -m recetas.prueba_podcast`.
