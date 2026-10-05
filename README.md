# Entrelíneas · Examen de admisión UdeA

App de práctica diaria para el examen de admisión de la Universidad de Antioquia. Cubre los dos componentes de la prueba, **Competencia Lectora** y **Razonamiento Lógico**, que dentro de la app se navegan por separado y nunca se mezclan. La estudiante entra con usuario y contraseña, hace retos de 5, 10 o 15 preguntas y simulacros cronometrados, gana XP, rangos e insignias. El tutor ve su avance, recibe alertas y le envía mensajes, misiones y comentarios.

> **¿Vienes de la versión 1.0.0 (solo Lectura)?** Ve directo a «Pasar de la 1.0.0 a la 1.1.0», más abajo. El orden de los pasos importa.

- **Sitio**: archivos estáticos, se publican en GitHub Pages.
- **Datos y usuarios**: Supabase (plan gratuito).
- **Sin Supabase configurado**, la app arranca en *modo demo* con datos de prueba guardados solo en ese navegador. Para verla antes de montar nada, abre `demo.html` con doble clic. Usuarios: `sofia` / `demo` (estudiante) y `tutor` / `demo`.

---

## Qué hay en la carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `index.html` | La app. |
| `css/tema.css` | Colores, tipografías y radios. Cambiar la estética es cambiar este archivo. |
| `css/app.css` | Componentes. |
| `js/config.js` | **Lo único que editas al publicar**: URL y clave de Supabase, número de versión. |
| `js/*.js` | Lógica de la app (estudiante, tutor, conexión, modo demo). |
| `content/` | Paquetes de contenido en JSON (lectura: `paquete-…`; lógica: `logica-…`) y dos plantillas para hacer nuevos. |
| `supabase/` | Los archivos SQL que crean la base de datos. `respaldo/` guarda cómo volver a las funciones de la 1.0.0. |
| `version.json` | Número de versión publicada (para avisar de actualizaciones). |
| `demo.html` | La app completa en un solo archivo, en modo demo. |
| `tools/` | Scripts para regenerar el contenido y el demo (opcional). `generar_logica.py` arma los paquetes de lógica y comprueba sus respuestas. |
| `_contexto/` | Documentación para seguir trabajando en la app. Empieza por `00-LEEME-PRIMERO.md`. |

---

## Puesta en marcha (una sola vez, unos 20 minutos)

### 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com), crea una cuenta y un proyecto nuevo. Región: la más cercana (por ejemplo, São Paulo). Guarda la contraseña de la base de datos en un lugar seguro.
2. En el menú lateral abre **SQL Editor** → **New query**.
3. Copia y ejecuta, **en este orden**, el contenido completo de:
   1. `supabase/01_esquema.sql`
   2. `supabase/04_razonamiento_logico.sql`
   3. `supabase/02_funciones.sql`
   4. `supabase/03_carga_inicial.sql`

   Cada uno debe terminar con «Success». El último carga la configuración, 23 insignias y las primeras 30 preguntas de lectura. Lo demás (los otros paquetes de lectura y todo Razonamiento Lógico) se carga después desde la app, en Tutor → Contenido.

### 2. Cerrar el registro público

En **Authentication** → **Sign In / Providers** (o **Providers → Email**), desactiva **Allow new users to sign up**. Así solo existen las cuentas que tú crees.

### 3. Crear las cuentas

En **Authentication** → **Users** → **Add user** → **Create new user**:

- Tu cuenta de tutor: correo `diego@entrelineas.app` (el dominio es inventado, no necesita existir), una contraseña y marca **Auto Confirm User**.
- La estudiante: `sofia@entrelineas.app` (usa su nombre real), su contraseña y **Auto Confirm User**.

Después, en **SQL Editor**, conviértete en tutor:

```sql
update perfiles set rol = 'tutor' where usuario = 'diego';
```

Para ponerle su nombre completo a la estudiante (ella también puede editarlo desde su perfil):

```sql
update perfiles set nombre = 'Sofía Restrepo' where usuario = 'sofia';
```

La estudiante entra escribiendo solo `sofia` y su contraseña. Tú entras con `diego`.

### 4. Conectar la app con Supabase

En Supabase abre **Project Settings** → **API** (o **API Keys**) y copia:

- **Project URL**
- La clave **pública**: `anon` o `publishable`. Nunca la `service_role` ni la `secret`.

Pégalas en `js/config.js`:

