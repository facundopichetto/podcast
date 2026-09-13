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

### siglas en castellano rioplatense (facundo, 2026-09-13)

**nunca "u" ni "doble u" para v y w**: `VNC` es "ve ene ce", `PWA` "pe doble ve a", `SSH` "ese ese hache",
`API` "a pe i", `CDP` "ce de pe", `TTS` "te te ese". lo que se dice como palabra (`wifi`, `web`, `jira`,
`shopify`, `awtomic`, `fuzzer`) no se deletrea.

- **por que sonaba mal**: el diccionario tenia `vnc -> uve ene ce` (y `avr`, `nvme` igual), y espeak lee
  `uve` como `ˈuβe`, o sea "u be". corregido a `ve` (`bˈe`).
- `fonetizar()` aplica primero `pronunciacion.json` y despues **`deletrear_siglas()`**: una sigla en
  mayusculas (2 a 5 letras) que no esta en el diccionario y no tiene vocal o tiene v/w se deletrea sola
  con `LETRAS` de `recetas/podcast.py` (`MVP` -> "eme ve pe"). las que se dicen como palabra (`ONU`) quedan.
- `python3 -m recetas.podcast pronunciacion` marca cualquier respelling con `uve` o `doble u`.
- prueba: **`python3 -m recetas.prueba_podcast --pronunciacion`** (cero tokens).
- **escuchado con whisper** (`faster-whisper small`, 2026-09-13): con `uve` se oia "WNC"; con `ve` y la
  frase "entro por ve ene ce, pruebo la pe doble ve a, abro ese ese hache y reviso el te te ese" se oye
  "VNC, PWBA, SSH, TTS". **con espacios, no con comas**: con comas piper corta las letras y se oye peor.
  una sigla sola en un clip corto pierde la primera letra: no probar siglas aisladas, siempre en frase.

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

## el bloque de noticias (desde 2026-09-11, episodio nocturno)

facundo pidio que el podcast arranque con **noticias del dia**, no con el resumen del laburo: argentina
y buenos aires (economia, dolar, politica si es grande), 2 o 3 titulares internacionales, tecnologia e
ia pensado para alguien que corre claude code todo el dia, y un bloque de **musica en buenos aires**
(bandas de las proximas semanas, con fecha, lugar y **precio de la entrada en pesos**). siempre se dice
la fuente y la fecha de la info. el analisis de lo que se hizo va **al final** y corto.

**el material lo junta un script, no el modelo**: `python3 -m recetas.podcast_noticias` (cero tokens)
trae el dolar por api y los titulares por rss, con fuente y fecha en cada linea; `--json` para
procesarlo, `--seccion <x>` para una sola, `--n` para cuantos titulares por fuente. lo que el script
no cubre (precios de entradas, un numero puntual como el ipc del indec) se completa con `WebSearch`.

fuentes que contestan hoy (verificadas 2026-09-12):

| seccion | fuente |
|---|---|
| dolar | `dolarapi.com/v1/dolares` (oficial, blue, mep, ccl, mayorista, cripto, tarjeta) |
| argentina | ambito economia, la nacion economia, la nacion politica (rss) |
| mundo | democracy now, npr world (rss) |
| tecnologia | techcrunch, hacker news (`hnrss.org`, 250+ puntos) |
| musica | indie hoy (rss) |

- **pagina 12 y infobae no tienen rss vivo** (404 en todas las rutas viejas): no volver a agregarlos
  sin probarlos.
- la agenda de shows con precio no sale de ningun feed: va con `WebSearch` sobre indie hoy, time out y
  la ticketera (allaccess, enigma tickets, venti). **si el precio no esta publicado, se dice que no
  esta**, no se inventa.
- una fuente que no contesta no rompe el bloque: queda listada en `errores`.

## la voz del chat es la misma (2026-09-11)

desde que cada respuesta del chat tiene su `[▶]` (`recetas/audio_respuesta.py`), **daniela lee las dos
cosas con las mismas reglas**: `length_scale 1.2`, 0,45 s entre oraciones y `pronunciacion.json`
aplicado antes de renderizar. o sea que **una indicacion de facundo sobre como suena una palabra se
escribe una sola vez, aca**, y vale para el podcast y para el chat.

