"""Genera content/base.json, content/paquete-001.json y supabase/03_carga_inicial.sql.
Ejecutar desde la carpeta raíz de la app:  python3 tools/generar_contenido.py
"""
import json, random, os

random.seed(7)
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

# ------------------------------------------------------------------ BASE
base = {
  "paquete": "base-v1",
  "config": {
    "distribucion": {"literal": 0.2, "inferencial": 0.35, "critico": 0.3, "cohesion": 0.15},
    "categorias": {
      "literal":     {"nombre": "Literal",     "color": "cian",     "descripcion": "Datos explícitos, secuencias y causas que el texto dice directamente."},
      "inferencial": {"nombre": "Inferencial", "color": "rosa",     "descripcion": "Sentido global, premisas implícitas, propósito del autor, figuras y palabras en contexto."},
      "critico":     {"nombre": "Crítico",     "color": "amarillo", "descripcion": "Solidez de los argumentos, sesgos y comparación entre textos."},
      "cohesion":    {"nombre": "Cohesión",    "color": "menta",    "descripcion": "Conectores, referencias entre palabras y valor de la puntuación."}
    },
    "retos": {
      "repaso": 0.2,
      "opciones": [
        {"n": 5,  "nombre": "Canción", "minutos": 8,  "descripcion": "Un calentamiento corto para no romper la racha."},
        {"n": 10, "nombre": "EP",      "minutos": 16, "descripcion": "La sesión de todos los días."},
        {"n": 15, "nombre": "Álbum",   "minutos": 25, "descripcion": "Para los días con tiempo y ganas."}
      ]
    },
    "simulacros": {
      "inicial":  {"nombre": "Inicial",  "preguntas": 30, "minutos": 65,  "dificultad": 1.6, "descripcion": "Textos más accesibles. Para medir el punto de partida."},
      "avanzado": {"nombre": "Avanzado", "preguntas": 40, "minutos": 90,  "dificultad": 2.1, "descripcion": "Igual al bloque de lectura del examen real: 40 preguntas."},
      "experto":  {"nombre": "Experto",  "preguntas": 50, "minutos": 110, "dificultad": 2.5, "descripcion": "Más preguntas y más difíciles, con el mismo ritmo por pregunta."}
    },
    "xp": {"por_acierto": 10, "por_intento": 2, "bono_ritmo": 5, "segundos_bono": 120,
           "reto_completo": 20, "reto_perfecto": 30, "mision": 40,
           "simulacro_acierto": 12, "simulacro_completo": 60},
    "rangos": [
      {"nombre": "Demo",          "xp": 0},
      {"nombre": "Maqueta",       "xp": 300},
      {"nombre": "Disco de oro",  "xp": 1000},
      {"nombre": "Platino",       "xp": 2500},
      {"nombre": "Diamante",      "xp": 5000},
      {"nombre": "Leyenda UdeA",  "xp": 9000}
    ],
    "referencias": [
      {"programa": "Medicina y programas de corte muy alto", "porcentaje": 85, "detalle": "34 a 37 aciertos de 40 en Competencia Lectora"},
      {"programa": "Derecho, Ingeniería Civil y programas intermedios", "porcentaje": 70, "detalle": "28 a 33 aciertos de 40"},
      {"programa": "Programas regionales", "porcentaje": 55, "detalle": "Referencia aproximada"}
    ],
    "alertas": {"dias_inactividad": 3, "caida_puntos": 15, "minimo_respuestas": 5},
    "avatares": ["🎧", "🎸", "🎹", "🥁", "🎤", "🎮", "👾", "🕹️", "🦊", "🐉", "🌙", "⚡", "🔮", "🪐", "🌈", "🦄"]
  },
  "insignias": [
    {"codigo": "primera-nota", "nombre": "Primera nota", "descripcion": "Respondiste tu primera pregunta.", "icono": "🎵", "color": "cian", "orden": 1, "regla": {"tipo": "respuestas", "valor": 1}},
    {"codigo": "racha-3", "nombre": "Tres en fila", "descripcion": "Tres días seguidos practicando.", "icono": "🔥", "color": "rosa", "orden": 10, "regla": {"tipo": "racha", "valor": 3}},
    {"codigo": "racha-7", "nombre": "Semana en loop", "descripcion": "Siete días seguidos practicando.", "icono": "🔁", "color": "rosa", "orden": 11, "regla": {"tipo": "racha", "valor": 7}},
    {"codigo": "racha-30", "nombre": "Mes sin pausa", "descripcion": "Treinta días seguidos practicando.", "icono": "📅", "color": "rosa", "orden": 12, "regla": {"tipo": "racha", "valor": 30}},
    {"codigo": "aciertos-50", "nombre": "50 aciertos", "descripcion": "Llevas 50 respuestas correctas.", "icono": "🎯", "color": "amarillo", "orden": 20, "regla": {"tipo": "aciertos", "valor": 50}},
    {"codigo": "aciertos-250", "nombre": "250 aciertos", "descripcion": "Llevas 250 respuestas correctas.", "icono": "💿", "color": "amarillo", "orden": 21, "regla": {"tipo": "aciertos", "valor": 250}},
    {"codigo": "aciertos-1000", "nombre": "Mil aciertos", "descripcion": "Llevas 1.000 respuestas correctas.", "icono": "🏆", "color": "amarillo", "orden": 22, "regla": {"tipo": "aciertos", "valor": 1000}},
    {"codigo": "retos-10", "nombre": "Diez retos", "descripcion": "Terminaste 10 retos diarios.", "icono": "🎶", "color": "cian", "orden": 30, "regla": {"tipo": "retos", "valor": 10}},
    {"codigo": "retos-50", "nombre": "Cincuenta retos", "descripcion": "Terminaste 50 retos diarios.", "icono": "📀", "color": "cian", "orden": 31, "regla": {"tipo": "retos", "valor": 50}},
    {"codigo": "ep-perfecto", "nombre": "EP perfecto", "descripcion": "Un reto de 10 preguntas sin un solo error.", "icono": "✨", "color": "menta", "orden": 40, "regla": {"tipo": "reto_perfecto", "valor": 10}},
    {"codigo": "album-perfecto", "nombre": "Álbum perfecto", "descripcion": "Un reto de 15 preguntas sin un solo error.", "icono": "💎", "color": "menta", "orden": 41, "regla": {"tipo": "reto_perfecto", "valor": 15}},
    {"codigo": "remontada", "nombre": "Remontada", "descripcion": "Un reto con 80 % o más justo después de uno por debajo de 50 %.", "icono": "🚀", "color": "violeta", "orden": 45, "regla": {"tipo": "remontada"}},
    {"codigo": "dominio-literal", "nombre": "Ojo de lince", "descripcion": "Dominio de 80 en el nivel literal.", "icono": "👁️", "color": "cian", "orden": 50, "regla": {"tipo": "dominio", "categoria": "literal", "valor": 80}},
    {"codigo": "dominio-inferencial", "nombre": "Entre líneas", "descripcion": "Dominio de 80 en el nivel inferencial.", "icono": "🔮", "color": "rosa", "orden": 51, "regla": {"tipo": "dominio", "categoria": "inferencial", "valor": 80}},
    {"codigo": "dominio-critico", "nombre": "Voz crítica", "descripcion": "Dominio de 80 en el nivel crítico.", "icono": "⚖️", "color": "amarillo", "orden": 52, "regla": {"tipo": "dominio", "categoria": "critico", "valor": 80}},
    {"codigo": "dominio-cohesion", "nombre": "Conectora", "descripcion": "Dominio de 80 en cohesión y conectores.", "icono": "🔗", "color": "menta", "orden": 53, "regla": {"tipo": "dominio", "categoria": "cohesion", "valor": 80}},
    {"codigo": "sim-inicial", "nombre": "Primer simulacro", "descripcion": "Terminaste un simulacro inicial.", "icono": "🎟️", "color": "violeta", "orden": 60, "regla": {"tipo": "simulacro", "nivel": "inicial", "valor": 0}},
    {"codigo": "sim-avanzado-70", "nombre": "Avanzado al 70", "descripcion": "70 % o más en un simulacro avanzado.", "icono": "🎚️", "color": "violeta", "orden": 61, "regla": {"tipo": "simulacro", "nivel": "avanzado", "valor": 70}},
    {"codigo": "sim-experto-85", "nombre": "Nivel Medicina", "descripcion": "85 % o más en un simulacro experto.", "icono": "🩺", "color": "violeta", "orden": 62, "regla": {"tipo": "simulacro", "nivel": "experto", "valor": 85}},
    {"codigo": "horas-10", "nombre": "Diez horas", "descripcion": "Diez horas de estudio acumuladas.", "icono": "⏱️", "color": "cian", "orden": 70, "regla": {"tipo": "minutos", "valor": 600}},
    {"codigo": "horas-50", "nombre": "Cincuenta horas", "descripcion": "Cincuenta horas de estudio acumuladas.", "icono": "⌛", "color": "cian", "orden": 71, "regla": {"tipo": "minutos", "valor": 3000}},
    {"codigo": "mision-1", "nombre": "Misión cumplida", "descripcion": "Completaste una misión de tu tutor.", "icono": "📨", "color": "rosa", "orden": 80, "regla": {"tipo": "misiones", "valor": 1}},
    {"codigo": "mision-5", "nombre": "Equipo", "descripcion": "Completaste cinco misiones de tu tutor.", "icono": "🤝", "color": "rosa", "orden": 81, "regla": {"tipo": "misiones", "valor": 5}}
  ],
  "novedad": {"version": "1.0", "titulo": "Bienvenida",
              "cuerpo": "Esta es tu sala de práctica para la prueba de Competencia Lectora de la UdeA. Cada día puedes elegir un reto de 5, 10 o 15 preguntas; cuando quieras medirte en serio, entra a Simulacro. Tu tutor ve tu avance y te dejará mensajes y misiones por aquí."}
}

