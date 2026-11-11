# 04 · Reglas y fórmulas

Todo lo que sigue está tomado de `supabase/02_funciones.sql`, que es la versión que manda. `js/api-demo.js` lo replica para el modo demo. Los números marcados como configurables viven en la tabla `app_config` y se cambian con un paquete (ver `05`); sus valores de fábrica están en `content/base.json`.

## Dominio por nivel (0 a 100)

Función `dominio_categorias`.

- Se toman las últimas 30 respuestas de la estudiante en cada categoría, de cualquier origen: reto, misión o simulacro.
- Cada respuesta pesa según la dificultad de la pregunta (1, 2 o 3).
- Fórmula: `dominio = 100 × (suma de dificultades acertadas + 0,7) ÷ (suma de dificultades respondidas + 2)`.
- Sin respuestas, el dominio arranca en 35. Es deliberado: las primeras preguntas de cada nivel salen fáciles.
- Una pregunta de simulacro dejada en blanco cuenta como fallada.

## Selección de preguntas de un reto

Función `seleccionar_preguntas(uid, n, categoria)`. Con `categoria` vacía el reto es mezclado; con categoría, todas son de ese nivel (así funcionan las misiones dirigidas y los botones «Practicar 5 de…»).

1. **Repaso.** Se reserva `n × retos.repaso` (20 %, configurable): 1 pregunta en un reto de 5, 2 en uno de 10, 3 en uno de 15. Entran preguntas cuya última respuesta fue incorrecta y tiene más de 20 horas, empezando por las más antiguas.
2. **Preguntas nuevas.** Candidatas: activas, que no estén ya en el repaso y que nunca se hayan respondido o cuya última respuesta tenga más de 30 días. Dentro de cada categoría se ordenan por un puntaje (gana el más bajo):
   - distancia entre la dificultad de la pregunta y la dificultad objetivo del nivel: objetivo 1 si el dominio es menor que 45, 2 si es menor que 75, 3 de ahí en adelante;
   - más 1,5 si ya se respondió alguna vez;
   - más un número al azar entre 0 y 1.
3. **Cupo por categoría** en retos mezclados: `(n − repaso) × distribucion[categoría]`, redondeado y con un mínimo de 1. Con la distribución 20/35/30/15, un EP de 10 con 2 de repaso trae 2 literales, 3 inferenciales, 2 críticas y 1 de cohesión.
4. **Relleno.** Si no se llega a `n`, se completa con cualquier pregunta activa al azar. Con un banco pequeño este relleno es el que hace que las preguntas se repitan antes de los 30 días.
5. **Orden.** Se agrupan por lectura, para no saltar de un texto a otro.

## Reto y misión

- `iniciar_reto(n, categoria, mensaje)` acepta de 1 a 30 preguntas. Si llega con `mensaje`, la sesión es de tipo `mision` y queda ligada a ese mensaje del tutor.
- `responder` valida que la sesión sea de quien llama, que siga abierta, que la pregunta pertenezca a la sesión y que no se haya respondido ya. Solo entonces devuelve la opción correcta y la explicación.
- `finalizar_reto` cierra la sesión, da los bonos y evalúa insignias. Los bonos solo llegan si se respondieron todas las preguntas. Si era una misión completa, marca el mensaje como cumplido.
- Si la estudiante sale a mitad de camino, lo respondido queda guardado, sin bono. Si sale sin haber respondido nada, la sesión queda abierta en la base de datos y no afecta nada.

## XP

Clave de configuración `xp`.

| Evento | XP | Clave |
|---|---|---|
| Acierto en reto o misión | 10 × dificultad | `por_acierto` |
| Bono de ritmo: acierto respondido entre 5 y 120 segundos | +5 | `bono_ritmo`, `segundos_bono` |
| Fallo en reto o misión | 2 | `por_intento` |
| Reto completo | +20 | `reto_completo` |
| Reto sin errores | +30 más | `reto_perfecto` |
| Misión completa | +40 más | `mision` |
| Acierto en simulacro | 12 | `simulacro_acierto` |
| Entregar un simulacro | +60 | `simulacro_completo` |