```js
SUPABASE_URL: "https://xxxxxxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
```

La clave pública puede estar en un sitio web: los permisos los controla la base de datos (cada estudiante solo ve lo suyo; las respuestas correctas nunca viajan al navegador antes de responder).

### 5. Publicar en GitHub Pages

1. En GitHub crea un repositorio nuevo, por ejemplo `entrelineas`.
2. **Add file** → **Upload files** y arrastra *el contenido* de esta carpeta (no la carpeta misma). `index.html` debe quedar en la raíz del repositorio.
3. **Settings** → **Pages** → *Source*: **Deploy from a branch** → rama `main`, carpeta `/ (root)` → **Save**.
4. En uno o dos minutos la app queda en `https://TU-USUARIO.github.io/entrelineas/`.

En el celular de la estudiante: abre ese enlace y usa **Agregar a pantalla de inicio**; queda como una app más.

---

## Pasar de la 1.0.0 a la 1.1.0 (llega Razonamiento Lógico)

Nada de esto borra ni cambia el progreso de la estudiante. Hazlo en este orden, porque la app nueva necesita la base de datos nueva:

1. **Supabase → SQL Editor.** Ejecuta completo `supabase/04_razonamiento_logico.sql` y, después, completo `supabase/02_funciones.sql`. Los dos deben terminar con «Success». Desde ese momento la app que ya está publicada sigue funcionando igual: las funciones nuevas aceptan las llamadas de la versión anterior.
2. **GitHub.** Sube los archivos de esta carpeta al repositorio (**Add file → Upload files**, arrastrando el contenido de la carpeta). Cambiaron `index.html`, `version.json`, `manifest.webmanifest`, todo `js/` (incluido el archivo nuevo `js/vistas-logica.js`), `css/app.css`, `content/`, `supabase/`, `tools/`, `demo.html` y `README.md`.
3. **La app, como tutor → Contenido.** Carga, en este orden: `content/logica-base.json` (niveles, retos, simulacros, 16 insignias y 26 fichas de técnica), `content/logica-001.json` (56 preguntas) y `content/logica-002.json` (53 preguntas). Al cargar el primero aparece «Lógica» en la navegación de la estudiante y le sale el aviso «Llegó Lógica» la próxima vez que entre.

Mientras no cargues `logica-base`, la app se ve y funciona como la 1.0.0: Lógica sencillamente no aparece.

Si algo de Lectura se dañara después del paso 1, `supabase/respaldo/volver_a_1.0.0.sql` devuelve las funciones a como estaban. No lo ejecutes si todo va bien.

`logica-base.json` reemplaza la clave de configuración `categorias` completa: trae los cuatro niveles de lectura con sus textos de fábrica y agrega los cuatro de lógica. Si habías cambiado nombres o descripciones de los niveles de lectura, vuelve a ponerlos después.

---

## Cómo se actualiza

Hay tres tipos de actualización y ninguno borra el progreso de la estudiante.

### Preguntas y lecturas nuevas → paquete de contenido

1. Prepara un archivo `.json` con el formato de `content/plantilla-paquete.json`.
2. En la app, como tutor: **Contenido** → **Elegir archivo .json** (o pégalo en el recuadro) → **Revisar paquete** → **Cargar paquete**.
3. La app valida el paquete antes de cargarlo y te dice qué corregir si algo está mal.

Reglas del formato:

- `paquete`: nombre del paquete, por ejemplo `paquete-002`.
- Cada lectura: `codigo` único (`P002-T01`), `titulo`, `tipologia`, `contenido`, `fuente` y `preguntas`.
- `tipologia`: `ensayo`, `divulgacion`, `literario`, `discontinuo`, `intertextual`, `argumentativo`, `periodistico` u `otro`.
- `contenido`: párrafos separados por una línea en blanco (`\n\n` dentro del JSON). Admite `### Subtítulo`, listas con `- ` y `**negrita**`.
- Cada pregunta: `codigo` único (`P002-T01-01`), `categoria` (`literal`, `inferencial`, `critico` o `cohesion`), `dificultad` (1, 2 o 3), `enunciado`, exactamente 4 `opciones`, `correcta` (0 = A, 1 = B, 2 = C, 3 = D) y `explicacion`.
- Si cargas de nuevo un código que ya existe, se **actualiza** (sirve para corregir una pregunta). Para retirar una sin borrarla, cárgala con `"activo": false`.
- Opcional: `novedad` con `titulo` y `cuerpo`; la estudiante la ve al entrar.