# ------------------------------------------------------------------ CONTENIDO
# Cada pregunta: (categoria, dificultad, enunciado, [correcta, d1, d2, d3], explicacion)
# La opción correcta se escribe primero; el script la reubica.
T = []

T.append(dict(codigo="P001-T01", titulo="La atención como territorio", tipologia="ensayo",
fuente="Texto original para práctica.",
contenido="""Durante siglos, la escasez que ordenó la vida intelectual fue la de la información: los libros eran caros, las bibliotecas quedaban lejos y el saber circulaba con lentitud. Hoy la situación se ha invertido. La información sobra; lo que escasea es la atención capaz de detenerse en ella. Por eso no resulta exagerado afirmar que la atención se ha convertido en un territorio en disputa, y que numerosas empresas diseñan sus productos con el propósito explícito de ocuparlo el mayor tiempo posible.

Sin embargo, sería ingenuo culpar solamente a las pantallas. La dispersión no es una invención digital: Séneca ya se quejaba de quienes saltaban de un libro a otro sin detenerse en ninguno, y comparaba esa costumbre con la del viajero que, por conocer muchas posadas, no tiene ningún amigo. Lo nuevo no es la tentación de distraerse, sino su escala y su método: nunca antes la interrupción había sido calculada con tanta precisión.

De ahí que la lectura sostenida adquiera un valor casi político. Quien lee un texto largo de principio a fin no solo obtiene datos; ejercita la capacidad de seguir un argumento, de tolerar la ambigüedad y de posponer el juicio hasta haber escuchado todas las razones. Esa capacidad, que no se hereda sino que se entrena, es precisamente la que una conversación pública apresurada más necesita y la que menos cultiva.

Conviene, pues, pensar la lectura no como un refugio nostálgico frente al presente, sino como una forma de resistencia activa. No se trata de abandonar las pantallas, lo cual sería tan improbable como inútil, sino de recuperar el derecho a decidir dónde ponemos los ojos.""",
preguntas=[
("literal",1,"Según el texto, lo que escasea en la actualidad es:",
 ["La atención capaz de detenerse en la información.","La información disponible sobre casi cualquier tema.","El acceso a las bibliotecas y a los libros.","La tecnología para organizar el saber."],
 "El primer párrafo lo dice de forma explícita: «La información sobra; lo que escasea es la atención». La opción sobre la información invierte lo que dice el texto."),
("inferencial",2,"La comparación de Séneca con el viajero que conoce muchas posadas pero no tiene ningún amigo sugiere que:",
 ["Leer de manera dispersa permite tocar muchos textos sin establecer una relación profunda con ninguno.","Viajar mucho impide dedicarse a la lectura.","Los libros son más valiosos que las amistades.","En la Antigüedad la gente leía más que hoy."],
 "Las posadas son los libros y el amigo es el vínculo profundo: saltar de uno a otro da cantidad sin profundidad. Las demás opciones toman la imagen al pie de la letra o sacan conclusiones que el texto no plantea."),
("cohesion",2,"En la frase «Sin embargo, sería ingenuo culpar solamente a las pantallas», el conector introduce:",
 ["Una matización que limita el alcance de lo dicho en el párrafo anterior.","Una consecuencia de lo dicho en el primer párrafo.","Un ejemplo que confirma la tesis inicial.","La conclusión general del texto."],
 "«Sin embargo» es adversativo: no niega lo anterior, lo corrige en parte. El autor acaba de hablar de empresas que capturan la atención y ahora aclara que la culpa no es solo de las pantallas."),
("critico",3,"¿Cuál de los siguientes hallazgos debilitaría más el argumento del autor sobre lo que la distracción actual tiene de nuevo?",
 ["Un estudio que muestre que en el siglo XIX ya existían técnicas publicitarias diseñadas para interrumpir la lectura con una precisión comparable a la de las aplicaciones actuales.","Un documento que confirme que Séneca escribió sobre la lectura dispersa en el siglo I.","Una encuesta según la cual muchos jóvenes leen textos largos en formato digital.","Un informe en el que las empresas tecnológicas describen sus métodos de diseño."],
 "El autor afirma que lo nuevo es «la escala y el método»: una interrupción calculada con precisión inédita. Si esa precisión ya existía antes, se cae justamente lo que él presenta como novedad. La opción sobre Séneca, en cambio, refuerza el texto."),
("inferencial",2,"Cuando el autor dice que la lectura sostenida adquiere «un valor casi político», quiere decir que:",
 ["Entrena capacidades que la deliberación pública necesita, como seguir argumentos y posponer el juicio.","Leer debería ser una obligación establecida por el Estado.","Los políticos deberían leer más textos largos.","La lectura sirve para formar partidos y movimientos."],
 "El mismo párrafo explica el sentido: leer de principio a fin ejercita capacidades que «una conversación pública apresurada» necesita. «Político» se usa en el sentido amplio de vida en común, no de partidos o gobiernos."),
("critico",2,"En el último párrafo el autor aclara que «no se trata de abandonar las pantallas». Con esta aclaración busca principalmente:",
 ["Anticiparse a la objeción de que su propuesta es un rechazo nostálgico de la tecnología.","Reconocer que su tesis central es falsa.","Contradecir lo que afirmó sobre Séneca.","Invitar al lector a usar más las pantallas."],
 "Es una estrategia argumentativa: el autor prevé que alguien lo acuse de nostálgico o tecnófobo y lo desactiva antes. No abandona su tesis; la precisa."),
]))