Un EP perfecto con preguntas de dificultad 2 y buen ritmo da 10 × (20 + 5) + 20 + 30 = 300 XP.

### Rangos

Clave `rangos`: Demo (0), Maqueta (300), Disco de oro (1.000), Platino (2.500), Diamante (5.000), Leyenda UdeA (9.000). El rango se calcula en el navegador a partir del XP (`LE.rango`).

## Racha

Función `rachas`.

- Un día cuenta si hay al menos una respuesta ese día, en hora de Bogotá.
- La racha actual es la serie de días consecutivos que termina hoy o ayer. Si el último día con práctica fue anteayer, la racha es 0.
- La mejor racha es la serie más larga de la historia.

## Tiempo de estudio

`LE.cronometro` en el navegador y `registrar_tiempo` en el servidor.

- Solo se mide para estudiantes.
- Cada 15 segundos se suman 15 si la pestaña está visible y hubo alguna interacción (toque, tecla, desplazamiento) en los últimos 2 minutos.
- Se envía al servidor al acumular 60 segundos, y también al ocultar o cerrar la pestaña.
- El servidor acepta como máximo 90 segundos por llamada, para que no se pueda inflar.
- Se guarda en `actividad_diaria`, una fila por día.

## Simulacro

Clave `simulacros`.

| Nivel | Preguntas | Minutos | Segundos por pregunta | Dificultad objetivo |
|---|---|---|---|---|
| `inicial` | 30 | 65 | 130 | 1,6 |
| `avanzado` | 40 | 90 | 135 | 2,1 |
| `experto` | 50 | 110 | 132 | 2,5 |

**Al iniciar** (`iniciar_simulacro`):

- Si hay un simulacro abierto y con tiempo, se retoma el mismo, con el mismo límite.
- Los abiertos ya vencidos se cierran como abandonados y no aparecen en el historial.
- Se eligen lecturas completas, con todas sus preguntas, ordenadas por cercanía entre su dificultad promedio y la dificultad objetivo del nivel, con algo de azar. Se acumulan lecturas hasta llegar al número de preguntas; la última puede quedar recortada.
- La distribución por categoría no interviene: la mezcla de niveles de un simulacro depende de las lecturas que salgan.
- Si el banco tiene menos preguntas que el nivel, se usan todas y el tiempo se ajusta en proporción. Con 30 preguntas, un avanzado dura 68 minutos y un experto 66.

**Durante** (navegador):

- El reloj se calcula contra la hora del servidor, de modo que cambiar la hora del dispositivo no sirve de nada.
- Se puede ir y volver entre preguntas, cambiar respuestas y marcar para revisar. Hay un mapa con todas las preguntas.
- Avisos a los 10 minutos y al minuto final. Al llegar a cero se entrega solo.
- Las respuestas se guardan en el navegador mientras tanto. Si cambia de dispositivo a mitad del simulacro, retoma la sesión pero pierde lo marcado.

**Al entregar** (`entregar_simulacro`):

- Se registran todas las preguntas, incluidas las vacías, que cuentan como incorrectas.
- Resultado: `correctas`, `total`, `puntaje` (porcentaje con un decimal), `xp`, `respondidas`, `minutos`, `por_categoria`, `detalle` pregunta por pregunta y `tarde`.
- `tarde` se marca si la entrega llega más de 3 minutos después del límite. Hoy es solo un dato: la entrega se acepta igual y la interfaz no lo muestra.

**Diagnóstico** (`LE.diagnosticoHTML`): porcentaje global, ecualizador con el porcentaje por nivel, nivel más fuerte y más débil, aviso de preguntas en blanco, comparación con `referencias` (85 %, 70 % y 55 %) y revisión pregunta por pregunta. Aclara que la comparación es aproximada, porque el puntaje real se estandariza y combina lectura con razonamiento lógico.

