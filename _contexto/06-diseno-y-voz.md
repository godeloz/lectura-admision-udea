# 06 · Diseño y voz

## La idea

La app tiene dos modos que conviven. El **modo juego** es oscuro, vibrante y musical: noche violeta, acentos de neón, títulos gruesos. El **modo lectura** es papel claro con tipografía de libro: cuando aparece un texto, todo lo demás baja el volumen. La estética no puede costarle comprensión a la estudiante.

La metáfora es la música, por los gustos de la estudiante:

| En la app | Metáfora |
|---|---|
| Retos de 5, 10 y 15 preguntas | Canción, EP, Álbum, en una lista tipo *tracklist* con botón de reproducir |
| Dominio por nivel | Un ecualizador de cuatro columnas con 20 segmentos cada una |
| Progreso de XP | La barra de reproducción de una canción |
| Rangos | Demo, Maqueta, Disco de oro, Platino, Diamante, Leyenda UdeA |
| Insignias | Primera nota, Semana en loop, EP perfecto, Álbum perfecto |
| Pantalla de carga e ingreso | Ondas de sonido |
| Ícono de la app | Cuatro barras de ecualizador con los colores de los cuatro niveles |

El ecualizador es el elemento firma. Aparece en el inicio, en el perfil, en el diagnóstico y en la vista del tutor.

## Colores

Definidos en `css/tema.css`. Cambiar la estética empieza por ese archivo.

| Variable | Valor | Uso |
|---|---|---|
| `--noche` | `#1A1238` | Fondo general. Violeta profundo, no negro |
| `--noche-2` | `#221847` | Paneles |
| `--superficie` | `#2C2160` | Tarjetas, opciones, chips |
| `--superficie-2` | `#372A74` | Botones suaves |
| `--borde` | `#45388C` | Bordes |
| `--texto` | `#F4EFFF` | Texto principal |
| `--texto-2` | `#C3B8EC` | Texto secundario |
| `--tenue` | `#948AC6` | Texto terciario |
| `--rosa` | `#FF4FA3` | Nivel inferencial y acción principal |
| `--cian` | `#3FD8F2` | Nivel literal, enlaces, foco |
| `--amarillo` | `#FFCB3D` | Nivel crítico, XP y rangos |
| `--menta` | `#6BF0A6` | Nivel de cohesión y aciertos |
| `--violeta` | `#AE93FF` | Simulacros |
| `--coral` | `#FF6E6E` | Errores y tiempo agotándose |
| `--papel` | `#FBF8FF` | Fondo de la lectura |
| `--tinta` | `#251D44` | Texto de la lectura |
| `--tinta-2` | `#5A5180` | Texto secundario de la lectura |

Cada nivel tiene su color en toda la app. El mecanismo: una clase `cr-<nombre>` (`cr-literal`, `cr-critico`, `cr-violeta`…) define la variable `--c`, y los componentes pintan con `var(--c)`. El color de cada categoría también está en la configuración (`categorias.<nivel>.color`), y las insignias llevan su propio `color`.

## Tipografías

Cargadas desde Google Fonts en `index.html`.

| Variable | Fuente | Uso |
|---|---|---|
| `--f-display` | Unbounded (600 a 800) | Títulos, números grandes, marca |
| `--f-ui` | Figtree (400 a 800) | Interfaz |
| `--f-lectura` | Literata (400 y 600, con cursiva) | Lecturas: 1,06 rem, interlineado 1,75, renglón de máximo 68 caracteres |

## Formas y medidas

- Radios: `--r-s` 8 px, `--r-m` 14 px, `--r-l` 24 px, `--r-pill` para botones y chips.
- Ancho máximo del contenido: `--ancho` 1120 px.
- Sombra única: `--sombra`.

## Componentes

`css/app.css` está organizado en secciones comentadas, en este orden: estructura, botones, paneles, encabezado de inicio, ecualizador, tracklist de retos, mensajes del tutor, sesión de preguntas, simulacro, diagnóstico, perfil, formularios, ingreso, tutor, superposiciones.