T.append(dict(codigo="P001-T02", titulo="Lo que el cerebro hace mientras dormimos", tipologia="divulgacion",
fuente="Texto original de divulgación para práctica.",
contenido="""Durante mucho tiempo se pensó que el sueño era un simple estado de reposo, una especie de pausa en la que el cerebro se apagaba para recuperar energía. Las investigaciones de las últimas décadas han desmentido esa imagen. Mientras dormimos, el cerebro trabaja de otra manera: selecciona, ordena y fortalece parte de lo que aprendimos durante el día.

El proceso ocurre, sobre todo, en dos momentos. En el sueño profundo, llamado también de ondas lentas, el hipocampo —una estructura que funciona como almacén temporal de recuerdos recientes— «reproduce» la actividad registrada durante la vigilia y la transfiere a la corteza, donde los recuerdos pueden conservarse a largo plazo. Más tarde, en la fase de movimientos oculares rápidos (MOR), el cerebro parece establecer conexiones entre informaciones que antes estaban aisladas, lo cual explicaría por qué a veces despertamos con la solución de un problema que la noche anterior parecía imposible.

Estos hallazgos tienen consecuencias prácticas. En un experimento, un grupo de estudiantes que durmió ocho horas después de estudiar recordó significativamente más que otro que estudió el mismo tiempo pero durmió cuatro. En otras palabras, trasnochar para repasar puede ser una estrategia contraproducente: se gana tiempo de estudio, pero se pierde el tiempo en que lo estudiado se consolida.

Con todo, el sueño no hace milagros. No fija aquello que nunca se comprendió ni sustituye la práctica. Su función es la de un editor cuidadoso, no la de un autor: trabaja sobre el material que le entregamos.""",
preguntas=[
("literal",1,"Según el texto, el hipocampo:",
 ["Funciona como almacén temporal de los recuerdos recientes.","Conserva los recuerdos a largo plazo.","Produce los movimientos oculares rápidos.","Reemplaza a la corteza durante el sueño."],
 "El texto lo define entre rayas: «una estructura que funciona como almacén temporal de recuerdos recientes». Quien conserva a largo plazo es la corteza."),
("literal",2,"¿En qué orden presenta el texto los procesos que ocurren durante el sueño?",
 ["Primero la transferencia de recuerdos del hipocampo a la corteza; después, la conexión entre informaciones aisladas.","Primero la conexión entre informaciones aisladas; después, la transferencia a la corteza.","Primero el reposo del cerebro; después, la fase de movimientos oculares rápidos.","Ambos procesos ocurren al mismo tiempo durante el sueño profundo."],
 "El segundo párrafo marca la secuencia con «En el sueño profundo…» y luego «Más tarde, en la fase MOR…». La idea del cerebro en reposo es justamente la que el texto desmiente."),
("inferencial",2,"A partir del texto, se puede concluir que un estudiante que trasnocha repasando antes de un examen:",
 ["Podría recordar menos, porque reduce el tiempo en que se consolida lo aprendido.","Recordará más, porque estudió más horas.","No recordará nada de lo que estudió.","Solo necesita la fase MOR para compensar las horas perdidas."],
 "El tercer párrafo lo sugiere: se gana tiempo de estudio pero se pierde consolidación. «No recordará nada» es una exageración que el texto no sostiene."),
("inferencial",2,"La expresión «su función es la de un editor cuidadoso, no la de un autor» significa que el sueño:",
 ["Organiza y fortalece lo aprendido, pero no produce el aprendizaje original.","Crea conocimientos nuevos a partir de la nada.","Corrige los errores que cometemos al escribir.","Escribe de nuevo los recuerdos que olvidamos."],
 "Es una metáfora: el editor trabaja sobre un texto que ya existe; el autor lo crea. El sueño mejora lo que estudiamos, pero no reemplaza el estudio. La frase siguiente lo confirma: «trabaja sobre el material que le entregamos»."),
("cohesion",2,"En «Con todo, el sueño no hace milagros», la expresión «con todo» podría reemplazarse, sin cambiar el sentido, por:",
 ["No obstante,","Por lo tanto,","Además,","Es decir,"],
 "«Con todo» tiene valor adversativo-concesivo: después de enumerar beneficios, pone un límite. «Por lo tanto» sería consecutivo, «además» aditivo y «es decir» explicativo."),
("critico",3,"¿Qué información adicional haría más sólida la conclusión que el texto extrae del experimento con los dos grupos de estudiantes?",
 ["Que los dos grupos tenían edades y conocimientos previos semejantes.","Que los estudiantes preferían dormir ocho horas.","Que el experimento se hizo en una universidad reconocida.","Que los investigadores también estudian el sueño en animales."],
 "Para atribuir la diferencia al sueño hay que descartar otras explicaciones: si un grupo ya sabía más, el resultado no probaría nada. El prestigio de la universidad no fortalece la lógica del argumento."),
]))