## Insignias

Función `evaluar_insignias`, que corre al terminar un reto y al entregar un simulacro. Cada insignia tiene una `regla` en JSON; añadir insignias con estos tipos no requiere tocar código.

| `regla.tipo` | Se cumple cuando | Campos |
|---|---|---|
| `racha` | La racha actual llega a `valor` | `valor` |
| `respuestas` | Total de respuestas | `valor` |
| `aciertos` | Total de respuestas correctas | `valor` |
| `retos` | Retos y misiones terminados | `valor` |
| `reto_perfecto` | Un reto o misión de al menos `valor` preguntas sin errores | `valor` |
| `dominio` | Dominio de `categoria` en `valor` o más, con 15 respuestas o más en ese nivel | `categoria`, `valor` |
| `simulacro` | Un simulacro de `nivel` terminado con puntaje de `valor` % o más | `nivel`, `valor` |
| `minutos` | Minutos totales de estudio | `valor` |
| `misiones` | Misiones del tutor cumplidas | `valor` |
| `remontada` | Un reto de 5 o más preguntas con 80 % o más justo después de uno por debajo de 50 % | ninguno |

Las 23 insignias de fábrica: primera nota; rachas de 3, 7 y 30 días; 50, 250 y 1.000 aciertos; 10 y 50 retos; EP perfecto y Álbum perfecto; remontada; dominio de 80 en cada nivel (Ojo de lince, Entre líneas, Voz crítica, Conectora); primer simulacro, avanzado al 70 y experto al 85 («Nivel Medicina»); 10 y 50 horas; 1 y 5 misiones.

Un tipo de regla nuevo exige programarlo en dos sitios: el `case` de `evaluar_insignias` en SQL y el `switch` de `evaluarInsignias` en `api-demo.js`.

## Alertas del tutor

Función `generar_alertas`, que corre cada vez que el tutor abre su panel. Clave `alertas`: `dias_inactividad` 3, `caida_puntos` 15, `minimo_respuestas` 5.

- **Inactividad.** Días desde la última respuesta (o desde que se creó el perfil, si nunca respondió) mayores o iguales al umbral. Solo una alerta por cada periodo de inactividad, aunque el tutor la descarte.
- **Caída.** Por categoría: porcentaje de aciertos de los últimos 7 días contra el de los 21 anteriores. Se necesitan al menos 5 respuestas en cada ventana y una caída de 15 puntos o más. No se repite para la misma categoría en 7 días.
- Cada alerta trae un mensaje sugerido que el tutor edita. «Enviar misión» manda una misión de 5 preguntas mezcladas (inactividad) o de 10 del nivel afectado (caída) y marca la alerta como atendida. «Descartar» la cierra sin enviar nada.

## Mensajes, misiones y comentarios

- **Mensaje:** título y cuerpo.
- **Misión:** además lleva `n` (5, 10 o 15) y, si se quiere, una categoría. La estudiante la ve destacada en el inicio con el botón «Empezar misión». Se cumple al terminar el reto con todas las preguntas respondidas.
- **Comentario:** se crea desde «Preguntas que más falla». Lleva citado el enunciado y la respuesta correcta.
- El punto rosa en la navegación de la estudiante aparece si hay algo sin leer o una misión sin cumplir.
- Al abrir `#/mensajes` se marcan como leídos los mensajes y comentarios. Las misiones se marcan como leídas al empezarlas.
- El tutor puede borrar cualquier mensaje enviado; desaparece también para la estudiante.

## Lo que ve el tutor de cada estudiante

