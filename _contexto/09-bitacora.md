# 09 · Bitácora

Registro de lo que se ha hecho en Entrelíneas, de lo más reciente a lo más antiguo. Al terminar cada sesión de trabajo se añade una entrada arriba.

## Plantilla

```
## AAAA-MM-DD · Título corto

- Tipo: contenido | gamificación | diseño | front | lógica | función nueva | esquema | administración | documentación
- Versión de la app: de x.y.z a x.y.z (o «sin cambio»)
- Qué se hizo:
- Archivos que cambiaron:
- Qué hizo Diego a mano (Supabase, GitHub, cargar paquete):
- Cómo se probó:
- Pendiente o por vigilar:
```

---

## 2026-11-11 · Versión 1.2.0: cuentas desde la app, grupos e instalación

- Tipo: función nueva, con esquema, lógica, front y diseño
- Versión de la app: de 1.1.0 a 1.2.0 (en la carpeta; sin publicar todavía)
- Contexto: desde este día se trabaja en la carpeta `Documents/GitHub/App-comprension-lectora/lectura-admision-udea`, conectada a GitHub Desktop; Diego hace los commits desde ahí. Antes de empezar se completó el repositorio con lo que no se había subido de la 1.1.0 (`04_razonamiento_logico.sql`, el `02_funciones.sql` de la 1.1.0, `respaldo/` y esta carpeta) y se agregó un `.gitignore`.
- Qué se hizo: el tutor crea cuentas desde la app (Personas): nombre, correo y grupo; contraseña temporal fácil de dictar que se muestra una vez con un mensaje para WhatsApp o para copiar. Primer ingreso: la persona elige su contraseña y ve los pasos para instalar la app. Cambio de contraseña desde el perfil; contraseña nueva y desactivar/activar desde Personas. Se entra con el correo. Instalación: franja verde arriba en el celular mientras no esté instalada, pantalla `#/instalar` con pasos según el teléfono, botón de instalar en Android, service worker sin caché, íconos PNG, y Personas muestra quién la instaló. Grupos: el tutor los crea y arma; los miembros ven la semana del grupo (XP de la semana, días, racha, retos; tabla ordenada que se reinicia cada lunes) y la actividad reciente; puntajes de simulacro solo si el grupo lo permite. Tutor: explorar el banco con la clave y modo práctica con su cuenta (no aparece en panel, alertas ni grupos; puede borrar su práctica). Seguridad: `rachas` ya no deja consultar la racha de cualquiera.
- Archivos que cambiaron: nuevos `supabase/05_usuarios_y_grupos.sql`, `js/vistas-comunidad.js`, `sw.js`, `iconos/` (4 PNG), `tools/pruebas/recorrido_comunidad.py`. Modificados `supabase/02_funciones.sql`, `js/nucleo.js`, `js/app.js`, `js/api-supabase.js`, `js/api-demo.js`, `js/vistas-estudiante.js`, `js/vistas-tutor.js`, `js/config.js` (`VERSION`), `css/app.css`, `index.html`, `manifest.webmanifest`, `version.json`, `tools/construir_demo.py`, `tools/pruebas/prueba_sql.py`, `tools/pruebas/imitacion_supabase.sql`, `tools/pruebas/comparar_formas.py`, `tools/pruebas/LEEME.md`, `demo.html`, `README.md` y `_contexto/` (00, 01, 03, 04, 06, 07, 08 y esta bitácora). No cambiaron `01`, `03`, `04` de `supabase/`, `css/tema.css` ni el contenido.
- Qué hizo Diego a mano: nada todavía. Le toca: (1) en Supabase, `05_usuarios_y_grupos.sql` y después `02_funciones.sql`; (2) commit y push desde GitHub Desktop; (3) la prueba con una cuenta de prueba (`README`, «Pasar de la 1.1.0 a la 1.2.0»).
- Cómo se probó: (a) SQL en Postgres 16 local con la imitación de Supabase ampliada (columnas de `auth.users`, `auth.identities`, pgcrypto en `extensions`): base desde cero con 01, 04, 05, 02, 03; migración repetida sin perder datos; 53 comprobaciones nuevas (cuenta confirmada con los campos que pide Supabase, contraseña bcrypt verificada, usuarios que no chocan, validaciones, primer cambio de contraseña, restablecer, desactivar con `banned_until`, grupos, privacidad entre compañeros por tablas y por funciones, puntajes solo si el grupo lo permite, práctica del tutor fuera del panel y de las alertas, borrar práctica, eliminar grupo sin tocar progreso) además de las anteriores: 124 en total, ninguna falla. (b) Demo con Playwright y Chrome: los dos recorridos anteriores y uno nuevo (`recorrido_comunidad.py`, 47 comprobaciones) en celular Android, iPhone y escritorio; sin errores de JavaScript. Se miraron las capturas y se corrigieron los pasos de instalación (cada fragmento caía en una celda distinta), el formulario de dos columnas en el celular, la navegación marcada en el banco y en Grupos, y las insignias seguidas en la actividad. (c) `comparar_formas.py`: demo y SQL responden con las mismas claves en las 20 llamadas comparadas, salvo las dos diferencias conocidas.
- Lo que no se probó: crear una cuenta y entrar con ella contra el Supabase real (es el paso 3 de Diego); la instalación en un iPhone y un Android físicos; el envío por WhatsApp.
- Pendiente o por vigilar: observaciones de la 1.2.0 en `08`, empezando por confirmar que `crear_usuario` funciona en Supabase.