T.append(dict(codigo="P001-T03", titulo="El afinador", tipologia="literario",
fuente="Relato original para práctica.",
contenido="""Don Aurelio llegaba al pueblo cada seis meses, siempre en el bus de las siete, con un maletín de cuero que nadie le había visto abrir fuera de una sala. Afinaba el único piano de la escuela, el de la parroquia y, cuando la viuda Restrepo se lo permitía, el vertical que dormía en su comedor bajo una manta de encaje.

A mí me dejaban mirarlo. Él golpeaba una tecla, escuchaba con los ojos cerrados y giraba una clavija apenas lo que tarda un suspiro. «El piano no se desafina de un día para otro», me explicó una vez. «Se va yendo despacito, como la gente. Por eso nadie se da cuenta hasta que suena feo».

Aquel año el piano de la viuda tenía tres teclas mudas. Don Aurelio las revisó una por una, sacó del fondo del instrumento un sobre amarillento y se lo entregó a ella sin leerlo. La viuda lo guardó en el delantal y, por primera vez en años, se sentó a tocar. Tocó mal, con los dedos rígidos, pero nadie en el comedor se atrevió a decírselo.

—Ya quedó —dijo don Aurelio, aunque no había girado ni una sola clavija.

Esa tarde entendí que su oficio no consistía en arreglar pianos, o no solamente. Y comprendí también por qué, cuando el bus de las siete dejó de traerlo, el pueblo entero empezó a sonar un poco peor.""",
preguntas=[
("literal",1,"Según el narrador, ¿qué sacó don Aurelio del fondo del piano de la viuda?",
 ["Un sobre amarillento.","Una clavija rota.","Una manta de encaje.","Tres teclas nuevas."],
 "Está dicho de forma explícita en el tercer párrafo. La manta de encaje cubría el piano; no estaba adentro."),
("inferencial",2,"La frase «se va yendo despacito, como la gente» establece una comparación que sugiere que:",
 ["Las personas también se deterioran o cambian de forma gradual, sin que se note enseguida.","Los pianos son más frágiles que las personas.","La gente del pueblo no sabía tocar el piano.","Don Aurelio prefería los pianos a las personas."],
 "La comparación traslada al ser humano lo que se dice del piano: el desgaste lento que nadie percibe «hasta que suena feo». Esta idea prepara el final del relato."),
("inferencial",3,"Cuando don Aurelio dice «Ya quedó» sin haber girado ninguna clavija, se puede inferir que:",
 ["Consideraba que lo que necesitaba arreglo no era el instrumento, sino algo en la vida de la viuda.","Se equivocó y dejó el piano desafinado.","Quería engañar a la viuda para cobrarle el trabajo.","El piano no tenía ningún problema desde el principio."],
 "Las teclas mudas se explican por el sobre, y lo que cambia después es la viuda: vuelve a tocar «por primera vez en años». El narrador lo confirma: el oficio de don Aurelio «no consistía en arreglar pianos, o no solamente»."),
("inferencial",3,"La última frase, «el pueblo entero empezó a sonar un poco peor», debe entenderse en sentido:",
 ["Doble: alude a los pianos sin afinar y, a la vez, a una pérdida de armonía en la vida del pueblo.","Solo literal: los pianos se desafinaron por falta de mantenimiento.","Irónico: el pueblo mejoró cuando don Aurelio dejó de ir.","Técnico: el bus de las siete hacía más ruido al llegar."],
 "El relato ya advirtió que el oficio no era «solamente» arreglar pianos. Por eso la frase funciona en dos planos: el sonido de los instrumentos y el de la vida comunitaria. Quedarse solo con el sentido literal pierde la mitad."),
("cohesion",2,"En la frase «se lo entregó a ella sin leerlo», los pronombres «lo» de «se lo entregó» y de «leerlo» se refieren, respectivamente, a:",
 ["El sobre y el sobre.","El piano y el sobre.","El maletín y el sobre.","La viuda y la carta."],
 "Ambos «lo» son pronombres anafóricos que retoman «un sobre amarillento». «Ella» es quien se refiere a la viuda; por eso la última opción confunde los referentes."),
("critico",2,"¿Qué rasgo del narrador es clave para el efecto del relato?",
 ["Es alguien que recuerda un episodio de su infancia y lo comprende tiempo después.","Es un narrador omnisciente que conoce lo que dice el sobre.","Es el propio don Aurelio contando su oficio.","Es la viuda Restrepo recordando a su esposo."],
 "El narrador era un niño al que «dejaban mirar», y la comprensión llega después («Esa tarde entendí…»). Como no sabe qué dice el sobre, el lector tampoco lo sabe, y eso sostiene el misterio."),
]))

