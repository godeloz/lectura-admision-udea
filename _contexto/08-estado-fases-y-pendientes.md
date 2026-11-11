# 08 · Estado, fases y pendientes

## Fases del proyecto

| Fase | Cuándo | Qué pasó | Estado |
|---|---|---|---|
| 0. Fuentes | 23-sep-2026 | Se reunió en el proyecto de Claude el análisis del examen, un cuadernillo y un simulacro virtual. | Hecha |
| 1. Lógica | 26-sep-2026 | Se definieron los cuatro niveles, la distribución, los retos adaptativos, el repaso, la gamificación, los simulacros, el panel del tutor, la arquitectura y la dirección visual. Diego tomó tres decisiones: una estudiante hoy y varias mañana; comparación solo contra sí misma; intervención manual y automática. | Hecha |
| 2. Construcción | 26-sep-2026 | Se construyó la versión 1.0.0 completa: esquema y funciones de Supabase, front, 30 preguntas, modo demo y README. Se probó de punta a punta sobre el demo, en escritorio y en celular. | Hecha |
| 3. Montaje | 26-sep-2026 | Se comparó con la versión anterior (`combo-lector`) y se eligió Entrelíneas. Se eliminó el esquema viejo en Supabase, se ejecutaron `01`, `02` y `03`, se cerró el registro público, se crearon los usuarios, se nombró tutor a `diego` y se conectó `js/config.js`. Quedó explicada la subida a GitHub Pages. | Hecha. La app está al aire en https://godeloz.github.io/lectura-admision-udea/ |
| 4. Contexto | 4-oct-2026 | Se documentó la app en esta carpeta. | Hecha |
| 5. Banco | 4-oct-2026 | Llevar el banco de 30 a 150 preguntas. Hecho en un día: paquetes 002 a 005 escritos, validados y probados en el demo; el banco tiene 25 lecturas y 150 preguntas con la matriz prevista (30 literales, 52 inferenciales, 45 críticas, 23 de cohesión). `paquete-002` cargado por Diego; faltan por confirmar las cargas de 003, 004 y 005. | Escrito. Falta cargar y que una persona revise las preguntas |
| 6. Razonamiento Lógico | 4-oct-2026 | Versión 1.1.0: segundo componente del examen, navegable por separado. Migración de la base, funciones por componente, pantallas de Lógica (pista, qué pasó, solución paso a paso, caja de herramientas, cuaderno de errores, simulacro y diagnóstico propios), panel del tutor, 109 preguntas con su comprobación, 26 fichas de técnica y 16 insignias. Probado en el demo y contra un Postgres local. | Construida. Falta que Diego la monte: SQL en Supabase, archivos en GitHub y paquetes de lógica desde la app |
| 6b. Cuentas, grupos e instalación | 11-nov-2026 | Versión 1.2.0: el tutor crea cuentas desde la app con contraseña temporal y mensaje para WhatsApp; cambio de contraseña en el primer ingreso y desde el perfil; desactivar sin borrar; instrucciones de instalación según el teléfono, franja visible y app instalable en Android (service worker e íconos); grupos con la semana del grupo (esfuerzo, tabla que se reinicia cada lunes, puntajes opcionales); explorar el banco y modo práctica del tutor. Probado en el demo y contra un Postgres local. | Construida. Falta que Diego la monte: `05` y `02` en Supabase, archivos en GitHub y la prueba con una cuenta de prueba |
| 7. Uso real y ajuste | Después | Con la estudiante practicando: revisar qué muestran los datos, afinar reglas por paquete y corregir lo que aparezca. | Pendiente |
| 8. Mejoras | Cuando haga falta | Las de la lista de abajo, según lo que pida el uso. | Abierta |

## Lo que hay que confirmar con Diego

- ¿La estudiante ya entró y empezó a practicar?
- ¿Cuál de los dos días presenta el examen, el 26 o el 27 de octubre de 2026? (Programa: Artes Plásticas; está inscrita en la convocatoria 2027-1.)
- ¿Ya cargó `paquete-003`, `paquete-004` y `paquete-005` en la app real? (`paquete-002` quedó cargado el 4-oct-2026.)
- ¿Cotejó el fragmento de Barba Jacob (`P004-T03`) con una edición impresa?
- ¿La configuración de la base de datos sigue siendo la de fábrica (`content/base.json`)? Importa para la 1.1.0: `logica-base.json` reemplaza la clave `categorias` con los textos de fábrica de los cuatro niveles de lectura.
- ¿Ya hizo los tres pasos de la 1.1.0 (SQL, GitHub, paquetes de lógica)? Están en el `README.md`, en «Pasar de la 1.0.0 a la 1.1.0».
- ¿Resolvió los problemas de lógica en papel antes de cargarlos? Las respuestas están comprobadas con código; la claridad de los enunciados, no.

