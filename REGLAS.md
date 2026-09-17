# reglas del podcast de claudio

salieron de facundo el 2026-09-11. si cambia algo, se edita aca y se ajusta `recetas/podcast.py`.

## los episodios anteriores quedan a la vista (facundo, 2026-09-17: cambio el default)

**un render nunca esconde ni borra lo anterior por default.** `recetas.podcast nuevo` suma el
episodio nuevo y deja los que ya estaban, visibles y con su mp3. `--conservar` sigue aceptada y hoy
**no hace nada**: es lo que pasa siempre.

**esconder es explicito, y ni asi se borra audio**:
- `recetas.podcast nuevo --reemplazar` marca `oculto: true` en los anteriores (mp3 y guion quedan).
- `recetas.podcast ocultar <id>...` / `mostrar [<id>...|--todos]` mueven la visibilidad despues, sin
  re-render; con `--publicar` ademas commitean y pushean.

**el guard**: `guardar_json` compara contra el `episodios.json` en disco y **corta antes de escribir**
si un episodio que hoy se ve desaparece o queda `oculto` sin permiso explicito. prueba:
`python3 -m recetas.prueba_podcast_ocultos` (cero tokens, cero audio).

**por que cambio** (2026-09-17): el render de `revision general de flaudio` corrio sin `--conservar`
con el default viejo y se llevo **20 episodios y 444 mp3** del repo; la web quedo mostrando uno solo.
se restauraron desde git (commit `5e2aeed`) con `oculto: false`. el default viejo era "un episodio
visible a la vez, `--conservar` para no reemplazar" (facundo, 2026-09-11 19:50).

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
  **un pase de modelo** y despues `recetas.podcast nuevo`, que desde el 2026-09-17 **suma** el episodio
  sin esconder los anteriores (para esconderlos hay que pedir `--reemplazar`).
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

## velocidad y airpods (facundo, 2026-09-13, `podcast-version 1.10`)

- boton `#vel` al lado del tiempo: rota **`1x` / `1.25x` / `1.5x`**, se guarda en `localStorage.vel` y se
  repone al cargar cada mp3 (safari vuelve a 1x con un src nuevo). un valor que no esta en `VELS` vuelve a 1x.
- **doble toque en los airpods = capitulo siguiente** (`nexttrack`), triple = anterior (`previoustrack`: con
  mas de 3 s del capitulo sonando vuelve a su inicio, si no al de antes). despues del ultimo capitulo pasa al
  episodio siguiente.
- **`seekforward` / `seekbackward` van en `null` a proposito**: en ios le ganan a `nexttrack`, el doble toque
  adelantaba 30 s y el lock screen mostraba +30/-10. los saltos de 10 y 30 s quedan en los botones de la app.
- lo chequea `prueba_podcast_web [--vivo]` (funcion `velocidad`, va ultima porque recarga la pagina).

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
- **aviso al celu con cada emision publicada** (facundo, 2026-09-13): **una** linea en `avisos.md` con el
  titulo de la emision, la duracion real de cada version (y por que falta la que no salio: presupuesto o
  falla) y el link a la web. la version que se publica mas tarde (la de 1.5 h cuando se libera el
  presupuesto, un reintento) avisa aparte, una sola vez. las fallas siguen avisando como antes.

### el cierre del dia: "lo que decidiste hoy" (facundo, 2026-09-13)

"capitulo de cierre 'lo que decidiste hoy' en la emision de la noche: lista de los dales, ordenes y
decisiones de facundo del dia, redactado para que el chequee que entendi bien".

- **solo en la ultima emision del dia** (hoy `noche`, 21:30), en las tres versiones, y **ultimo capitulo de
  todo**: va despues de `# lo que te espera` y, en la de 1.5 h, despues de las fuentes externas.