- Panel: racha, minutos y respuestas de los últimos 7 días, porcentaje de aciertos de esos 7 días, última actividad y número de alertas abiertas.
- Detalle: racha y mejor racha, días con práctica en la semana, minutos (hoy, 7 días, total), respuestas y porcentaje de aciertos, segundos promedio por pregunta, retos terminados, dominio, mapa de calor de 28 días, evolución semanal por nivel de las últimas 8 semanas, simulacros con desglose por nivel y enlace al diagnóstico, mensajes enviados con su estado y las 15 preguntas que más falla, con su última respuesta.

## Novedades

- Un paquete puede traer `novedad` (`version`, `titulo`, `cuerpo`). Cada carga inserta una fila nueva en `novedades`.
- La estudiante ve al entrar las que tengan un número mayor que su `ultima_novedad`, hasta tres, y al cerrarlas quedan marcadas como vistas.
- Volver a cargar el mismo paquete repite la novedad. Para corregir un paquete ya cargado, hay que quitarle el campo `novedad` antes de recargarlo.

---

## Razonamiento Lógico (versión 1.1.0)

Las reglas de arriba siguen valiendo para Lectura sin cambios. Esto es lo que se añade o cambia con el segundo componente.

### Lo compartido y lo propio

| Compartido entre componentes | Propio de cada componente |
|---|---|
| XP y rango, racha, tiempo de estudio, mensajes, repaso espaciado (20 %), regla de no repetir en 30 días | Preguntas, dominio por nivel, distribución, retos, simulacros, referencias de puntaje |

Una sesión (reto, misión o simulacro) es de un solo componente y queda marcada en `sesiones.componente`.

### Configuración de Lógica

Claves nuevas en `app_config`, cargadas por `logica-base.json`:

| Clave | Valor de fábrica |
|---|---|
| `distribucion_logica` | deductivo 25 %, proporcional 30 %, abstracto 20 %, geometrico 25 % |
| `retos_logica` | Riff (5, unos 12 min), Solo (10, unos 25 min), Jam (15, unos 38 min) |
| `simulacros_logica` | inicial: 20 preguntas, 50 min, dificultad 1,6 · avanzado: 40, 90 min, 2,1 · experto: 40, 75 min, 2,4 |
| `referencias_logica` | 85 %, 70 % y 55 %, como en lectura |
| `tipos_error` | Los seis tipos, con nombre y consejo |
| `categorias` | Pasa a tener ocho entradas; las de lógica llevan `"componente": "logica"` |

La proporción de repaso sale de `retos.repaso`, la misma de lectura.

### Selección de preguntas en un reto de lógica

Es la misma función, `seleccionar_preguntas`, con el componente como filtro:

- Usa `distribucion_logica` para el cupo por nivel y el dominio de cada nivel de lógica para la dificultad objetivo.
- **Reto por nivel** (`categoria`): todas de ese nivel.
- **Reto por técnica** (`tema`): solo preguntas de esa técnica. Si la técnica tiene menos preguntas que las pedidas, el reto sale más corto (hoy cada técnica tiene 4 a 6).
- **Reto de repaso** (`tema = '@errores'`): solo preguntas cuya última respuesta fue incorrecta, de la más antigua a la más reciente, sin esperar las 20 horas del repaso espaciado. Si no hay ninguna, la función responde «No tienes errores pendientes por repasar».
- El orden agrupa las preguntas de una misma situación.

### Responder en lógica

- El margen del bono de ritmo es de 5 a **180** segundos (clave opcional `xp.segundos_bono_logica`; si falta, 180). En lectura siguen siendo 120.
- **Con pista no hay bono de ritmo.** El acierto vale lo mismo (10 × dificultad) y el fallo también (2). La pista queda registrada en `respuestas.pista`.
- La respuesta del servidor trae `pasos`, `tema` y, si falló, `error`: el diagnóstico de la opción que marcó (`preguntas.errores[opcion]`).

### Simulacro de lógica

Función `iniciar_simulacro(p_nivel, 'logica')`.