**Pedirle preguntas nuevas a Claude.** En este mismo proyecto puedes escribir algo como:

> Genera el paquete-002 para Entrelíneas con el formato de `content/plantilla-paquete.json`: 5 lecturas originales (un ensayo, un texto periodístico, un poema o fragmento narrativo, dos textos en diálogo y una infografía), 6 preguntas cada una, con esta distribución aproximada: 20 % literal, 35 % inferencial, 30 % crítico, 15 % cohesión. La respuesta correcta repartida entre A, B, C y D. Explicaciones que digan por qué la correcta lo es y en qué falla el distractor más tentador.

Revisa siempre las preguntas antes de cargarlas.

### Problemas de lógica nuevos → paquete de lógica

El formato está en `content/plantilla-logica.json`. Se carga igual, desde Tutor → Contenido. Un paquete de lógica puede traer:

- `preguntas`: problemas sueltos. Cada uno lleva `codigo` (`L-POR-5`), `categoria` (`deductivo`, `proporcional`, `abstracto` o `geometrico`), `tema` (el código de su técnica), `dificultad`, `enunciado`, 4 `opciones`, `correcta` y, además de lo que ya tiene una pregunta de lectura:
  - `pista`: el primer movimiento, sin dar la respuesta.
  - `pasos`: la solución paso a paso, como lista.
  - `errores`: una entrada por opción, en el mismo orden (`null` en la correcta). Cada una dice el `tipo` de error que lleva a esa opción (`enunciado`, `planteamiento`, `regla`, `incompleto`, `calculo` o `inferencia`) y una `nota` para quien la marque.
  - `figura` (opcional): un dibujo en SVG.
- `textos` con `"tipologia": "situacion"`: un contexto compartido (con cuadro o figura) y sus `preguntas`.
- `tecnicas`: fichas de la caja de herramientas (`codigo`, `categoria`, `nombre`, `cuando`, `pasos`, `ejemplo`, `trampa`).

El enunciado de lógica admite listas (`- `), **negrita** y cuadros: filas que empiezan y terminan con `|`. Un paquete no puede mezclar componentes dentro de una misma lectura o situación; el validador lo impide.

Los paquetes `logica-001` y `logica-002` no se escribieron a mano en JSON: salen de `tools/generar_logica.py`, que además comprueba con código la respuesta de cada problema. Para corregir o agregar problemas conviene hacerlo ahí y volver a generar.

### Gamificación → paquete con `insignias` o `config`

Un paquete puede traer solo insignias o solo ajustes, sin lecturas. Ejemplos:

```json
{ "paquete": "ajustes-octubre",
  "config": {
    "simulacros": {
      "inicial":  {"nombre": "Inicial",  "preguntas": 30, "minutos": 65,  "dificultad": 1.6, "descripcion": "Textos más accesibles."},
      "avanzado": {"nombre": "Avanzado", "preguntas": 40, "minutos": 90,  "dificultad": 2.1, "descripcion": "Como el examen real."},
      "experto":  {"nombre": "Experto",  "preguntas": 50, "minutos": 105, "dificultad": 2.5, "descripcion": "Más presión de tiempo."}
    }
  }
}
```

Claves de `config` (los valores actuales están en `content/base.json` y, las de lógica, en `content/logica-base.json`): `distribucion`, `categorias`, `retos`, `simulacros`, `xp`, `rangos`, `referencias`, `alertas`, `avatares`, y para lógica `distribucion_logica`, `retos_logica`, `simulacros_logica`, `referencias_logica` y `tipos_error`. Cada clave se reemplaza completa: copia la actual y cambia lo que necesites.

Tipos de regla para insignias (`regla.tipo`): `racha`, `respuestas`, `aciertos`, `retos`, `reto_perfecto`, `dominio` (con `categoria`), `simulacro` (con `nivel`; `valor` es el % mínimo), `minutos`, `misiones`, `remontada`, `recuperadas` (preguntas falladas que después respondió bien) y `tecnicas` (técnicas dominadas). Con `"componente": "logica"` o `"lectura"` en la regla, la insignia cuenta solo lo de ese componente.

### Diseño y funciones → archivos en GitHub