T.append(dict(codigo="P001-T04", titulo="El celular en el aula: dos posturas", tipologia="intertextual",
fuente="Textos originales para práctica.",
contenido="""### Texto A

Prohibir el celular en el aula no es un gesto autoritario, sino una medida de cuidado. Diversos estudios han mostrado que la simple presencia del teléfono sobre el pupitre, incluso apagado, reduce el rendimiento en tareas que exigen concentración. Si aceptamos que la escuela tiene la misión de proteger las condiciones del aprendizaje, debemos aceptar también que algunas herramientas, por útiles que sean fuera de ella, deben quedarse en la puerta. Nadie diría que prohibir la pelota durante la clase de química es un ataque contra el deporte.

### Texto B

Prohibir el celular equivale a renunciar a educar sobre él. Los estudiantes pasarán la mayor parte de su vida adulta rodeados de pantallas, y la escuela es quizá el único lugar donde alguien puede enseñarles a usarlas con criterio: a contrastar fuentes, a reconocer la manipulación y a decidir cuándo apagar. Una prohibición total traslada el problema fuera del aula, donde nadie acompaña. Lo que necesitamos no es un muro, sino un pacto: reglas claras sobre cuándo el teléfono se usa como herramienta y cuándo se guarda.""",
preguntas=[
("literal",1,"Según el texto A, la presencia del teléfono sobre el pupitre:",
 ["Reduce el rendimiento en tareas de concentración, incluso si está apagado.","Solo afecta a los estudiantes cuando está encendido.","Mejora la concentración si se usa como herramienta.","No tiene efectos comprobados en el aprendizaje."],
 "El texto A lo dice de forma explícita, e insiste en el detalle «incluso apagado»."),
("inferencial",2,"La comparación con la pelota en la clase de química, en el texto A, busca mostrar que:",
 ["Restringir un objeto en un contexto no implica rechazarlo en general.","El deporte y la química son igual de importantes.","Los estudiantes prefieren el deporte a las ciencias.","La escuela también debería prohibir las pelotas."],
 "Es una analogía: así como nadie ve en esa prohibición un ataque al deporte, prohibir el celular en clase no sería un ataque a la tecnología."),
("critico",2,"¿En qué coinciden los dos textos?",
 ["En que el uso del teléfono en el aula requiere algún tipo de regulación.","En que el teléfono debe prohibirse por completo.","En que el teléfono no afecta la concentración.","En que los estudiantes deben decidir libremente cuándo usarlo."],
 "A propone prohibirlo; B propone «reglas claras sobre cuándo se usa y cuándo se guarda». Difieren en el tipo de regulación, pero ninguno defiende el uso libre."),
("critico",3,"Desde la perspectiva del texto B, la principal debilidad de la propuesta del texto A es que:",
 ["Protege la concentración en clase, pero no prepara a los estudiantes para usar el teléfono con criterio.","Se basa en estudios que son falsos.","Permite el uso del teléfono en algunas clases.","Exige demasiado trabajo a los docentes."],
 "B sostiene que prohibir «traslada el problema fuera del aula, donde nadie acompaña». No discute los estudios de A; discute que la prohibición deja sin educar el uso."),
("cohesion",3,"En el texto A, la expresión «por útiles que sean fuera de ella» tiene un valor:",
 ["Concesivo: equivale a «aunque sean útiles fuera de ella».","Causal: equivale a «porque son útiles fuera de ella».","Consecutivo: equivale a «de modo que son útiles fuera de ella».","Condicional: equivale a «si son útiles fuera de ella»."],
 "La construcción «por + adjetivo + que» es concesiva: admite una objeción (son útiles) sin que cambie la conclusión (deben quedarse en la puerta). Además, «ella» remite a la escuela."),
("inferencial",2,"En el texto B, la oposición entre «un muro» y «un pacto» representa:",
 ["Una prohibición impuesta frente a un acuerdo con reglas compartidas.","Una construcción física frente a un documento legal.","La tecnología del pasado frente a la del futuro.","La postura de los estudiantes frente a la de los padres."],
 "Son metáforas: el muro separa y se impone; el pacto se construye entre partes. Leerlas de forma literal es el error que proponen dos de los distractores."),
]))