- **que entra**, del dia entero (00:00 hasta la hora de la emision) y de **todas las pestañas**, sacado de
  `logs/chat-<tema>.jsonl` sin modelo (`cap_decisiones` en `recetas/podcast_auto.py`):
  las elecciones `A` / `B` / `C`, los `dale` (aunque sean una palabra), las reglas nuevas ("nunca", "acordate",
  "siempre", "prioridad") y los pedidos. **cada linea lleva lo que dijo facundo y lo que claudio entendio**,
  para que el chequee si se entendio bien. abajo, lo que ya cerro (`ordenes.md`) y lo que sigue en la cola.
- **que no entra**: las preguntas (no son decisiones) y los comandos sueltos (`reinicia`, `status`).
- el capitulo se redacta **en segunda persona** ("me dijiste ..., lo entendi asi ...") y si algo quedo
  ambiguo o no se hizo, lo dice y le pide que corrija. si en el dia no decidio nada, el episodio cierra
  como siempre (el capitulo no aparece).
- ver el material sin gastar nada: `python3 -m recetas.podcast_auto decisiones [--fecha 2026-09-13]`.
- el tema `decisiones` es de servicio: no se publica como tema del episodio en `episodios.json`.

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

## retencion: el audio de mas de 7 dias se borra, el guion no (facundo, 2026-09-13)

sugerencia aceptada de facundo: "las de 1.5 h pesan, borrar audios de mas de 7 dias salvo votados
arriba".

- **que se borra**: solo los mp3 (el entero y los de cada capitulo) de los episodios con mas de **7
  dias** desde su `ts`. **el guion (`guiones/`) y la metadata de `episodios.json`** (titulo, fecha,
  temas, palabras, duracion, capitulos) **quedan siempre**: el episodio sigue en la lista y se puede
  releer o volver a renderizar.
- **que se salva**: lo votado **manito arriba**. el voto es por id de version
  (`ep-2026-09-13-manana-90m`), asi que una manito en la de 1.5 h no salva la de 10 min de esa
  emision, que es justo donde esta el ahorro.
- **en la web** (`podcast-version 1.11`): la fila queda apagada, dice "audio borrado, queda el
  guion", no abre el player y la reproduccion continua la saltea. si facundo ya lo tenia **bajado**
  en el celu, ahi sigue sonando: esa copia vive en el cache del telefono, no en el server.
- **quien lo corre**: el script `podcast_retencion` del daemon, cada 6 h, cero tokens; deja una
  linea en `log.md` con los episodios y los MB liberados solo cuando borro algo. a mano:
  `python3 -m recetas.podcast_retencion ver` (que se borraria) y `limpiar [--dias N] [--seco]`.
- **ojo**: esto libera el checkout, no el historial de git (`.git` del repo del podcast se queda con
  los mp3 viejos igual). achicar eso es un rewrite aparte.

## podcast vivo continuo (facundo, 2026-09-13 22:15): reemplaza a las 3 emisiones por dia

"un solo podcast vivo que se actualiza cada 30 min; cuando lo marco escuchado, el siguiente se genera ya, desde
la ultima actualizacion que escuche, aunque dure un minuto". **cuantos episodios salen por dia no es fijo: lo
define cuanto escucha facundo** (correccion 22:14). siempre hay uno listo para cuando termina el actual.

- **modo**: `daemon.json -> podcast_auto.modo` = `"vivo"` (default) o `"emisiones"` (las 3 por dia de antes, que
  siguen documentadas arriba). config del vivo en `podcast_auto.continuo`, la larga en `podcast_auto.larga`.
- **el vivo**: un episodio `ep-<fecha>-vivo-<hhmm>` (grupo propio, version `vivo`, `ts` = cuando arranco). cada
  `continuo.refresco_min` (**30**) el tick del daemon lanza una vuelta en su unidad de systemd: junta lo que paso
  **desde la ultima actualizacion** (charlas por pestaña, ordenes cerradas, log sin las lineas del propio podcast),
  **un pase de opus** escribe solo los capitulos nuevos, se pegan al final del guion, se re-renderiza y se
  republica **con el mismo id**. la hora de cada actualizacion queda en `~/.claudio/podcast/auto.json ->
  continuo.actual.actualizaciones` (`hasta`, `publicado_ts`, tipo y palabras).