## 2026-10-04 · Versión 1.1.0: llega Razonamiento Lógico

- Tipo: función nueva, con esquema, lógica, front, diseño y contenido
- Versión de la app: de 1.0.0 a 1.1.0 (en la carpeta; sin publicar todavía)
- Qué se hizo: se agregó el segundo componente del examen. Lectura y Lógica viven en la misma app, se navegan por separado (Lectura · Lógica · Simulacro · Mensajes · Perfil) y nunca se mezclan en una sesión; XP, rango, racha, tiempo y mensajes son comunes. Lógica tiene cuatro niveles (Deducción, Proporciones, Patrones, Geometría), retos Riff, Solo y Jam, simulacros de 20, 40 y 40 preguntas y 16 insignias. Para que la estudiante entienda sus errores y aprenda los procedimientos: cada opción incorrecta lleva el tipo de error que la produce y una nota; la solución va en pasos; hay pista antes de responder, 26 fichas de técnica (caja de herramientas), cuaderno de errores con reto de repaso, y un diagnóstico de simulacro por tipo de error, por técnica y por tiempo. La app ahora admite figuras en SVG y cuadros. Se escribieron 109 preguntas (27, 36, 20 y 26 por nivel; 29 fáciles, 52 medias, 28 difíciles) y 4 situaciones. De paso se corrigieron dos fallas de la 1.0.0: la navegación del celular quedaba arriba en vez de abajo, y el demo solo traía `paquete-001` y dejaba un `">` suelto.
- Archivos que cambiaron: nuevos `supabase/04_razonamiento_logico.sql`, `supabase/respaldo/volver_a_1.0.0.sql`, `js/vistas-logica.js`, `content/logica-base.json`, `content/logica-001.json`, `content/logica-002.json`, `content/plantilla-logica.json`, `tools/generar_logica.py`, `tools/logica/` y `tools/pruebas/`. Modificados `supabase/02_funciones.sql`, `js/nucleo.js`, `js/api-supabase.js`, `js/api-demo.js`, `js/vistas-estudiante.js`, `js/vistas-tutor.js`, `js/app.js`, `js/config.js` (solo `VERSION`), `css/app.css`, `index.html`, `version.json`, `manifest.webmanifest`, `tools/construir_demo.py`, `demo.html`, `README.md` y los diez documentos de `_contexto/`. No cambiaron `01_esquema.sql`, `03_carga_inicial.sql`, `css/tema.css` ni los paquetes de lectura.
- Qué hizo Diego a mano: nada todavía. Le toca, en este orden: (1) en Supabase, ejecutar `04_razonamiento_logico.sql` y después `02_funciones.sql`; (2) subir los archivos a GitHub; (3) en la app, como tutor, cargar `logica-base`, `logica-001` y `logica-002`.
- Cómo se probó: (a) El demo, con Playwright y Chromium, en celular (390 px) y en escritorio: retos de los dos componentes sin mezcla, pista, diagnóstico del error, pasos, ficha, reto por técnica, repaso de errores, simulacro de lógica con recarga a la mitad, diagnóstico, perfil, misiones de lógica, panel y detalle del tutor, validador con paquetes buenos y malos; también el demo sin los paquetes de lógica, que se ve como la 1.0.0. Sin errores de JavaScript. (b) El SQL, en un Postgres 16 local con una imitación mínima de Supabase: se montó la base con el `02` de la 1.0.0, se crearon respuestas y simulacros, se aplicó la migración (dos veces) y se comprobó que no cambió ningún dato; que las llamadas con los parámetros de la 1.0.0 siguen funcionando; y todas las funciones de lógica, los permisos y la instalación desde cero. 73 comprobaciones, ninguna falla. (c) Se comparó la forma de las respuestas del demo y del SQL. (d) El archivo de respaldo se ejecutó y deja Lectura funcionando como antes. (e) Cada respuesta numérica y cada acertijo tiene su comprobación en `tools/generar_logica.py`; después se releyeron los 109 enunciados y se ajustaron dos. Las 15 figuras se miraron dibujadas y se corrigieron cuatro. Los guiones quedaron en `tools/pruebas/`.
- Lo que no se probó: la app publicada contra el Supabase real (lo hace Diego al montar; la prueba con un usuario de prueba está en `07`). Las tipografías de Google no cargan en el entorno de pruebas, así que las capturas se vieron con la fuente de respaldo. Ninguna persona distinta de quien las escribió ha resuelto los problemas.
- Pendiente o por vigilar: que Diego resuelva en papel una muestra de problemas antes de cargar, mirando sobre todo la claridad de los enunciados. `logica-base` reemplaza la clave `categorias` con los textos de fábrica de lectura. El banco de lógica es justo para simulacros de 40: ampliar, empezando por Patrones. Al publicar, la navegación del celular de la estudiante pasa a quedar abajo. Observaciones y mejoras de Lógica en `08`.