T.append(dict(codigo="P001-T05", titulo="¿Cómo leen los jóvenes?", tipologia="discontinuo",
fuente="Infografía con datos ficticios, elaborada para práctica.",
contenido="""### Infografía: hábitos de lectura de jóvenes de 14 a 18 años
Encuesta a 1.200 estudiantes de una ciudad colombiana. Datos ficticios, elaborados para práctica.

**Leen por gusto al menos un libro al año:** 58 %
**Leen por gusto al menos un libro al mes:** 17 %

**Formato preferido para leer por gusto**
- Pantalla del celular: 46 %
- Libro impreso: 38 %
- Tableta o computador: 11 %
- Audiolibro: 5 %

**Tiempo diario de lectura (cualquier texto, incluidas redes sociales)**
- Menos de 30 minutos: 22 %
- Entre 30 minutos y 2 horas: 49 %
- Más de 2 horas: 29 %

**Principal razón para no leer más libros**
- «No tengo tiempo»: 41 %
- «Me aburro rápido»: 27 %
- «No sé qué leer»: 19 %
- «Los libros son caros»: 13 %

*Nota: el 71 % de quienes leen al menos un libro al mes dijo que un familiar o un docente le recomienda libros con frecuencia.*""",
preguntas=[
("literal",1,"Según la infografía, el formato preferido por más jóvenes para leer por gusto es:",
 ["La pantalla del celular.","El libro impreso.","La tableta o el computador.","El audiolibro."],
 "Pantalla del celular: 46 %, el porcentaje más alto de ese bloque."),
("literal",2,"De los 1.200 estudiantes encuestados, ¿aproximadamente cuántos leen por gusto al menos un libro al mes?",
 ["204","696","170","580"],
 "El 17 % de 1.200 es 204. La cifra 696 corresponde al 58 % (un libro al año): confundir las dos filas es el error más común."),
("inferencial",2,"¿Cuál de las siguientes afirmaciones se deduce correctamente de la infografía?",
 ["Más de la mitad de los encuestados prefiere leer por gusto en algún formato digital.","La mayoría de los encuestados lee más de dos horas diarias.","El precio de los libros es la principal razón para no leer más.","La mitad de los encuestados lee un libro al mes."],
 "Celular (46 %) más tableta o computador (11 %) suman 57 %, más de la mitad. Las demás afirmaciones contradicen los datos."),
("critico",3,"¿Cuál de las siguientes conclusiones NO puede sostenerse con los datos de la infografía?",
 ["Las recomendaciones de familiares y docentes hacen que los jóvenes lean más.","La falta de tiempo es la razón más mencionada para no leer más libros.","Menos de uno de cada cinco encuestados lee un libro al mes.","Parte del tiempo diario de lectura corresponde a redes sociales."],
 "La nota muestra que dos cosas aparecen juntas, no que una cause la otra: quizá quienes ya leen mucho buscan más recomendaciones. Confundir correlación con causa es un error crítico frecuente."),
("critico",3,"Un periódico tituló una nota sobre esta encuesta: «Los jóvenes ya no leen». Según la infografía, ese titular es:",
 ["Inexacto, porque la mayoría lee al menos un libro al año y casi todos leen algún texto a diario.","Correcto, porque solo el 17 % lee un libro al mes.","Correcto, porque el 41 % dice no tener tiempo.","Inexacto, porque todos los encuestados leen más de dos horas diarias."],
 "El titular generaliza a partir de un solo dato. El 58 % lee al menos un libro al año y el 78 % lee más de 30 minutos diarios. La última opción también dice «inexacto», pero con una razón falsa."),
("cohesion",2,"En la nota final, la expresión «de quienes leen al menos un libro al mes» indica que el 71 % se calcula sobre:",
 ["Solo el grupo que lee al menos un libro al mes.","El total de los 1.200 encuestados.","Quienes leen más de dos horas diarias.","Quienes prefieren el libro impreso."],
 "La expresión delimita el grupo de referencia: el 71 % es de ese 17 %, no del total. Leer mal a qué remite una expresión cambia por completo el dato."),
]))