## Observaciones de la revisión del código

Salen de leer el código de la versión 1.0.0 el 4-oct-2026. No se han comprobado con la app en uso; antes de corregir cualquiera, conviene reproducirla.

### Afectan el aprendizaje

1. **El banco es muy pequeño.** (Resuelto con los paquetes 002 a 005, una vez cargados: 150 preguntas. En la prueba sobre el demo, los simulacros inicial, avanzado y experto salieron con dificultad media de 1,83, 2,02 y 2,28.) Con 30 preguntas, la regla de no repetir en 30 días no se puede cumplir: el relleno al azar devuelve preguntas vistas hace poco. Los tres niveles de simulacro usan las mismas 30 preguntas, con 65, 68 y 66 minutos. Se resuelve con contenido, no con código.
2. **La matriz tiene huecos.** No hay preguntas fáciles de nivel inferencial, crítico ni de cohesión. Con dominio bajo en esos niveles, la app busca dificultad 1 y no la encuentra; entrega dificultad 2 o 3. Resuelto el 4-oct-2026 con la carga de `paquete-002`, que trae 12 preguntas fáciles en esos tres niveles.
3. **El simulacro no equilibra los niveles.** Elige lecturas completas por dificultad promedio, sin mirar la distribución 20/35/30/15. El texto del panel del tutor dice que la columna «Meta» es el peso de cada nivel «en retos y simulacros»; hoy solo vale para los retos. Además, la última lectura de un simulacro puede quedar recortada.
4. **Las preguntas en blanco de un simulacro cuentan como falladas** para el dominio, para el repaso y para la lista «Preguntas que más falla». Un simulacro que se quedó sin tiempo puede hundir el dominio y llenar el repaso de preguntas que ella nunca leyó.

### Afectan la experiencia

5. **Posible inversión al plegar la lectura en celular.** En `pintarPregunta` y `pintarSim` se llama `LE.lecturaHTML(t, !mismaLectura)`: en la primera pregunta de una lectura, el texto aparece plegado con el botón «Mostrar lectura completa»; en las siguientes preguntas de la misma lectura aparece completo, encima de la pregunta. Lo esperable sería al revés. Solo se nota en pantallas de menos de 960 px. Hay que verlo en un celular antes de decidir.
6. **Un simulacro cerrado a medias se puede perder.** Las respuestas viven solo en el navegador hasta la entrega. Si ella cierra la app y vuelve después de vencido el tiempo, el simulacro queda como abandonado: sin puntaje, sin XP y fuera del historial. Con la app abierta, la entrega automática sí funciona.
7. **Recargar un paquete repite su novedad.**
8. **La entrega tardía se acepta.** `entregar_simulacro` calcula `tarde`, pero no rechaza ni recorta nada y la interfaz no lo muestra. En el uso normal el navegador entrega al llegar a cero.
9. ~~**La estudiante no puede cambiar su contraseña.** Tampoco se pueden crear estudiantes desde la app: se hace en Supabase.~~ Resuelto en la 1.2.0.
10. **Los textos discontinuos son solo texto.** No hay soporte para imágenes, caricaturas ni gráficas reales, que el examen sí usa.
11. **Sin conexión, la app no abre.** Desde la 1.2.0 hay service worker, pero solo muestra una página que explica que no hay conexión; no guarda retos para hacerlos sin internet.

### Menores

12. La librería de Supabase se carga desde jsDelivr sin versión fija (`@supabase/supabase-js@2`). Una actualización o una caída del CDN afectaría la app.
13. ~~`rachas(uid)` no comprueba permisos como las demás funciones.~~ Resuelto en la 1.2.0: solo la propia persona, el tutor o alguien de su mismo grupo.
14. `NOMBRE_TUTOR` está en `js/config.js` y no se usa en ninguna parte.
15. Un reto que se abandona sin responder nada deja una sesión abierta en la base de datos. No afecta estadísticas.
16. Varios textos de la interfaz están en femenino (ver `06-diseno-y-voz.md`).
17. El demo solo incluye `paquete-001`, aunque se carguen más paquetes en la app real. (Resuelto en la 1.1.0: `construir_demo.py` incluye todos los paquetes de `content/`. También desapareció el `">` suelto del demo.)
18. En celular, la barra de navegación no bajaba al borde inferior en los navegadores donde `backdrop-filter` crea un contenedor para los elementos fijos (Chrome, y Safari reciente): quedaba arriba, sobre el nombre de la app. (Resuelto en la 1.1.0. Al publicar, la estudiante verá la navegación abajo.)

## Mejoras posibles

Son ideas, no compromisos. Están ordenadas por lo que más le sirve a la preparación de la estudiante.