- Cupo por nivel: `preguntas × distribucion_logica[nivel]`. Un avanzado de 40 trae 10 de deducción, 12 de proporciones, 8 de patrones y 10 de geometría.
- Dentro de cada nivel se ordena por cercanía a la dificultad objetivo, más un número al azar entre 0 y 1,2, más 0,8 si la pregunta se respondió en los últimos 21 días.
- Si el banco no alcanza, se completa al azar con preguntas de lógica y el tiempo se ajusta en proporción.
- Las preguntas de una misma situación quedan juntas; el resto, mezcladas.
- Solo puede haber un simulacro abierto a la vez, sea de lectura o de lógica: pedir otro retoma el que está abierto.
- En la prueba con el banco de 109: inicial con dificultad media 1,70; avanzado, 2,25; experto, 2,48.

El resultado añade `por_error` (cuántos fallos de cada tipo), `por_tema` (aciertos y total por técnica) y, en el detalle, el tiempo de cada pregunta. El diagnóstico marca como «dónde se fue el tiempo» las preguntas de más de 210 segundos.

### Técnica dominada

Una técnica se da por dominada con **3 aciertos o más y al menos 75 % de aciertos** entre todas las respuestas de esa técnica. La regla está en dos sitios: `LE.estadoTecnica` (para pintar) y la insignia de tipo `tecnicas` (en `evaluar_insignias` y en `api-demo.js`).

### Cuaderno de errores

Función `cuaderno_errores(componente, uid)`:

- `perfil`: de los últimos 60 fallos con opción marcada, cuántos son de cada tipo de error.
- `temas`: intentos, aciertos y fecha de la última respuesta por técnica.
- `pendientes`: hasta 40 preguntas cuya última respuesta fue incorrecta, de la más reciente a la más antigua, con su opción, el diagnóstico de esa opción, la clave, los pasos y, si aplica, la situación.
- `recuperadas`: preguntas que falló alguna vez y después respondió bien.

Una pregunta de simulacro dejada en blanco también queda pendiente (sin diagnóstico), igual que en lectura cuenta como fallada.

### Insignias

Reglas nuevas y campos nuevos:

| `regla.tipo` | Se cumple cuando | Campos |
|---|---|---|
| `recuperadas` | Número de preguntas falladas que después respondió bien | `valor`, `componente` opcional |
| `tecnicas` | Número de técnicas dominadas | `valor`, `minimo` (aciertos mínimos por técnica; por defecto 3) |

`respuestas`, `aciertos`, `retos`, `reto_perfecto`, `remontada` y `recuperadas` aceptan `"componente"`: si falta, cuentan lo de los dos. En `simulacro`, si falta el componente se entiende lectura (así las tres insignias de simulacro de la 1.0.0 no se ganan con uno de lógica).

Las 16 insignias de lógica: Primera pieza; 50 y 200 aciertos en lógica; Diez riffs; Solo limpio (reto de 10 sin errores); Error corregido (5) y Taller de reparación (25); Caja de herramientas (5 técnicas) y Manos expertas (15); dominio de 80 en cada nivel (Detective, Justa medida, Descifradora, Ojo de arquitecta); Primer simulacro lógico, Lógica al 70 (avanzado) y Contrarreloj (experto al 80).

### Alertas y misiones

- La alerta de caída revisa las ocho categorías. Para las de lógica el mensaje sugerido habla de «la deducción lógica», «el trabajo con proporciones y conteo», «la búsqueda de patrones» o «la geometría».
- Una misión lleva `{"n": 10, "categoria": "geometrico", "componente": "logica"}`. Con categoría, el componente sale de ella; sin categoría, de `componente` (por defecto, lectura).

### Lo que ve el tutor de más

En el detalle: dominio de lógica, evolución semanal de lógica, simulacros de lógica, el perfil de errores de lógica y las técnicas con fallos (las seis de menor porcentaje con al menos dos intentos). En «Preguntas que más falla», cada pregunta de lógica muestra su técnica y el tipo de error de su última respuesta.