- **media hora sin movimiento** (ni chats, ni ordenes cerradas, ni log relevante): no se saltea ni se rellena. el
  tramo es un **analisis breve** del estado (pendientes, lo que espera a facundo, la cola, del guion vivo
  `PROXIMO.md`) y **cierra con UNA pregunta concreta** en un capitulo `# una pregunta para vos` (correccion 22:16).
  el modelo la repite en una linea `PREGUNTA: ...` que no se lee: el script la saca del guion y la guarda en
  `tools/podcast/PROXIMO.md`, capitulo `[preguntas]`, como `- pregunta: ...` (quedan las ultimas 5;
  `podcast_proximo actualizar` la conserva). asi la respuesta de facundo por chat entra como material del proximo.
  **solo si no hay nada que analizar ni que preguntar** el modelo contesta `SALTEAR` y esa vuelta no publica
  (excepcion, no regla). si el estado es el mismo que ya se analizo, la vuelta no vuelve a pagar un pase.
- **escuchado** (`podcast-escuchado` -> `votos.json -> escuchados`, con la hora del comentario): el vivo se
  **congela** (`auto.json -> congelados`) y en el mismo tick se lanza el siguiente, que cubre **desde la ultima
  actualizacion publicada antes de que lo marcaras** hasta ahora. lo que se publico despues de marcarlo se
  vuelve a contar en el nuevo. no espera la media hora.
- **presupuesto**: si `presupuesto.pesadas` es false, las actualizaciones de 30 min **se saltean** y lo que paso se
  acumula para la vuelta siguiente (la ventana siempre arranca en la ultima actualizacion publicada). el nuevo tras
  escuchar no espera (es el que estas esperando), salvo `continuo.nuevo_respeta_presupuesto: true`.
- **la larga**: la de 1.5 h con noticias sale **una vez por dia**, `larga.hora` (08:00), con lo del dia anterior.
  se apaga con `larga.activo: false`.
- **cierre del dia**: la primera actualizacion desde `continuo.cierre` (**23:30**) suma `# lo que decidiste hoy`
  (mismo capitulo de arriba, del dia entero) aunque no haya pasado la media hora; no se puede saltear. una vez por dia.
- **tope**: un vivo que pasa `continuo.max_palabras_episodio` (6000, ~32 min) sigue en uno nuevo; el anterior queda
  en la web sin escuchar y la reproduccion continua engancha.
- **guard**: publicar que falla se reintenta una vez en el momento; si vuelve a fallar, el guion y el audio vuelven
  a lo ultimo publicado (`git checkout` del mp3 y `episodios.json`), la actualizacion no cuenta y lo que no salio
  entra en la vuelta siguiente. dos vueltas seguidas fallando: **un** aviso al celu.
- **ojo**: cada actualizacion commitea el mp3 entero de nuevo, asi que `.git` del repo del podcast crece rapido
  (ver el pendiente de achicar el historial).

```
python3 -m recetas.podcast_auto continuo --seco      # que toca en el vivo y por que (cero tokens)
python3 -m recetas.podcast_auto continuo [--forzar] [--sin-push]
python3 -m recetas.podcast_auto estado               # incluye plan_vivo y auto.json -> continuo
```

prueba: `python3 -m recetas.prueba_podcast_proximo` (seccion "podcast vivo continuo", cero tokens).

### merge en el episodio que no empezaste (facundo, 2026-09-13 22:45, pisa lo de "se pega al final")

- **la actualizacion de media hora NUNCA crea un episodio nuevo si hay uno que facundo todavia no empezo**: se
  mergea adentro de ese. el modelo marca cada capitulo nuevo `# [importante] ...` o `# [menor] ...`;
  `mergear()` pone los importantes **al principio** (despues de `# de que va`), los menores **al medio**, y
  `# lo que decidiste hoy` siempre al final. las marcas no quedan en el guion.