### Contenido

- Paquetes 002 a 005, hasta llegar a 150 preguntas, empezando por los huecos de la matriz.
- Lecturas más largas y más densas, cercanas a la prosa del examen.
- Una pasada de revisión de `paquete-001` con los criterios de `05`.

### Método

- **Simulacro equilibrado por nivel**, y que nunca recorte una lectura.
- **No contar las preguntas en blanco** del simulacro como falladas para dominio y repaso, o contarlas aparte.
- **Etiqueta del tipo de error en cada distractor** (extrapolación, plausible pero ajeno, contradicción, dato de otra fila), para que el diagnóstico diga cómo se equivoca y no solo en qué nivel. En Lógica ya existe (campo `errores` de cada pregunta); para Lectura habría que escribir los tipos y anotar las 150 preguntas. Las funciones y las pantallas (cuaderno de errores, perfil de errores) ya admiten cualquier componente.
- **Tiempo de lectura separado del tiempo de respuesta**, para ver si el problema es de comprensión o de velocidad.
- **Puntaje estimado en la escala del examen**, con todas las advertencias del caso.
- **Meta semanal** visible en el inicio (por ejemplo, cinco días con práctica).
- **Plan por fases** hacia la fecha del examen: la app sugiere qué toca esta semana.
- **Glosario personal**: palabras que no conocía, tomadas de las lecturas.
- **Misiones con lectura recomendada**, que estaba en la idea original.

### Tutor

- **Informe semanal** en una pantalla, listo para conversar con la estudiante.
- **Editor de preguntas** en el panel: corregir o desactivar una sin armar un paquete.
- **Notas privadas del tutor** sobre la estudiante.
- **Respuesta de la estudiante** a un mensaje, aunque sea una reacción.
- **Alertas nuevas**: simulacro muy por debajo del anterior, racha a punto de romperse, misión sin empezar en varios días.

### Experiencia

- Corregir el plegado de la lectura en celular, si se confirma.
- Guardar las respuestas del simulacro en el servidor a medida que se marcan.
- Subrayar o resaltar en la lectura.
- Recordatorio diario.
- Cambio de contraseña desde el perfil.
- Imágenes en las lecturas.
- Funcionamiento sin conexión para retos ya descargados.

### Técnica

- Fijar la versión de `supabase-js` o alojarla junto a la app.
- Un script que suba la versión en los tres sitios de una vez.
- Que `tools/construir_demo.py` incluya todos los `content/paquete-*.json`. (Hecho en la 1.1.0.)
- Automatizar el recorrido de pruebas del demo. (Hecho en la 1.1.0: `tools/pruebas/`.)

### Fuera de alcance por decisión

- ~~Tabla de posiciones entre estudiantes.~~ Desde la 1.2.0 existe dentro de los grupos, medida por esfuerzo y reiniciada cada lunes (decisión de Diego del 11-nov-2026). Sigue fuera de alcance una tabla general de todos los estudiantes.

(Razonamiento Lógico estuvo en esta lista hasta el 4-oct-2026.)

## Cómo elegir qué sigue

Tres preguntas, en este orden:

1. ¿Tiene la estudiante suficientes preguntas buenas para las semanas que faltan? Si no, eso va primero.
2. ¿Hay algo que le esté estorbando al practicar? Lo que ella o Diego noten en el uso pesa más que cualquier idea de esta lista.
3. ¿Qué dato le falta a Diego para acompañarla mejor?

---

## Razonamiento Lógico: pendientes y observaciones (versión 1.1.0)

### Para montar la 1.1.0

1. Supabase: ejecutar `04_razonamiento_logico.sql` y después `02_funciones.sql`.
2. GitHub: subir los archivos de la carpeta.
3. App, como tutor: cargar `logica-base`, `logica-001` y `logica-002`.

Antes del paso 1 conviene exportar a CSV las tablas de progreso, como dice `07`. Si después del paso 1 algo de Lectura fallara, está `supabase/respaldo/volver_a_1.0.0.sql`.

### Observaciones

Salen de construir y probar la 1.1.0. No se han visto con la estudiante usando la app.