## 2026-10-04 · Paquete-005 preparado: el banco llega a 150

- Tipo: contenido
- Versión de la app: 1.0.0, sin cambio
- Qué se hizo: se escribió `paquete-005`: 5 lecturas y 27 preguntas (7 fáciles, 10 medias, 10 difíciles), calculadas para cerrar la matriz exacta de 150. Lecturas: «La lengua, esa obra sin terminar» (ensayo, 408 palabras, sobre el purismo y el cambio de las lenguas), «Una biblioteca de barrio presta instrumentos» (noticia ficticia, primera lectura de tipología `periodistico`), «En defensa del aburrimiento» (columna de opinión, primera de tipología `argumentativo`; trae a propósito un argumento débil para que la estudiante lo detecte), «Letras de aviso» (relato) y «Talleres de vacaciones: ficha comparativa» (discontinuo).
- Archivos que cambiaron: `content/paquete-005.json` (nuevo). En `_contexto/`: `00`, `05`, `08` y esta bitácora.
- Qué hizo Diego a mano: nada todavía. Falta cargar `paquete-005`, y confirmar si `paquete-003` y `paquete-004` ya están cargados.
- Cómo se probó: script de validación (formato, códigos, conteos, posición y longitud de la correcta, citas contra las lecturas). Carga en `demo.html` con Playwright, con 002, 003 y 004 cargados: el banco quedó en 150 preguntas (30 literales, 52 inferenciales, 45 críticas, 23 de cohesión) sin errores de JavaScript. Se iniciaron los tres simulacros: dificultad media de 1,83 en inicial, 2,02 en avanzado y 2,28 en experto. Sobre los cinco archivos de `content/` se comprobó que no hay códigos repetidos. Ninguna persona distinta de quien las escribió ha respondido todavía las preguntas.
- Fuentes consultadas: el ensayo usa el *Appendix Probi*; se confirmó en Wikipedia que es una lista anónima compuesta hacia el siglo IV con 227 correcciones. Las tres entradas citadas («auris non oricla», «oculus non oclus», «vetulus non veclus») son las habituales en los manuales de historia de la lengua, pero no se verificaron contra una edición.
- Pendiente o por vigilar: que Diego lea y responda los paquetes 003 a 005 antes de cargarlos y coteje el poema de `P004-T03`. El simulacro sigue sin equilibrar niveles (observación 3 de `08`): en la prueba, el inicial salió con 14 inferenciales y 5 críticas, y el experto con 18 críticas. Con 150 preguntas ya vale la pena corregirlo. Lo siguiente, según `08`: mirar los datos de uso de la estudiante.