| Clase | Qué es |
|---|---|
| `.barra`, `.nav`, `.marca` | Barra superior fija. En celular la navegación baja al borde inferior con íconos |
| `.btn` más `.sec`, `.suave`, `.chico`, `.ancho`, `.color` | Botones. El principal es rosa |
| `.enlace` | Botón con aspecto de enlace |
| `.panel`, `.rejilla` (`.inicio`, `.dos`), `.pila`, `.fila`, `.entre` | Maquetación. `.pila` separa hijos en vertical con `--pila` |
| `.titulo-seccion` | Título con una nota a la derecha |
| `.saludo`, `.avatar-grande`, `.chips`, `.chip` | Encabezado del inicio y del perfil |
| `.pista` | Barra de XP |
| `.eq`, `.eq-col`, `.eq-seg` | Ecualizador |
| `.tracklist`, `.track` | Lista de retos |
| `.mensaje` (`.mision`, `.comentario`) | Tarjetas de lo que envía el tutor |
| `.sesion-cab`, `.progreso`, `.xp-vivo` | Cabecera de un reto |
| `.juego` | Dos columnas en pantallas anchas: lectura fija a la izquierda, pregunta a la derecha |
| `.lectura` (`.plegada`) | La lectura sobre papel |
| `.pregunta`, `.etq`, `.dif`, `.enunciado`, `.opciones`, `.opcion` (`.sel`, `.bien`, `.malo`) | La pregunta |
| `.retro` (`.bien`, `.malo`) | Explicación tras responder |
| `.reloj` (`.aviso`, `.urgente`), `.mapa`, `.niveles`, `.nivel` | Simulacro |
| `.marcador`, `.stats`, `.stat`, `.referencias`, `.revision` | Diagnóstico y resultados |
| `.calor`, `.insignias`, `.insignia` (`.bloq`) | Perfil |
| `.campo`, `.segmentos`, `.avatares`, `.dos-campos` | Formularios |
| `.ingreso`, `.ingreso-caja`, `.ondas` | Pantalla de ingreso |
| `.alerta`, `.estudiantes`, `.est`, `.fallada`, `.tabla`, `.celda-mapa` | Panel del tutor |
| `.banda` (`.demo`, `.version`), `.avisos`, `.aviso`, `dialog`, `.premio`, `.cargando`, `.vacio` | Superposiciones y estados |

## Comportamiento en pantalla

- **Pensada primero para celular.** La estudiante la usa como app, con «Agregar a pantalla de inicio». Respeta las zonas seguras del teléfono.
- Cortes principales: 720 px (la navegación pasa de abajo a arriba), 900 px (rejillas de dos columnas) y 960 px (lectura y pregunta lado a lado).
- En pantallas anchas la lectura queda fija mientras se desplaza la pregunta.
- En pantallas angostas la lectura puede plegarse a unas pocas líneas, con un botón para mostrarla completa.
- Durante un reto o un simulacro se oculta la navegación.

## Accesibilidad

- Foco visible en cian sobre todos los controles.
- Las animaciones (segmentos del ecualizador que se encienden, ondas, el ícono de una insignia recién ganada) solo corren si el sistema no pide reducir movimiento.
- Las opciones de respuesta usan `role="radio"`; el reloj, `role="timer"`; los avisos, `role="status"`.
- El acierto y el error no dependen solo del color: llevan texto («Correcto», «La respuesta era la B») y símbolos (✓, ✗).
- Diálogos con el elemento `<dialog>` nativo.

## La voz

Cómo le habla la app a la estudiante:

- **De tú, en español de Colombia, sin diminutivos ni infantilismo.** Es una persona de 17 años preparando un examen serio.
- **Frases cortas y concretas.** «Elige un reto y empieza a sumar.» «Llevas 4 días seguidos. Un reto hoy y la racha sigue.»
- **Anima sin exagerar.** Nada de signos de exclamación en cadena ni de felicitaciones por cualquier cosa. «Muy buen ritmo.» «Perfecto. Ni una sola equivocación.»
- **Dice la verdad cuando sale mal y abre una salida.** «Hoy costó. Las preguntas falladas volverán en unos días para que las domines.»
- **Enseña táctica de examen cuando viene al caso.** «En el examen real una respuesta vacía no suma nada: si no sabes, elige la más razonable.»
- **Nombra las cosas con sus nombres de la app:** reto, misión, simulacro, racha, dominio, nivel (literal, inferencial, crítico, cohesión), insignia, rango.
- **Emojis solo como íconos** (navegación, chips, insignias, avatares), nunca dentro de una frase.

Con el tutor el tono es de trabajo: datos primero y verbos claros («Enviar misión», «Descartar»). Los mensajes sugeridos de las alertas están escritos como los escribiría él, en primera persona, para que solo tenga que retocarlos.

### Género

La interfaz está escrita en femenino porque hay una estudiante: «Una estudiante», «Todas las estudiantes», la insignia «Conectora». Si se suma un estudiante, hay que revisar esos textos en `js/vistas-tutor.js`, `js/vistas-estudiante.js`, `content/base.json` y `supabase/02_funciones.sql` (los mensajes sugeridos).

---

## Razonamiento Lógico (versión 1.1.0)

### Dos componentes, una misma casa

Lógica usa el mismo modo juego (noche violeta, títulos gruesos) y el mismo ecualizador de cuatro columnas. Se distingue por tres cosas:

| | Lectura | Lógica |
|---|---|---|
| Acento | rosa | cian |
| Retos | Canción, EP, Álbum | Riff, Solo, Jam |
| Niveles | Literal (cian), Inferencial (rosa), Crítico (amarillo), Cohesión (menta) | Deducción (violeta), Proporciones (amarillo), Patrones (rosa), Geometría (menta) |