1. **El banco de lógica es justo.** Con 109 preguntas, un simulacro avanzado (40) usa más de un tercio del banco, y Patrones solo tiene 20. La regla que prefiere lo no visto en 21 días ayuda, pero dos simulacros avanzados en la misma semana compartirán preguntas. Lo primero es ampliar: ver `05`.
2. **Nadie más ha resuelto los problemas.** Las respuestas se comprobaron con código y los enunciados se releyeron, pero falta el lector que no sabe la respuesta.
3. **Un reto por técnica es corto.** Cada técnica tiene 4 a 6 preguntas: «Practicar esta técnica» puede traer 4, y a la segunda vez serán las mismas. Sirve para repasar justo después de leer la ficha; no reemplaza un banco más grande.
4. **El reto de repaso no espera.** Deja reintentar un error un minuto después de haber leído la solución. Es útil si ella rehace el procedimiento; si solo recuerda la letra, infla el contador de «errores corregidos». Si se nota, se puede exigir un tiempo mínimo desde el fallo (en `seleccionar_preguntas`).
5. **Las preguntas de una situación pueden salir sueltas** en un reto o en un simulacro de lógica: la situación siempre se muestra completa, pero no llegan todas sus preguntas. Están escritas para no depender unas de otras.
6. **Las preguntas en blanco de un simulacro quedan en el cuaderno** como pendientes sin diagnóstico (misma decisión que la observación 4 de lectura).
7. **Pedir la pista casi no cuesta.** Solo quita 5 XP de bono. Es deliberado, para que la use; si se vuelve muleta, el dato está en `respuestas.pista` y el tutor todavía no lo ve en ninguna pantalla.
8. **`logica-base` reemplaza `categorias`** con los textos de fábrica de lectura. Si se habían personalizado, hay que volver a cargarlos.
9. **Las figuras son planas.** Los arreglos de cubos se dan como plano con alturas, no en perspectiva como en el examen. Falta entrenar la lectura de dibujos en tres dimensiones.
10. **Los textos siguen en femenino** también en Lógica («Descifradora», «Ojo de arquitecta», «lo mínimo para estar segura»).

### Mejoras posibles para Lógica

- **Más problemas**, primero de Patrones y de las técnicas que más falle, y situaciones con figura en perspectiva.
- **Mostrar al tutor cuánto usa la pista** y en qué técnicas.
- **Variantes de una pregunta** con otros números, para que repetir una técnica no sea repetir las mismas cuatro preguntas.
- **Misión por técnica** desde el panel del tutor (hoy una misión es mezclada o por nivel).
- **Simulacro completo**: 80 preguntas en 3 horas, los dos componentes seguidos, con la recomendación de tiempos del análisis del examen.
- **Tiempo por pregunta en los retos de lógica**, comparado con los 2 min 15 s del examen.
- **Tipos de error para Lectura**, para que el cuaderno y el perfil de errores sirvan a los dos componentes.
- **Hoja de borrador** dentro de la app para quien resuelve en el celular sin papel.

## Cuentas, grupos e instalación: pendientes y observaciones (versión 1.2.0)

### Para montar la 1.2.0

1. Supabase: ejecutar `05_usuarios_y_grupos.sql` y después `02_funciones.sql`.
2. GitHub: subir los archivos de la carpeta (incluye `sw.js` e `iconos/`, nuevos).
3. Prueba: crear desde Personas una cuenta con un correo de prueba, entrar con ella en otro navegador, cambiar la contraseña e instalar la app en un celular. Después, desactivarla.

### Observaciones

1. **Crear cuentas depende de la tabla `auth.users` de Supabase.** Se probó contra una imitación con las mismas columnas, no contra Supabase. Es lo primero que hay que confirmar con la prueba del paso 3. Si falla, el camino manual sigue sirviendo y el mensaje de error dice qué cambió.
2. **En iPhone, la app instalada pide entrar otra vez.** Safari y la app instalada no comparten la sesión. Las instrucciones lo avisan.
3. **iPhone no tiene botón de instalar.** Solo Android/Chrome ofrece su instalador; en iPhone son los pasos de Compartir → Agregar a inicio, y sus nombres cambian un poco entre versiones de iOS.
4. **La contraseña temporal viaja por WhatsApp.** Es temporal y la app obliga a cambiarla en el primer ingreso; si alguien tarda en entrar, Personas lo muestra («Aún no elige su contraseña») y se puede generar otra.
5. **El tutor no puede crear otro tutor desde la app.** Se crea como estudiante y se cambia el rol en SQL. Todo tutor ve a todos.
6. **La semana del grupo cuenta XP, y el XP crece con la dificultad.** Quien responde preguntas difíciles gana más por acierto. Si en algún grupo eso se siente injusto, la alternativa es ordenar por días con práctica.
7. **«Explorar el banco» trae el banco completo con las claves** (solo el tutor puede leerlo). Con varios miles de preguntas convendría paginarlo.

### Mejoras posibles

- Tutores por grupo.
- Meta colectiva de la semana («entre todos, 20 días de práctica») como alternativa o complemento a la tabla.
- Reacciones a la actividad de un compañero (un aplauso), sin comentarios libres.
- Notificaciones al celular: mensajes del tutor, misión nueva, racha en peligro.
- Que el tutor vea en el detalle de cada estudiante si ya instaló la app y cuándo entró por última vez.