la unica diferencia es el empaquetado: el podcast va en mp3 por capitulos y el chat en **aac mono 32
kbps** (`.m4a`, ~250 kb por minuto), que es el formato mas chico que reproduce seguro el safari del
celu. el chat ademas limpia el texto antes de leerlo (sin codigo, rutas ni urls) y corta a 3 minutos.

verificar igual que siempre: `python3 -m recetas.podcast pronunciacion`. para escuchar como queda una
respuesta: `python3 -m recetas.audio_respuesta "el texto"`.

## el podcast siempre tiene guion preparado (facundo, 2026-09-12)

**al emitir se filtra, no se arma de cero.** facundo: "que el podcast tenga siempre una version
preescrita de lo proximo". o sea que cuando pide un episodio no se sale a juntar material: ya hay un
borrador vivo en **`~/.claudio/tools/podcast/PROXIMO.md`**, mas largo de lo necesario, y lo unico que
gasta modelo es **un solo pase** para redactar el guion final sobre ese borrador.

- **lo mantiene un script, no el modelo**: `podcast_proximo` en `SCRIPTS` de `daemon.py` (cada 2 h,
  cero tokens) llama a `python3 -m recetas.podcast_proximo actualizar`, que rehace el borrador entero
  con: `EN CURSO` / `PENDIENTE` / `ESPERANDO A FACUNDO` del `ESTADO.md` de cada tema, la cola de
  `ordenes.md` (corriendo y pendientes), `avisos.md`, las ultimas lineas de `log.md` y el material de
  `podcast_noticias.py` (cacheado 3 h, para no pegarle a 8 feeds cada vuelta).
- **cada capitulo lleva su tema**, para poder filtrar: el borrador es markdown con
  `## [tema] titulo` y el cuerpo abajo. temas: `noticias`, `server`, `tools`, `awtomic`, `fuzzer`,
  `juegos`, `plata`, `personal`, `cola`, `avisos`.
- **el flujo de "dame un podcast"**: `python3 -m recetas.podcast_proximo emitir [--temas server,tools]`.
  filtra el borrador (si no se pide nada, entra todo), arma el prompt con estas reglas y el material,
  **un pase de modelo** y despues `recetas.podcast nuevo` **sin `--conservar`** (episodio unico, como
  siempre: `--conservar` solo si facundo pide otro que no reemplace).
  `--auto` hace el pase de modelo el script mismo (`claude -p`, cuenta por `reparto_cuentas`); sin
  `--auto` no gasta nada, deja el prompt en `tmp/` para que lo redacte el modelo que ya esta corriendo.
- **nunca en segundo plano, nunca "ok" sin la web** (2026-09-12: los episodios de las 21:31 y 23:47
  quedaron cortados en el capitulo 1 porque la tarea lanzo el render en background y termino con rc=0).
  `emitir` y `nuevo` bloquean hasta pushear y ver el episodio en github pages (`verificar --vivo`) y
  salen 1 si no esta. renders cortados: `python3 -m recetas.podcast huerfanos`; se rehacen con
  `nuevo <guion> --id <id> --conservar --ts <hora original>`.
- **noticias entra siempre** aunque se filtre por tema (el episodio arranca con las noticias del dia),
  salvo `--sin-noticias`.

```
python3 -m recetas.podcast_proximo actualizar          # rehace el borrador (cero tokens)
python3 -m recetas.podcast_proximo ver --temas server  # que diria el episodio de server
python3 -m recetas.podcast_proximo emitir --temas server,tools --auto
```

probar sin gastar nada: **`python3 -m recetas.prueba_podcast_proximo`**.

## la web reproduce el episodio ENTERO (facundo, 2026-09-12)

en el celu se cortaba al terminar cada capitulo. desde `podcast-version 1.3` el reproductor suena
siempre `voces.daniela.archivo` (el mp3 entero) y los capitulos son marcas de tiempo; al terminar, si
`seguir` esta prendido, engancha el episodio siguiente **en el mismo `<audio>`** (desde la 1.5 hay uno
solo: el src cambia 0,35 s antes del final, sin que el elemento se pare) y la media session no se
suelta en pausa, asi el play de los airpods reanuda (`reanudar()` repone el archivo si safari lo solto). todo
episodio tiene que tener su entero: `python3 -m recetas.podcast enteros` lo arma si falta (corre solo
al final de `nuevo`). detalle y lo que falta probar en el celu, en `README.md`.