## 2026-10-04 · Paquete-004 preparado

- Tipo: contenido
- Versión de la app: 1.0.0, sin cambio
- Qué se hizo: se escribió `paquete-004`: 5 lecturas y 30 preguntas (6 fáciles, 13 medias, 11 difíciles). Lecturas: «Las láminas de la Expedición» (ensayo, 441 palabras, sobre la Real Expedición Botánica), «La red bajo el bosque» (divulgación, sobre las redes de hongos y lo que está y no está probado), «Canción de la vida profunda (fragmento)» (poema de Porfirio Barba Jacob, en dominio público; se omitió una estrofa y se marcó con «[…]»), «¿Doblaje o subtítulos?: dos posturas» (intertextual) y «Cineclub La Linterna: ciclo de octubre» (discontinuo, la lectura fácil). Patrones nuevos: figura retórica, palabra rara por sus partes, presuposición, clasificación «respectivamente», frase que resume, doble referente de un pronombre, función de las rayas.
- Archivos que cambiaron: `content/paquete-004.json` (nuevo). En `_contexto/`: `00`, `05`, `08` y esta bitácora.
- Qué hizo Diego a mano: nada todavía. Falta cargar `paquete-004`, y confirmar si `paquete-003` ya está cargado.
- Cómo se probó: script de validación (formato, códigos, conteos, posición y longitud de la correcta, citas contra las lecturas). Carga en `demo.html` con Playwright, con 002 y 003 cargados: el banco pasó a 123 preguntas sin errores de JavaScript. Los tres simulacros se iniciaron y salen distintos. El poema se vio a 390 px: los versos largos se parten en dos renglones, pero las estrofas se conservan. Ninguna persona distinta de quien las escribió ha respondido todavía las preguntas.
- Fuentes consultadas: los datos de la Expedición (1783, sedes, más de cinco mil láminas, más de cuarenta dibujantes casi todos americanos, mayoría sin firma, traslado a Madrid en 1817, primer volumen en 1954) salen de la página del Real Jardín Botánico (mutis.rjb.csic.es). El poema se escribió de memoria y se cotejó solo en parte contra antologiacriticadelapoesiacolombiana.com: quedaron confirmados «nos sonría...», «¡oh Tierra!», «para jamás volver;», el inciso «¡niñez en el crepúsculo! ¡Lagunas de zafir!» y «obscura de obscuro»; el resto de la puntuación no se pudo verificar verso por verso.
- Pendiente o por vigilar: que Diego coteje el poema con una edición impresa y responda las preguntas antes de cargar. La revisión de 2023 sobre las redes de hongos (Karst, Jones y Hoeksema, en Nature Ecology & Evolution) se resumió a partir de una nota de prensa y de lo que se conoce del artículo; el texto no da cifras. Faltan 27 preguntas: paquete 005 (ver «El banco hoy» en `05`).

## 2026-10-04 · Paquete-002 cargado y paquete-003 preparado

