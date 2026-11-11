# 02 · El examen y la metodología

## El examen de admisión de la UdeA

Resumen de `Examen de Admisión UdeA.md`, que está en el proyecto de Claude. Las cifras de aspirantes y de puntajes de corte cambian cada semestre: antes de usarlas en la app conviene verificarlas.

| | |
|---|---|
| Estructura | 80 preguntas de opción múltiple con única respuesta (A, B, C, D) |
| Componentes | 40 de Razonamiento Lógico y 40 de Competencia Lectora, con el mismo peso |
| Duración | 3 horas continuas |
| Ritmo | 2 minutos y 15 segundos por pregunta en promedio |
| Penalización | No hay. Una respuesta en blanco vale lo mismo que una incorrecta |
| Aplicación | Semestral (mayo y octubre o noviembre), en varias jornadas |
| Calificación | El puntaje bruto de cada componente se estandariza con la media y la desviación de quienes presentaron esa jornada. El resultado final va sobre 100 |
| Mínimo para ser elegible | 53 sobre 100 en Medellín, 50 en las sedes regionales |
| Puntaje de corte | El del último admitido de cada programa. Medicina ronda 85 a 87; Derecho, 65 a 73; los programas regionales, 50 a 63 (datos de 2024-2) |

Tres rasgos del examen determinan el diseño de la app:

1. **El tiempo es el factor que más pesa.** Leer un texto largo consume buena parte del margen, y por pregunta de lectura quedan en la práctica menos de 90 segundos.
2. **Predominan lo inferencial y lo crítico** sobre la recuperación literal. Los distractores son finos: extrapolaciones que el texto no sostiene, afirmaciones plausibles pero ajenas a la intención del autor y contradicciones sutiles.
3. **Dejar preguntas sin responder castiga mucho**, porque no hay descuento por error. La app lo repite en el simulacro y en el diagnóstico.

En aciertos brutos, el análisis estima que Medicina y los programas con corte sobre 85 exigen entre 34 y 37 aciertos de 40 en lectura, y los programas intermedios, entre 28 y 33. De ahí salen las referencias que muestra el diagnóstico (85 %, 70 % y 55 %).

### Qué evalúa Competencia Lectora

El examen trabaja con dos o más lecturas de distinta tipología: ensayos filosóficos, divulgación científica, fragmentos literarios y textos discontinuos como caricaturas e infografías. Las preguntas se mueven en cuatro niveles, que son las cuatro categorías de la app:

| Categoría en la app | Qué pide | Color |
|---|---|---|
| `literal` | Datos explícitos, secuencias temporales directas, tesis manifiestas, causas que el texto dice de frente | cian |
| `inferencial` | Sentido global, premisas implícitas, propósito del autor, significado de una palabra en contexto, figuras retóricas (metáfora, ironía), correferencia | rosa |
| `critico` | Consistencia de los argumentos, sesgos, comparación entre dos textos o posturas, contexto pragmático de la lectura | amarillo |
| `cohesion` | Función de los conectores (causales, consecutivos, adversativos, concesivos), anáforas y catáforas, valor de la puntuación | menta |

### Cómo pregunta el examen

Patrones observados en el simulacro virtual del proyecto (`simulacro-udea-b.md`). Son la referencia de estilo para escribir preguntas nuevas:

- Trasladar una actitud a otra situación: «Una actitud similar a la de Caro se puede apreciar también en…».
- Leer la ironía de unas comillas: qué significa una expresión entrecomillada dentro del párrafo.
- Identificar a quién se refiere una expresión: «El adversario obtuso es…».
- Nombrar una figura retórica: sinécdoque, metáfora, metonimia, analogía.
- Sinónimo en contexto de una palabra culta: «conculcar», «sediciosas».
- Resumir el pensamiento del autor en una frase o elegir la cita que mejor lo encierra.
- Preguntas en negativo: «Del texto se puede deducir MENOS que…».
- Completar un enunciado partido en dos: «Por un lado ___ por el otro ___».
- Detectar lo que el autor presupone del lector: mencionar «La Violencia» sin explicarla da por hecho un conocimiento enciclopédico.
- Clasificar elementos del texto en dos grupos, donde una sola palabra cambiada invalida la opción.
- Deducir el sentido de un neologismo por sus partes y por el contexto: «heliomítica».