1. Reemplaza en el repositorio los archivos que cambien (por ejemplo `css/tema.css` o algo en `js/`).
2. Sube el número de versión en **tres** sitios, con el mismo número: `js/config.js` (`VERSION`), `version.json` y los diez `?v=` de `index.html`.
3. Si la entrega trae un archivo SQL nuevo (por ejemplo `04_…sql`), ejecútalo en el SQL Editor. `02_funciones.sql` se puede volver a ejecutar completo sin perder datos.

Quien tenga la app abierta ve un aviso «Hay una versión nueva» con un botón para actualizar. En `version.json` puedes poner una frase en `notas` que aparece en ese aviso.

---

## Lo que ve el tutor

- **Alertas automáticas** cada vez que abres el panel: tres días o más sin practicar, o una caída de 15 puntos o más en el % de aciertos de un nivel (última semana frente a las tres anteriores). Cada alerta trae un mensaje sugerido que editas y envías como misión, o descartas. Los umbrales se cambian con `config.alertas`.
- Por estudiante: racha, días con práctica en la semana, minutos por día (solo cuenta tiempo con la app visible y en uso), dominio por nivel, evolución semanal, simulacros con desglose, las preguntas que más falla con su última respuesta, y el historial de lo que le has enviado (leído, pendiente, misión cumplida).
- **Mensajes, misiones y comentarios**: una misión es un reto de 5, 10 o 15 preguntas (de un nivel o mezclado) que ella ve destacado en su inicio y que da XP extra e insignias. Un comentario le llega con la pregunta citada y la respuesta correcta.

## Cómo funciona la práctica

Lo que sigue vale para los dos componentes. Cada uno tiene su portada, sus retos, su ecualizador y sus simulacros; el XP, el rango, la racha y el tiempo de estudio son de la persona y se comparten.

- **Dominio (0–100)** por nivel: últimas 30 respuestas, ponderadas por dificultad.
- **Retos**: mezcla los cuatro niveles según `config.distribucion`, ajusta la dificultad al dominio de cada nivel, no repite en 30 días una pregunta ya respondida y reserva un 20 % para **repaso espaciado** de las que falló.
- **Simulacros**: textos completos con todas sus preguntas, reloj del servidor (no se puede pausar ni reiniciar recargando), entrega automática al vencer el tiempo y diagnóstico por nivel, frente a puntajes de corte de referencia y pregunta por pregunta. Si el banco tiene menos preguntas que el nivel pedido, usa todas y ajusta el tiempo en proporción. Con 30 preguntas cargadas, conviene sumar paquetes pronto: un banco sano tiene 150 o más.

## Lo propio de Razonamiento Lógico

- **Cuatro niveles**: Deducción, Proporciones (con conteo y probabilidad), Patrones y Geometría. Los retos se llaman Riff, Solo y Jam.
- **Pista**: antes de responder puede pedir el primer movimiento. No le quita el acierto, solo el bono de ritmo.
- **Qué pasó**: cada opción incorrecta nace de un error concreto. Al marcarla, la app le dice cuál fue y de qué tipo: leyó otra pregunta, planteó mal, aplicó una regla que no era, se quedó a mitad de camino, falló la cuenta o dio un salto lógico.
- **Solución paso a paso** después de cada respuesta, acierte o no.
- **Caja de herramientas**: una ficha por técnica (cuándo se usa, el procedimiento, un ejemplo y la trampa típica), con su avance y un botón para practicar solo esa técnica.
- **Cuaderno de errores**: las preguntas cuya última respuesta fue incorrecta, agrupadas por técnica, con su opción, el diagnóstico y la solución. Desde ahí puede hacer un reto de repaso solo con sus errores. Una pregunta sale del cuaderno cuando la responde bien.
- **Simulacro de lógica**: 20, 40 o 40 preguntas con cupo por nivel. El diagnóstico añade cómo se equivocó (por tipo de error), qué técnicas repasar y en qué preguntas se le fue el tiempo.
- **Para el tutor**: en el detalle de la estudiante, el perfil de errores de lógica y las técnicas que más le cuestan; las misiones pueden ser de lectura o de lógica.

## Tareas comunes

**Cambiar la contraseña de una estudiante** (SQL Editor):

```sql
update auth.users set encrypted_password = extensions.crypt('nueva-clave', extensions.gen_salt('bf'))
where email = 'sofia@entrelineas.app';
```

**Agregar otra estudiante**: repite el paso 3 con su correo. Aparece sola en tu panel.

**Plan gratuito de Supabase**: los proyectos sin actividad durante una semana se pausan; con uso diario no pasa. Si ocurre, se reactiva desde el panel de Supabase con un clic.