## cada episodio dice cuando salio (facundo, 2026-09-12)

**`ts` en `episodios.json`**: fecha y hora de emision, iso con offset de buenos aires
(`2026-09-12T21:35:00-03:00`). lo pone `recetas.podcast nuevo` al publicar; `guardar_json` rellena
el de los episodios viejos con la hora de su mp3 entero. la web (`podcast-version 1.4`) lo muestra
corto, `sáb 12/9 21:35`, en la fila de la lista, arriba del titulo del reproductor (`#ph`), en el
titulo de la pestaña y en el lock screen. lo chequea `python3 -m recetas.prueba_podcast_web [--vivo]`.

## el podcast automatico: 3 emisiones por dia, tres versiones cada una (facundo, 2026-09-13)

"podcast automatico. 3 por dia. a las 8am resumen del dia anterior. cada episodio del dia tiene version
10m, version 30m, version 1.5h". convive con los pedidos sueltos ("dame un podcast express"), que siguen
por `podcast_proximo emitir` / `podcast nuevo` como siempre.

| emision | hora (default) | cubre |
|---|---|---|
| `manana` | 08:00 | el dia anterior entero |
| `mediodia` | 13:30 | lo que va del dia, desde las 00:00 |
| `noche` | 21:30 | desde el mediodia |

- **las horas se cambian en `daemon.json` -> `podcast_auto.emisiones`** (tambien `activo`, `versiones`,
  `modelo`, `externas`, `larga_respeta_presupuesto`). la primera del orden siempre es la del dia anterior.
- **versiones**: `10m` (~1800 palabras), `30m` (~5400) y `90m`, la de 1.5 h (~16000). daniela lee ~185
  palabras por minuto. **las de 10 y 30 min hablan SOLO de lo que hicimos**: charla de cada pestaña
  (`logs/chat-<tema>.jsonl`), ordenes cerradas en la franja, `log.md` sin ruido, y el estado de cada tema,
  la cola y los avisos del guion vivo `PROXIMO.md`. **la de 1.5 h suma lo de afuera** despues de lo hecho:
  hoy noticias; para sumar una fuente, una funcion en `FUENTES_EXTERNAS` de `recetas/podcast_auto.py` y su
  nombre en `podcast_auto.externas`.
- **modelo solo en la redaccion**: un pase por version (opus); la de 1.5 h en partes de ~3200 palabras
  (la primera presenta, la ultima cierra). el material se junta sin modelo:
  `python3 -m recetas.podcast_auto material manana --version 10m` / `prompt ...` (cero tokens).
- **ids y web**: `ep-2026-09-13-manana-10m`, `-30m`, `-90m`, con `grupo` (`2026-09-13-manana`), `version`
  y `emision` en `episodios.json`, `ts` = hora de la emision. siempre `--conservar`: nunca pisan nada.
  la web muestra **una fila por emision** con selector `10 min / 30 min / 1.5 h` (se recuerda por emision y
  como preferida); el player tambien tiene el selector.
- **quien lo corre**: el script `podcast_auto` de `SCRIPTS` (cada 10 min, cero tokens) ve que franja esta
  abierta y lanza `python3 -m recetas.podcast_auto correr <emision>` en **su propia unidad de `systemd-run
  --user`** (no muere si el daemon se reinicia; salida en `logs/podcast-auto.log`). estado por version en
  `~/.claudio/podcast/auto.json`. si el server estuvo apagado toda la franja, esa emision no se recupera.
- **guard**: bloqueante hasta verse en github pages (`nuevo` sale 1 si no). el guion redactado queda en
  `guiones/` y un reintento lo reusa sin gastar modelo. render o push que fallan: se limpian los mp3
  parciales y se reintenta una vez en el momento; si vuelve a fallar, **un aviso al celu** y la version
  queda `fallo` (el tick la reintenta una vez mas a los 30 min, despues no). nada queda a medias en la web.
- **presupuesto**: la de 1.5 h es pesada y espera mientras `presupuesto.pesadas` del daemon sea false (se
  reintenta sola dentro de su franja). las cortas salen igual.