Los textos de ese simulacro van de un párrafo denso de unas cien palabras a tres párrafos largos, con prosa académica y vocabulario exigente.

---

## El método que la app pone en práctica

Entrelíneas es más que un banco de preguntas: detrás hay un método de estudio con siete piezas. Cualquier cambio debería reforzar alguna de ellas, o al menos no debilitarla.

### 1. Poco, pero todos los días

La unidad de trabajo es el reto corto. La estudiante no elige dificultad sino tiempo disponible: Canción (5 preguntas, unos 8 minutos), EP (10, unos 16) o Álbum (15, unos 25). La racha, el mapa de calor de las últimas cuatro semanas y el mensaje del inicio empujan hacia la constancia. Después de 20 minutos de práctica en el día, la app dice que la meta está cumplida y que lo demás es extra.

### 2. Cada pregunta enseña

En los retos, después de confirmar la respuesta aparece de inmediato si acertó, cuál era la correcta y una explicación. La explicación tiene una exigencia propia: decir por qué la correcta lo es y en qué falla el distractor más tentador. Ahí está el valor pedagógico del banco.

### 3. La dificultad se ajusta sola, nivel por nivel

La app lleva un puntaje de dominio de 0 a 100 en cada una de las cuatro categorías, calculado con las últimas 30 respuestas y ponderado por dificultad. Con dominio bajo en un nivel, recibe preguntas fáciles de ese nivel; cuando sube, se las ponen más difíciles. Puede estar en preguntas difíciles de literal y fáciles de crítico al mismo tiempo.

### 4. Lo que se falla, vuelve

Una quinta parte de cada reto se reserva para preguntas cuya última respuesta fue incorrecta, desde el día siguiente. Las que ya respondió no se repiten antes de 30 días, mientras el banco alcance.

### 5. Medirse en serio, y entender el resultado

El simulacro reproduce las condiciones del examen: tiempo límite con reloj del servidor, lecturas completas con todas sus preguntas, ninguna explicación hasta el final, posibilidad de marcar preguntas para revisar y entrega automática cuando el tiempo se acaba. El diagnóstico muestra el porcentaje global, el desglose por nivel, la comparación con puntajes de corte de referencia y la revisión pregunta por pregunta, con la lectura a un toque. Desde ahí se puede saltar a practicar diez preguntas del nivel más débil.

### 6. Hay una persona al otro lado

El tutor ve racha, días activos, minutos, dominio, evolución semanal, simulacros y las preguntas que más falla. El sistema le avisa de dos situaciones (tres días sin practicar; caída de 15 puntos o más en un nivel) con un mensaje sugerido que él edita. Puede enviar mensajes libres, misiones (retos de 5, 10 o 15 preguntas, mezcladas o de un nivel) y comentarios sobre una pregunta concreta, que le llegan a ella con la pregunta citada. Las misiones dan XP extra e insignias propias: seguir al tutor también cuenta en el juego.

### 7. El juego sirve al hábito

- El XP premia la dificultad y un ritmo sano (entre 5 segundos y 2 minutos por pregunta). No premia la velocidad pura ni castiga pensar.
- Fallar también suma un poco: 2 XP por intentarlo.
- Las insignias reconocen constancia (rachas, horas), volumen (aciertos, retos), dominio por nivel, simulacros, misiones y la remontada (un reto de 80 % o más justo después de uno por debajo de 50 %).
- No hay vidas, castigos ni comparación con otras personas.

### El ciclo completo

```
Reto diario ──> sube o baja el dominio por nivel ──> el siguiente reto se ajusta
     │                                                        ▲
     ▼                                                        │
Simulacro ──> diagnóstico por nivel ──> práctica dirigida ────┤
     │                                                        │
     ▼                                                        │
El tutor ve datos y alertas ──> mensaje, misión o comentario ─┘
```

---

## Las fases de preparación y cómo se viven en la app