def armar(textos, paquete):
    out = []
    counts = [0,0,0,0]
    for t in textos:
        qs = []
        for i, (cat, dif, enun, ops, expl) in enumerate(t["preguntas"], 1):
            # reubicar la correcta de forma balanceada entre A, B, C y D
            pos = min(range(4), key=lambda k: (counts[k], random.random()))
            counts[pos] += 1
            correcta = ops[0]; resto = ops[1:]
            random.shuffle(resto)
            final = resto[:pos] + [correcta] + resto[pos:]
            qs.append(dict(codigo=f'{t["codigo"]}-{i:02d}', categoria=cat, dificultad=dif,
                           enunciado=enun, opciones=final, correcta=pos, explicacion=expl))
        out.append({k: t[k] for k in ("codigo","titulo","tipologia","fuente","contenido")} | {"preguntas": qs})
    return {"paquete": paquete,
            "novedad": {"version": "contenido-001", "titulo": "Nuevas lecturas",
                        "cuerpo": "Llegaron 5 lecturas nuevas con 30 preguntas: un ensayo, un texto de divulgación, un relato, dos posturas enfrentadas y una infografía."},
            "textos": out}

pack = armar(T, "paquete-001")
json.dump(base, open("content/base.json","w"), ensure_ascii=False, indent=2)
json.dump(pack, open("content/paquete-001.json","w"), ensure_ascii=False, indent=2)

# SQL de carga inicial (misma fuente que los JSON)
def lit(o): return "$pkg$" + json.dumps(o, ensure_ascii=False) + "$pkg$"
b = dict(base); b.pop("novedad")
p = dict(pack); p.pop("novedad")
def sqlstr(s): return "'" + s.replace("'", "''") + "'"
sql = f"""-- =====================================================================
--  ENTRELÍNEAS · 03 · CARGA INICIAL
--  Configuración, insignias y primer paquete de lecturas.
--  Generado desde content/base.json y content/paquete-001.json.
-- =====================================================================
select aplicar_paquete({lit(b)}::jsonb);
select aplicar_paquete({lit(p)}::jsonb);
insert into novedades (version, titulo, cuerpo) values
  ({sqlstr(base['novedad']['version'])}, {sqlstr(base['novedad']['titulo'])}, {sqlstr(base['novedad']['cuerpo'])});
"""
open("supabase/03_carga_inicial.sql","w").write(sql)

from collections import Counter
qs = [q for t in pack["textos"] for q in t["preguntas"]]
print(len(qs), dict(Counter(q["categoria"] for q in qs)), dict(Counter(q["correcta"] for q in qs)), dict(Counter(q["dificultad"] for q in qs)))
