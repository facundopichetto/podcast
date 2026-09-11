# reglas del podcast de claudio

salieron de facundo el 2026-09-11. si cambia algo, se edita aca y se ajusta `recetas/podcast.py`.

## un solo episodio, salvo que facundo pida otro

**el default es un episodio visible a la vez: el nuevo reemplaza al anterior.** `recetas.podcast
nuevo` borra los mp3 del anterior y lo saca de `episodios.json`. el respaldo de lo borrado es
`backup-<fecha>/`, que git ignora y no se publica.

**la excepcion es `--conservar`** (facundo, 2026-09-11 19:50: "haceme otro episodio que no reemplace
este, mientras escucho el que hay"): deja el anterior con su mp3 intacto y suma el nuevo. se usa
**solo cuando facundo pide otro que no reemplace**; si no lo pide, va el default. `--conservar` no
toca ni el audio ni la entrada del episodio viejo.

la web: con un solo episodio no muestra lista, abre el reproductor directo y esconde el boton
`‹ episodios`. **con mas de uno la lista vuelve sola** y aparece el boton (verificado con
`episodios.json` de dos episodios, `cargar()` de `index.html`: `unico = eps.length === 1`).

## una voz, sin selector

**voz fija `daniela` (es-AR).** se saco el `<select>` de voces de la web y todo lo que dependia de
el (el salto de voz conservando la posicion). `--voces` sigue existiendo en el cli pero es opcional
y solo para probar otra; por default renderiza daniela sola, asi que un episodio tarda un cuarto de
lo que tardaba.

## mas aire

`length_scale 1.2` (era 1.1) y **0,45 s de silencio real entre oraciones**.

ojo con esto, porque cuesta media hora si se olvida: **en piper 1.8 el `--sentence_silence` del CLI
no hace nada.** `__main__.py` mete el silencio solo entre chunks de una misma linea (`if i > 0`) y
`PiperVoice.synthesize` devuelve un chunk por llamada, asi que el contador nunca pasa de cero.
medido: el mismo texto con `--sentence_silence 0.0` y con `3.0` dura igual (0,86 s las dos veces).

por eso el render no va por el CLI sino por **`~/.claudio/tools/tts/render.py`** (python del venv de
piper, cero modelo): corta el texto en oraciones, carga el modelo una sola vez, y escribe el silencio
a mano entre una y otra. verificado: `uno. dos. tres.` da 1,49 s con silencio 0, 2,40 s con 0,45
(son los 0,90 s de los dos cortes) y 3,40 s con 1,0.

no hay forma de separar **palabras** sueltas en piper: el unico control es `length_scale` y el
silencio por oracion. si hace falta mas aire, subir `LENGTH` en `recetas/podcast.py`.

## las palabras en ingles se leen en ingles

el guion pasa por `pronunciacion.json` antes de renderizar (`fonetizar()`): un diccionario
`palabra -> como se escribe para que espeak la diga parecido al ingles`. hoy 52 palabras. los
titulos de bloque **no** se fonetizan, porque se ven en la web.

- `merchant -> mérchant`, `shopify -> shópifai`, `spotify -> spótifai`, `theme -> tim`,
  `widget -> uíyet`, `json -> yéison`, `github -> guithab`, `daemon -> dímon`.
- **`sh` suena `ʃ` solo al empezar palabra**: por eso `subscription -> sabscríp shon`, separado.
  adentro de una palabra espeak lo lee `s`.
- solo entran palabras que espeak lee mal en espanol. `token`, `tmux`, `chat`, `script`, `log`,
  `push`, `branch` y `landing` ya salen bien y se sacaron del diccionario a proposito.
- se verifica con **`python3 -m recetas.podcast pronunciacion`** (cero tokens, cero audio): imprime,
  por palabra, los fonemas que piper va a recibir sin diccionario, con diccionario y los del ingles
  real (`en-us`), y avisa si alguno queda fuera del inventario del modelo o si el diccionario no
  cambio nada. hoy da **52 de 52 ok**. `python3 -m recetas.podcast fonetizar <guion>` muestra el
  guion ya reescrito, para leerlo antes de gastar el render.

### hasta donde llega esta aproximacion

**lo que esta verificado es la cadena de fonemas, no como suena.** una tarea del agente no puede
escuchar, asi que lo que se midio es exacto pero indirecto: que `shopify` pasa de `ʃopˈifi`
("shopífi", acento espanol) a `ʃˈopifaɪ`, contra el ingles `ʃˈɑːpᵻfˌaɪ`. la silaba tonica y el
diptongo final quedan bien; la vocal abierta inglesa (`ɑː`, `ɜː`, `ə`) no existe en el modelo
es-AR, asi que queda **ingles con acento argentino**, que es como lo dice facundo igual.

**falta una oreja**: `audio/prueba-pronunciacion.mp3` (9 s) dice las 3 palabras sin diccionario y
con diccionario, una atras de la otra. si no alcanza, la salida no es un respelling mejor:

- piper 1.8 **no acepta fonemas a mano** ni cambio de idioma en el medio del texto (probado:
  `[[m3:tS@nt]]`, `(en)...(es)` y `<say-as>` los lee como letras sueltas).
- el camino real seria un tts multilingue que fonemice cada palabra en su idioma (kokoro, xtts,
  o las voces de macos por `say`), o mezclar fonemas de `en-us` y `es-419` llamando al modelo
  onnx directo, salteando el CLI. las dos cosas son un proyecto aparte, no un parametro.

## como se hace un episodio

```
python3 -m recetas.podcast fonetizar guiones/<guion>.txt          # revisar el texto
python3 -m recetas.podcast nuevo guiones/<guion>.txt --id ep-<fecha> \
    --titulo "..." --temas awtomic,server,tools [--sin-push]
```

el guion se escribe con bloques `# titulo`: cada uno queda como capitulo con su propio mp3, asi la
web puede reproducir uno solo y saltar al siguiente con los botones del celu bloqueado.