- Tipo: contenido
- Versión de la app: 1.0.0, sin cambio
- Qué se hizo: Diego cargó `paquete-002` en la app real. Se escribió `paquete-003`: 5 lecturas originales y 32 preguntas, más largas y más exigentes (5 fáciles, 16 medias, 11 difíciles). Lecturas: «Lo que los archivos callan» (ensayo, 432 palabras), «El punto exacto de la dificultad» (divulgación, sobre el estado de flujo y los videojuegos), «El reloj de Santa Rita» (relato), «Lo que el algoritmo te pone a oír: dos posturas» (intertextual) y «Línea de tiempo: cómo hemos guardado la música» (discontinuo, la lectura fácil del paquete). Patrones de pregunta nuevos: refrán aplicable, título adecuado, enunciado partido, actitud análoga, EXCEPTO, comillas de distancia, coma de elipsis y punto y coma.
- Archivos que cambiaron: `content/paquete-003.json` (nuevo). En `_contexto/`: `00`, `05`, `08` y esta bitácora.
- Qué hizo Diego a mano: cargó `paquete-002` desde Tutor → Contenido. Falta cargar `paquete-003`.
- Cómo se probó: el mismo script de validación del paquete anterior (formato, códigos, conteos, posición y longitud de la correcta, citas contra las lecturas). Carga en `demo.html` con Playwright, con el 002 ya cargado: el banco pasó a 93 preguntas sin errores de JavaScript. Se iniciaron los tres simulacros: con 93 preguntas ya salen distintos entre sí (el inicial toma las lecturas fáciles; el experto, los ensayos y los textos en diálogo). Lecturas vistas a 390 px. Ninguna persona distinta de quien las escribió ha respondido todavía las preguntas.
- Pendiente o por vigilar: que Diego lea y responda antes de cargar. La línea de tiempo usa fechas reales y el texto de divulgación cita a Mihály Csíkszentmihályi. Se confirmaron contra Wikipedia el fonógrafo (1877), el LP (1948), el casete (1963), el CD (1982) y la grafía del nombre; no se confirmaron en esa consulta el reproductor portátil (1979), el intercambio de archivos (1999), el reproductor digital (2001), las plataformas (2008) ni los 74 minutos del CD, que son datos muy conocidos pero quedaron sin fuente. Faltan 57 preguntas: paquetes 004 y 005 (ver «El banco hoy» en `05`).

## 2026-10-04 · Paquete-002 preparado

- Tipo: contenido
- Versión de la app: 1.0.0, sin cambio
- Qué se hizo: Diego confirmó que la estudiante aspira a Artes Plásticas y que está inscrita en la convocatoria 2027-1, cuyo examen es el 26 y 27 de octubre de 2026. Se escribió `paquete-002`: 5 lecturas originales y 31 preguntas. Cubre los huecos de la matriz (12 preguntas de dificultad 1 entre inferencial, crítico y cohesión; 2 literales de dificultad 3) y trae lecturas con dificultades promedio distintas, de 1,17 a 2,57, para que los tres niveles de simulacro dejen de parecerse. Lecturas: «La canción que no se va» (divulgación), «Convocatoria: Salón de Arte Joven» (discontinuo), «Lo que el marco decide» (ensayo), «Jueves a las tres» (relato) y «El grafiti entra al museo: dos posturas» (intertextual).
- Archivos que cambiaron: `content/paquete-002.json` (nuevo). En `_contexto/`: `00`, `05`, `08` y esta bitácora.
- Qué hizo Diego a mano: pendiente. Falta cargar el paquete en la app real desde Tutor → Contenido.
- Cómo se probó: formato, códigos, conteos por nivel y dificultad, posición y longitud de la opción correcta, con un script; las citas de los enunciados se compararon contra las lecturas. Se cargó en `demo.html` con Playwright por el camino real (pegar, «Revisar paquete», «Cargar paquete»): el banco pasó a 61 preguntas sin errores de JavaScript, la novedad apareció al entrar como estudiante, el simulacro inicial ya mezcla lecturas de los dos paquetes, y lectura y pregunta se vieron bien a 390 px. Ninguna persona distinta de quien las escribió ha respondido todavía las preguntas.
- Pendiente o por vigilar: que Diego lea las lecturas y responda las preguntas sin mirar la clave antes de cargar (lista de revisión de `05`). Faltan 89 preguntas para llegar a 150: paquetes 003 a 005, con lecturas más largas y dificultad 2 y 3. `tools/construir_demo.py` solo incluye `paquete-001`, así que `demo.html` no trae el paquete nuevo hasta que se pegue en su panel de tutor. En `demo.html` se ve un `">` suelto arriba a la izquierda: es solo del demo; la causa probable es que `construir_demo.py` mete el ícono en el HTML antes de quitar la etiqueta `apple-touch-icon`, y la expresión que la quita se corta en el primer `>` del SVG. La parte de lectura de `Cuadernillo-examen-udea.pdf` resultó ser de la Universidad de Cartagena (ver `00`). La guía de aspirantes 2027-1 dice, según un resumen automático, que ya no hay puntaje mínimo; `02` todavía habla de 53 y conviene verificarlo en la guía oficial.

