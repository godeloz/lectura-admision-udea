# 01 · Propósito y decisiones

## Para quién es

- **La estudiante.** Una aspirante de 17 años que se prepara para el examen de admisión de la Universidad de Antioquia. Le gustan la música y la estética de los videojuegos; de ahí sale todo el lenguaje visual de la app. Hoy es una sola estudiante, pero la app está hecha para recibir más.
- **El tutor.** Diego Agudelo, administrador de la app y tutor de la estudiante. Necesita ver cuánto y cómo estudia, saber dónde falla e intervenir de manera que ella sienta que hay una persona acompañándola, no solo un programa.

## Lo que se pidió

El encargo original, del 26 de septiembre de 2026, en resumen:

- Una app enfocada únicamente en comprensión de lectura. El examen también evalúa Razonamiento Lógico, pero eso quedó fuera a propósito.
- Gamificada: retos diarios de 5, 10 o 15 preguntas; insignias y distinciones que se acumulan en el perfil; registro de las horas dedicadas.
- Un modo simulacro con tres niveles (inicial de 30 preguntas, avanzado de 40, experto de 50), con tiempo límite y diagnóstico de aciertos y errores al terminar.
- Un panel de tutor para ver avances y uso diario, con herramientas reales de intervención.
- Publicada en GitHub Pages con Supabase: la estudiante entra con la contraseña que el tutor le asigna.
- Diseño limpio, con una paleta vibrante que le hable a alguien de 17 años.
- Después se añadió una condición: que la app pueda seguir recibiendo actualizaciones de diseño, funciones, gamificación y preguntas sin empezar de cero.

## Decisiones tomadas y su razón

| Decisión | Razón |
|---|---|
| Solo Competencia Lectora (hasta la 1.0.0) | Petición expresa del encargo original. El 4-oct-2026 Diego pidió sumar Razonamiento Lógico: ver la sección del final. |
| Cuatro niveles de pregunta: literal, inferencial, crítico, cohesión | Son los cuatro niveles con los que el análisis del examen describe la prueba (ver `02`). |
| Distribución 20 / 35 / 30 / 15 | El examen reciente carga más en lo inferencial y lo crítico que en lo literal. |
| Varias estudiantes desde el modelo de datos, aunque hoy haya una | Agregar otra es crear su usuario en Supabase, no migrar nada. |
| El avance se compara solo contra el propio historial | Decisión de Diego. No hay tabla de posiciones. |
| Intervención del tutor manual y automática | Decisión de Diego («ambos»): él escribe cuando quiere y además el sistema le avisa de inactividad o de caídas de rendimiento. |
| Dificultad adaptativa en vez de que ella elija la dificultad | Ella elige cuánto tiempo tiene (5, 10 o 15 preguntas); el sistema elige qué tan difícil según su dominio en cada nivel. |
| Repaso espaciado de las preguntas falladas | Para que el error se convierta en aprendizaje y no solo en un punto perdido. |
| Explicación inmediata en los retos, ninguna durante el simulacro | El reto es para aprender; el simulacro, para medirse en condiciones de examen. |
| El registro público está cerrado | Solo existen las cuentas que el tutor crea en Supabase. La estudiante escribe un usuario corto (`nombre`), y la app arma el correo `nombre@entrelineas.app`, que es un dominio inventado. |
| La lógica de calificación vive en funciones SQL | Para que no se pueda hacer trampa desde el navegador y para que la clave de respuestas nunca viaje antes de tiempo. |
| El reloj del simulacro es del servidor | No se pausa ni se reinicia recargando la página. |
| Preguntas, insignias y ajustes se cargan con paquetes JSON | Diego actualiza la app desde el panel de tutor, sin tocar código ni SQL. |
| Modo demo con datos locales | Permite probar la app completa con doble clic en `demo.html`, sin servidor ni Supabase. |
| Aviso de versión nueva | Quien tenga la app abierta se entera de que hay cambios y actualiza con un botón. |
| Sin frameworks ni proceso de compilación | La app se publica arrastrando archivos a GitHub. Cualquier herramienta de compilación rompería eso. |
| Metáfora musical: Canción, EP, Álbum, ecualizador, rangos de disco | Viene de los gustos de la estudiante. |
| La lectura se muestra sobre «papel» claro con tipografía de libro | La parte de juego es oscura y vibrante; la lectura es seria y cómoda. No se sacrifica comprensión por estética. |

## Lo que se descartó o se dejó para después

- **Razonamiento Lógico.** Quedó fuera en la 1.0.0. Entró en la 1.1.0 (4-oct-2026).
- **Tabla de posiciones entre estudiantes.** Queda abierta la puerta para cuando haya más de una.
- **Conversión del puntaje a la escala estandarizada de la UdeA.** Se mencionó como opcional en el diseño y no se construyó. El diagnóstico compara el porcentaje de aciertos contra porcentajes de referencia y aclara que es una aproximación.
- **Misiones de tipo «lectura recomendada».** Hoy una misión es siempre un reto de preguntas (de un nivel o mezclado).
- **Segunda versión «combo-lector».** Existió otra versión de la app, hecha en una sesión anterior. El 26-sep-2026 se compararon las dos y se eligió Entrelíneas: tiene dificultad adaptativa, repaso espaciado, modo demo, registro cerrado, gamificación configurable, sistema de versiones y paquetes de contenido. `combo-lector` traía más preguntas (57 contra 30) pero ninguna de esas ventajas. Su esquema se eliminó del proyecto de Supabase antes de instalar el de Entrelíneas.