- el episodio toma la **hora del merge**: `# actualizado hoy a las HH:MM` al arrancar (dicha), `actualizado` en
  `episodios.json`, el titulo (`vivo · dom 13/9 desde HH:MM · actualizado HH:MM`), la lista de la web y el widget
  del board.
- **episodio nuevo solo cuando lo marcaste escuchado o lo empezaste**. la web (**1.16**) manda
  `podcast-empezado <id>` una sola vez, pasados 20 s sonando; `podcast_votos` lo guarda en
  `votos.json -> empezados`. un vivo empezado se congela en el tick siguiente y el nuevo arranca en el momento,
  desde la ultima actualizacion publicada antes de que lo empezaras.
- sin tope de palabras por default (`continuo.max_palabras_episodio: 0`): mientras no lo empieces, todo va ahi.
- **unificar** episodios ya publicados en uno solo (receta, cero tokens salvo el render):
  `python3 -m recetas.podcast_auto unificar <id base> <id mas nuevo>... --hasta "YYYY-MM-DD HH:MM"`. la base
  queda al medio, lo mas nuevo entra como importante al principio (sin su intro), los de origen quedan `oculto`
  en el mismo commit, el vivo sigue mergeando ahi desde `--hasta` y sale **un** aviso al celu con link y duracion.
  si no publica, los de origen vuelven a verse y no queda guion a medias.
- `podcast.publicar`: si github rechaza el push (server y cloud publican a la vez) trae lo de afuera con
  `pull --rebase`; si choca solo `episodios.json`, une los episodios por id (gana el recien renderizado, se respeta
  el `oculto` del otro nodo). tambien sube commits que quedaron sin pushear.

## ningun numero de tarea ni de ticket (facundo, 2026-09-14)

"en ningun audio pero menos podcast me pongas numeros de proceso o de ticket, referite por algo que los
identifique". vale para el guion, los titulos de capitulo y cualquier audio del chat.

- "la 1157" -> "la de notificaciones" (el tag `{nombre}` de esa linea de `ordenes.md`); si la orden es vieja
  y no tiene tag, se la describe en pocas palabras ("la de mudanza por defecto a la vm").
- "CX-5048" -> "el ticket de ponzi, flow to tag customers": merchant (el corchete del titulo) y asunto corto,
  del indice de jira (`~/w/awtomic/qa/jira-index.json`, `jira_mine.json`) o del draft de qa.
- un numero entre parentesis o una lista de numeros ("(1193)", "(4944, 4987)") se caen: no aportan nada leidos.
- lo que SI es un numero de verdad queda igual: años, plata (`$1200`), cantidades con unidad ("1800 palabras",
  "480 filas"), horas, codigos http ("dio 409"), aproximados ("~113 subs").

lo hace `recetas/sin_numeros.py` (cero tokens) en tres lugares, el ultimo es el que manda:
`podcast_proximo.armar` (el guion vivo `PROXIMO.md` ya nace sin numeros), `podcast_auto.material` y
`material_tramo` (el modelo nunca ve un numero que pueda repetir), y `podcast.nuevo`, que limpia el guion
antes del tts y **corta el render** si quedo alguno (`sin_numeros.sobran`). los prompts tambien lo dicen.

a mano: `python3 -m recetas.sin_numeros limpiar <archivo>` o `ver <archivo>` (rc 1 si sobra alguno).
prueba: `python3 -m recetas.prueba_podcast --sin-numeros` y `python3 -m recetas.sin_numeros --probar`.

## media hora, sin noticias y sin retos (facundo, 2026-09-14)
- se saca el formato de 1.5 h por ahora, y con eso la larga de las 08:00 (`podcast_auto.larga.activo: false`).
- nunca noticias salvo algo muy grave (`podcast_auto.externas: []`, `podcast_proximo.SIEMPRE = []`). manda sobre
  "el bloque de noticias" de arriba.
- nunca retar a facundo por pendientes: lo que falta se cuenta como lo que viene, sin reproches.