El análisis del examen propone una ruta de 14 semanas en tres fases. La app no impone fases, pero se presta para recorrerlas. Esta correspondencia es una guía de uso para el tutor, no algo programado:

| Fase | Semanas | Qué busca | Cómo se hace en Entrelíneas |
|---|---|---|---|
| 1. Diagnóstico y nivelación | 1 a 4 | Saber dónde está y crear el hábito | Simulacro **inicial** para tener punto de partida. Retos diarios cortos (Canción o EP). El tutor mira el ecualizador para ver el nivel más bajo y envía la primera misión dirigida. |
| 2. Desarrollo y agilidad | 5 a 10 | Subir el dominio y aprender a descartar distractores | EP o Álbum diarios. Misiones por nivel según las alertas de caída. Comentarios del tutor sobre las preguntas más falladas. Simulacro **avanzado** cada dos o tres semanas. |
| 3. Simulación real y calibración | 11 a 14 | Ritmo de examen y cero preguntas en blanco | Simulacro **avanzado** semanal, y **experto** para ganar holgura de tiempo. Revisión del diagnóstico después de cada uno. Retos cortos entre simulacros para mantener la racha. |

Para la tercera fase hace falta un banco grande. Con 30 preguntas, un simulacro avanzado usa todo el banco y repite siempre las mismas. Por eso ampliar el contenido es la primera prioridad (ver `08-estado-fases-y-pendientes.md`).

Desde la 1.1.0 la app cubre los dos componentes, cada uno con su simulacro. El simulacro completo de 80 preguntas en 3 horas todavía se hace por fuera, o encadenando un simulacro avanzado de lectura (90 minutos) y uno avanzado de lógica (90 minutos). El simulacro avanzado da 90 minutos para 40 preguntas, que es el ritmo promedio del examen (2 minutos y 15 segundos por pregunta). El análisis recomienda algo más exigente para el día de la prueba: resolver Competencia Lectora en los primeros 80 minutos y dejar el resto para Razonamiento Lógico. Si se quiere entrenar ese ritmo, basta cambiar los minutos del nivel avanzado con un paquete de configuración.

---

## Razonamiento Lógico (desde la versión 1.1.0)

### Qué evalúa el examen

La guía de la UdeA (`Cuadernillo-examen-udea.pdf`, páginas 1 a 17) insiste en que la prueba busca competencias, no conocimiento matemático específico, y que no pretende «adiestrar». Sus temas:

| Tema de la guía | Qué incluye | Nivel en la app |
|---|---|---|
| 1.1 Razonamiento lógico | Inferencias sobre un proceso real con apoyo gráfico; conectivas, condicional, condiciones suficientes y necesarias, expresiones cuantificadas; control de variables; posibilidades lógicas | `deductivo` (Deducción, violeta) |
| 1.2 Esquema de proporcionalidad | Relaciones directas e inversas, fracciones, porcentajes, probabilidad simple | `proporcional` (Proporciones, amarillo) |
| 1.3 Razonamiento abstracto | Leyes de formación, operadores no convencionales, claves, series | `abstracto` (Patrones, rosa) |
| 1.4 Razonamiento geométrico | Áreas y perímetros, relaciones entre volúmenes, rotaciones y simetrías, ensamble de figuras | `geometrico` (Geometría, menta) |
| 1.5 Información gráfica | Histogramas, cuadros de doble entrada, gráficas | Técnica `tablas`, dentro de Proporciones |

Rasgos que determinan el diseño:

1. **La dificultad está en formalizar, no en calcular.** Los problemas son de aritmética sencilla; lo que cuesta es traducir el enunciado, reconocer de qué tipo es y no caer en la opción que sale de un procedimiento casi correcto.
2. **Los distractores son resultados de errores previsibles**: la cuenta a medias, el porcentaje sobre la base equivocada, la regla de tres directa donde era inversa, afirmar el consecuente.
3. **Muchas preguntas comparten una situación** con un cuadro o una figura (en la guía: un sistema de riego, un cuadro de fungicidas, arreglos de cubos, un histograma).
4. **No se permite calculadora** y el tiempo promedio es de 2 minutos y 15 segundos por pregunta. La táctica recomendada es dar dos vueltas: primero lo directo, después lo largo.

