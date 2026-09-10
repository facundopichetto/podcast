# podcast

audios del agente de facundo, para escuchar caminando. web estatica en github pages:
https://facundopichetto.github.io/podcast/

- `episodios.json`: lista de episodios, voces y capitulos con timestamps (uno por voz).
- `audio/<ep>-<voz>.mp3`: cada episodio en cada voz (piper, offline).
- `guiones/`: el texto de cada episodio.

nuevo episodio: `python3 -m recetas.podcast nuevo guion.txt --id epN --titulo "..."` (en `~/.claudio/tools/agente`).