El acento se aplica con la clase `comp-lectura` o `comp-logica` en el contenedor de la pantalla: define `--acento`, que usan la lista de retos y el marcador de un reto terminado. Los colores de nivel siguen el mecanismo de siempre: `cr-deductivo`, `cr-proporcional`, `cr-abstracto` y `cr-geometrico` definen `--c`. Las insignias de lógica aparecen aparte en el perfil, bajo «Insignias de Lógica».

La metáfora para Lógica es la del ensayo: un riff, un solo, una jam; una **caja de herramientas** con las técnicas y un **cuaderno de errores**. En la lectura el texto vive en papel; en lógica, lo que vive en papel son las figuras y las situaciones.

### Componentes nuevos

| Clase | Qué es |
|---|---|
| `.juego.solo` | Pregunta sin texto al lado: una columna centrada |
| `.enunciado.md` | Enunciado con párrafos, listas y cuadros |
| `.figura` | Figura sobre papel claro. Dentro de una situación no lleva fondo propio |
| `.cuadro` | Cuadro de datos, en el enunciado (oscuro) o dentro de una situación (claro) |
| `.lectura.situacion` | El contexto compartido de varias preguntas: tipografía de interfaz, no de libro |
| `.pista-caja` | La pista, con borde punteado amarillo |
| `.diag-error`, `.etq-error` | «Qué pasó»: el tipo de error, la nota y el consejo, con filete coral |
| `.solucion`, `.pasos` | Solución paso a paso, con pasos numerados en círculos |
| `.idea` | La idea clave, en cursiva |
| `.ficha` (`.ejemplo`, `.trampa`) | Ficha de una técnica |
| `.tecnicas`, `.tecnica` (`.proceso`, `.dominada`), `.tec-estado` | Caja de herramientas: tarjetas con el filete del color de su estado |
| `.perfil-errores`, `.pe-fila` | Barras de errores por tipo |
| `.repaso-fila` | Fila con una técnica y sus botones «Ver ficha» y «Practicar» |
| `.pendiente` | Pregunta del cuaderno de errores, plegable |
| `.stats.dos`, `.enlace-stat` | Dos cifras grandes que además son enlaces |

Las figuras se dibujan con trazo `currentColor` (tinta sobre papel), relleno `#C9BDF2` para las regiones sombreadas y textos de 12 o 13 px. Tamaño máximo recomendado: 290 px de ancho, para que quepan sin achicarse en un celular.

### La navegación en celular

Con cinco entradas (Lectura, Lógica, Simulacro, Mensajes, Perfil) la barra inferior sigue cabiendo a 390 px. En la 1.0.0 esa barra no bajaba al borde inferior en algunos navegadores: el fondo borroso de la barra superior la dejaba atada arriba, encima del nombre de la app. En la 1.1.0 el desenfoque pasó a un pseudoelemento (`.barra::before`) y la navegación queda abajo, como estaba pensado.

### La voz en Lógica

Las mismas reglas, con dos cuidados más:

- **El error se describe, no se juzga.** «Tomaste la cuarta parte del total; el enunciado dice de lo que le quedaba.» Nunca «te equivocaste porque no leíste bien».
- **Los nombres de los tipos de error son llanos**: «Leíste otra pregunta», «A mitad de camino», «Cuenta», «Salto lógico». Nada de «error procedimental».
- La pista pregunta o sugiere; no ordena la solución.
- Los números se escriben como en Colombia: punto para miles, coma para decimales, signo de pesos sin espacio ($36.000), porcentaje con espacio (20 %).

## Cuentas, instalación y grupos (versión 1.2.0)

- **Franjas de arriba**: amarilla para el demo, cian para la versión nueva, violeta para el modo práctica del tutor y menta para «Instala la app en tu celular». La de instalar se esconde dentro de un reto o simulacro.
- **Pasos de instalación**: lista numerada con círculos menta, el ícono de Compartir de Safari dibujado y los nombres exactos de los botones entre comillas.
- **Contraseña temporal**: en letra monoespaciada amarilla, para que se lea sin confundir letras.
- **Personas**: tarjetas con etiquetas de estado (amarillo: aún no elige su contraseña; menta: app instalada; coral: desactivada).
- **La semana del grupo**: una fila por persona con puesto, avatar, siete puntos para los días (menta los que practicó) y el XP en amarillo; la propia fila con borde rosa.
- **Navegación de seis entradas** (estudiante en un grupo): en el celular las entradas se reparten el ancho y la letra baja a .66rem; cabe en 320 px.
- **Voz**: los textos nuevos están escritos sin marcar género («Hola, Laura», «Te faltan 40 XP»), porque ya no hay una sola estudiante. Los textos viejos en femenino siguen pendientes (observación 16 de `08`).