## Qué significa que la app «funcione»

Estos criterios sirven para juzgar cualquier mejora que se proponga:

1. La estudiante practica casi todos los días, aunque sea una Canción de cinco preguntas.
2. Su dominio sube en los niveles donde empezó más floja.
3. Llega al examen habiendo hecho varios simulacros avanzados completos, con el ritmo de la prueba interiorizado y sin dejar preguntas en blanco.
4. Diego puede saber en un minuto cómo va y qué decirle.
5. Diego puede agregar preguntas y ajustar la gamificación sin ayuda técnica.

---

## Razonamiento Lógico (versión 1.1.0, 4-oct-2026)

### Lo que se pidió

Agregar el otro componente del examen, con estas condiciones de Diego:

- No mezclar los retos diarios de lectura con los de razonamiento lógico. La estudiante elige qué retos asume.
- Los dos componentes hacen parte de la misma app, pero se navegan por separado.
- Puede haber un simulacro solo de razonamiento lógico.
- Puede haber insignias nuevas para este componente.
- Pensar una lógica que le permita a la estudiante **entender sus errores y aprender los procedimientos** matemáticos y lógicos que necesita para pasar el examen.

### Decisiones tomadas y su razón

| Decisión | Razón |
|---|---|
| Navegación: Lectura · Lógica · Simulacro · Mensajes · Perfil | Cada componente tiene su portada con sus retos, su ecualizador y su simulacro. «Inicio» pasó a llamarse «Lectura». La app recuerda en cuál estuvo por última vez y vuelve ahí. |
| XP, rango, racha, tiempo de estudio y mensajes compartidos | Son de la persona, no de la materia. Un día de lógica mantiene la racha igual que uno de lectura. |
| Dominio, simulacros, técnicas e insignias propias de Lógica | Son los que dicen cómo va en ese componente. |
| Cuatro niveles: Deducción, Proporciones, Patrones y Geometría | Salen de los temas de la guía de la UdeA (1.1 a 1.4). La lectura de cuadros y gráficas (1.5) quedó como una técnica dentro de Proporciones, porque casi siempre termina en un porcentaje. Cuatro niveles conservan el ecualizador de cuatro columnas. |
| Cada opción incorrecta lleva el tipo de error que la produce | Es la respuesta a «entender sus errores»: la app no dice solo «era la C», dice qué hizo quien marcó la B. Seis tipos: leyó otra pregunta, planteamiento, regla equivocada, a mitad de camino, cuenta y salto lógico. |
| Solución en pasos numerados, no en un párrafo | Un procedimiento se aprende viendo los movimientos uno por uno. |
| Pista opcional antes de responder | Lo más difícil de un problema es saber por dónde empezar. La pista da el primer movimiento. Cuesta el bono de ritmo, no el acierto: pedir ayuda no se castiga. |
| Caja de herramientas: una ficha por técnica | El examen repite un repertorio corto de procedimientos. Cada pregunta enlaza a la suya y desde la ficha se practica solo esa técnica. |
| Cuaderno de errores y reto de repaso | Lo que falla queda a la vista, agrupado por técnica, con su opción, el diagnóstico y la solución. El repaso espaciado de los retos sigue funcionando; el reto de repaso deja atacar los errores cuando ella quiera. |
| Nombres de los retos: Riff, Solo y Jam | Siguen la metáfora musical sin repetir Canción, EP y Álbum. Acento visual cian (Lectura usa rosa). |
| Lógica aparece solo cuando el tutor carga `logica-base` | Mientras tanto la app se ve como la 1.0.0. Permite publicar el código sin que la estudiante vea una sección vacía. |
| Figuras en SVG y cuadros en el texto | El examen de lógica depende de figuras y tablas. El SVG llega de la base de datos y la app lo reconstruye dejando pasar solo formas y textos. |
| Simulacro de lógica con cupo por nivel | En lectura el simulacro toma lecturas completas; en lógica reparte las preguntas entre los cuatro niveles según la distribución. |
| Margen de 180 segundos para el bono de ritmo en lógica | Plantear y calcular toma más que responder una pregunta de lectura. El examen da 2 min 15 s en promedio. |
| Las preguntas se generan con un script que comprueba las respuestas | En lógica una clave equivocada enseña un error. `tools/generar_logica.py` verifica con código cada resultado numérico y cada acertijo. |

### Lo que se dejó para después

- **Simulacro completo de 80 preguntas en 3 horas** (los dos componentes seguidos). Hoy cada componente tiene el suyo.
- **Cuaderno de errores para Lectura.** La función del servidor ya acepta el componente; falta darle a las preguntas de lectura su tipo de error por opción.
- **Figuras en tres dimensiones** (arreglos de cubos en perspectiva, dobleces). Se usan planos con alturas y descripciones.
- **Variantes de una misma pregunta** con otros números, para practicar sin memorizar.