### El método de Lógica: aprender del error

Las siete piezas del método de lectura siguen valiendo (poco pero diario, dificultad que se ajusta, repaso de lo fallado, medirse en serio, tutor presente, juego al servicio del hábito). Lógica añade una octava y cambia cómo se vive la segunda.

**8. El error se nombra y el procedimiento se muestra.** Después de cada respuesta de un reto:

- Si falló, **qué pasó**: una nota escrita para la opción que marcó («tomaste la cuarta parte del total; el enunciado dice de lo que le quedaba») y el tipo de error.
- **La solución paso a paso**, siempre. Si acertó aparece plegada, con la invitación a comparar su camino.
- **La idea clave** en una frase.
- **El enlace a la ficha de la técnica.**

Los seis tipos de error y lo que la app aconseja para cada uno:

| Tipo | Nombre que ve ella | Qué significa |
|---|---|---|
| `enunciado` | Leíste otra pregunta | Calculó bien algo que no era lo que pedían |
| `planteamiento` | Planteamiento | Tradujo mal el enunciado: confundió el todo con la parte, cruzó una proporción |
| `regla` | Regla equivocada | Usó un procedimiento que no aplica: sumó porcentajes, afirmó el consecuente |
| `incompleto` | A mitad de camino | Iba bien y paró un paso antes |
| `calculo` | Cuenta | El camino era correcto y falló una operación |
| `inferencia` | Salto lógico | Concluyó más de lo que las premisas permiten |

Con eso la app arma un **perfil de errores**: de sus últimos 60 fallos, cuántos son de cada tipo. Es lo que le dice a ella, y a Diego, si su problema es de lectura del enunciado, de procedimiento o de cuidado.

**Antes de responder, la pista.** Da el primer movimiento («Parte los números en tres zonas…») y nunca el resultado.

**La caja de herramientas.** 26 fichas, una por técnica: cuándo se usa, el procedimiento en pasos, un ejemplo resuelto y la trampa típica. Una técnica se considera dominada con 3 aciertos o más y al menos 75 % de aciertos. Desde cada ficha se lanza un reto solo de esa técnica.

**El cuaderno de errores.** Reúne las preguntas cuya última respuesta fue incorrecta, agrupadas por técnica. Cada una se abre con su enunciado, su opción, el diagnóstico y la solución. Tiene un botón para hacer un reto de repaso solo con esos errores, del más antiguo al más reciente. Una pregunta sale del cuaderno cuando la responde bien, y eso cuenta como «error corregido», que da insignias.

**El simulacro de lógica** no da pistas ni soluciones hasta el final. Su diagnóstico añade tres bloques al de lectura: cómo se equivocó (por tipo de error), qué técnicas repasar (con ficha y botón de práctica) y dónde se le fue el tiempo (preguntas de más de tres minutos y medio).

### El ciclo en Lógica

```
Reto de lógica ──> responde ──> acierta: compara su camino con los pasos
      ▲                    └──> falla: qué pasó + pasos + ficha de la técnica
      │                                   │
      │                                   ▼
      │                          cuaderno de errores ──> reto de repaso
      │                                   │
      └── repaso espaciado (20 %) <───────┘
```

### Cómo usarlo con la estudiante en las semanas que faltan

Guía para el tutor, no algo programado:

1. **Primera semana.** Simulacro inicial de lógica para tener punto de partida. Un Riff diario. Que lea la ficha de cada técnica que falle.
2. **Segunda semana.** Solo diario. Revisar con ella el perfil de errores: si domina «a mitad de camino» o «leíste otra pregunta», el hábito que hay que instalar es volver a leer la pregunta antes de marcar. Misiones por nivel según lo que muestre el ecualizador.
3. **Tercera semana.** Simulacro avanzado de lógica (40 preguntas en 90 minutos) y, otro día, el de lectura. Reto de repaso de errores entre simulacros. Practicar las dos vueltas.