- **aviso al celu solo con la primera emision automatica** (y con las fallas).

### manitos (votos)

- manito arriba / abajo por episodio: en la lista se ven en la version de 1.5 h (o si ya votaste), en el
  player siempre. tocar la misma de nuevo saca el voto. se guarda en `voto:<id>` (localStorage).
- sale como comentario `podcast-voto <id> arriba|abajo|nada` al **issue 3 de `agente-buzon`** ("podcast
  votos"), con el mismo token del chat low data. **no va al issue 1**: el daemon lee ese como chat y lo
  contestaria. sin token o sin red queda en `votos_pend` y sale al volver a la app.
- el script `podcast_votos` (cada 10 min, etag: un 304 no gasta) lo baja a `~/.claudio/podcast/votos.json`,
  y el pase de redaccion recibe el resumen ("le gustaron / no le gustaron").

### escuchado encadenado

- el siguiente episodio sale en la **misma version** que venia sonando (salvo que hayas elegido otra para
  esa emision), y **una emision con cualquier version escuchada se salta entera**.
- a 90 s del final se relee `episodios.json`: si salio una emision nueva mientras escuchabas, engancha con ella.
- **regla del 50%**: si pasaste la mitad de un episodio y hay uno publicado despues, el viejo queda
  escuchado solo. no toca el que esta sonando, **no pisa un desmarcar a mano** (`desmarcado:<id>`, que se
  borra al marcar a mano) y se apaga con el boton de arriba de la lista (`auto50=no`).

probar: `python3 -m recetas.prueba_podcast_proximo` (franjas, material, pases, guard, tick, votos, cero
tokens) y `python3 -m recetas.prueba_podcast_web [--vivo]` (`automatico`: emisiones de mentira inyectadas).

pendiente, no implementado: **el semanal**.

## capitulos vivos (facundo, 2026-09-13)

"los capitulos empiezan a escribirse cuando escucho el anterior, pero se van actualizando cada tanto hasta que
escucho ese". va encima de las 3 emisiones por dia, sin duplicar nada: **el borrador vivo es el guion de la
proxima emision escrito de antemano**.

- **arranca** cuando facundo marco escuchada alguna version de la emision anterior (o si la anterior no se
  publico). sin escuchar la anterior no se gasta nada: a la hora sale como siempre, redactada en el momento.
- **se re-redacta** (script `podcast_auto` del daemon, tick cada 10 min, cero tokens el tick) cuando cambio lo
  hecho en su ventana (huella de charlas por pestaña + ordenes cerradas; el log y el estado no cuentan) y
  pasaron `vivo.refresco_min` (180) desde el ultimo, hasta `vivo.max_redacciones` (3). solo `vivo.versiones`
  (`10m` y `30m`: la de 1.5 h se redacta a la hora, es cara), solo si el presupuesto deja pesadas, y nunca a
  menos de 20 min de la hora. todo en `daemon.json -> podcast_auto.vivo`.
- **vive** en `~/.claudio/podcast/borradores/<id>.txt` (+ `.material`, `.json` con huella y redacciones): no se
  publica ni aparece en la web.
- **al publicar** el render va sobre el ultimo borrador. si lo hecho cambio y el borrador tiene mas de 30 min,
  un ultimo pase lo pone al dia; en un reintento se usa tal cual. publicado, el borrador se borra.
- **se congela** cuando facundo lo escucho: `auto.json -> congelados`, ni `correr --forzar` lo re-renderiza.
- **como sabe el server que escuchaste**: la web manda `podcast-escuchado <id> si|no` al issue 3 de
  `agente-buzon` (el de los votos) al marcar, desmarcar, al 90%, al terminar y por la regla del 50%; lo marcado
  antes de la 1.9 sale una vez al abrir. `recetas.podcast_votos` lo baja a `votos.json -> escuchados`. solo las
  emisiones automaticas. **sin el token del chat en la app no viaja**, y entonces no hay borradores (degrada a
  lo de antes, no rompe).
- ver: `python3 -m recetas.podcast_auto vivo` (que toca y por que), `borrador <emision> [--versiones]` a mano.
  prueba: `python3 -m recetas.prueba_podcast_proximo` (seccion capitulos vivos) y `prueba_podcast_web`.