## 2026-10-04 · Carpeta de contexto

- Tipo: documentación
- Versión de la app: 1.0.0, sin cambio
- Qué se hizo: se leyó completo el código de la versión 1.0.0, los documentos del proyecto «Simulacro Examen UdeA» y las conversaciones de diseño y montaje, y se escribió la carpeta `_contexto/` con diez documentos.
- Archivos que cambiaron: solo los de `_contexto/`. No se tocó ningún archivo de la app.
- Qué hizo Diego a mano: nada.
- Cómo se probó: los datos de los documentos se contrastaron contra el código (fórmulas, tablas, rutas, conteos del banco).
- Confirmado por Diego ese mismo día: la app ya está al aire en https://godeloz.github.io/lectura-admision-udea/ La ampliación del banco de preguntas y los demás ajustes se harán en otros chats, partiendo de esta carpeta.
- Pendiente o por vigilar: llenar los «Datos por completar» de `00-LEEME-PRIMERO.md`. Revisar en un celular el plegado de la lectura (observación 5 de `08`). Empezar el `paquete-002`.

## 2026-09-26 · Montaje en Supabase

- Tipo: administración
- Versión de la app: 1.0.0
- Qué se hizo: se compararon las dos versiones de la app que existían, `combo-lector` y `entrelineas`, y se eligió Entrelíneas. Se migró dentro del mismo proyecto de Supabase.
- Archivos que cambiaron: `js/config.js`, con la URL y la clave pública del proyecto.
- Qué hizo Diego a mano: eliminó el esquema de `combo-lector` (primero las tablas con `cascade`, después las funciones, porque las políticas dependían de `is_tutor()`); ejecutó `01_esquema.sql`, `02_funciones.sql` y `03_carga_inicial.sql`; desactivó el registro público; creó los usuarios en Authentication; se nombró tutor con `update perfiles set rol = 'tutor' where usuario = 'diego'`.
- Cómo se probó: sin registro.
- Pendiente o por vigilar: la publicación en GitHub Pages quedó confirmada el 4-oct-2026. La indicación fue subir el contenido de la carpeta `entrelineas`, no la carpeta misma, para que `index.html` quede en la raíz del repositorio.

## 2026-09-26 · Versión 1.0.0

- Tipo: función nueva (construcción inicial)
- Versión de la app: 1.0.0
- Qué se hizo: se definió la lógica de la app y se construyó completa: esquema, funciones SQL, front, modo demo, `paquete-001` con 5 lecturas y 30 preguntas, 23 insignias, configuración base y README.
- Archivos que cambiaron: todos (creación).
- Qué hizo Diego a mano: tomó las decisiones de diseño (ver `01-proposito-y-decisiones.md`).
- Cómo se probó: recorrido de punta a punta sobre el demo con Playwright y Chromium, como estudiante y como tutor, en escritorio y en celular.
- Pendiente o por vigilar: el banco de 30 preguntas es el mínimo para arrancar.

## 2026-09-23 · Fuentes del proyecto

- Tipo: documentación
- Qué se hizo: se cargaron al proyecto de Claude el análisis del examen de admisión (`Examen de Admisión UdeA.md`), el banco del simulacro virtual (`simulacro-udea-b.md`) y los dos PDF originales.
