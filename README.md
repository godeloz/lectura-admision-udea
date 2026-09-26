# Entrelíneas · Competencia Lectora UdeA

App de práctica diaria para la prueba de Competencia Lectora del examen de admisión de la Universidad de Antioquia. La estudiante entra con usuario y contraseña, hace retos de 5, 10 o 15 preguntas y simulacros cronometrados, gana XP, rangos e insignias. El tutor ve su avance, recibe alertas y le envía mensajes, misiones y comentarios.

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
| `content/` | Paquetes de contenido en JSON y una plantilla para hacer nuevos. |
| `supabase/` | Los tres archivos SQL que crean la base de datos. |
| `version.json` | Número de versión publicada (para avisar de actualizaciones). |
| `demo.html` | La app completa en un solo archivo, en modo demo. |
| `tools/` | Scripts para regenerar el contenido y el demo (opcional). |

---

## Puesta en marcha (una sola vez, unos 20 minutos)

### 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com), crea una cuenta y un proyecto nuevo. Región: la más cercana (por ejemplo, São Paulo). Guarda la contraseña de la base de datos en un lugar seguro.
2. En el menú lateral abre **SQL Editor** → **New query**.
3. Copia y ejecuta, **en este orden**, el contenido completo de:
   1. `supabase/01_esquema.sql`
   2. `supabase/02_funciones.sql`
   3. `supabase/03_carga_inicial.sql`

   Cada uno debe terminar con «Success». El tercero carga la configuración, 23 insignias y las primeras 30 preguntas.

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

Claves de `config` (los valores actuales están en `content/base.json`): `distribucion`, `categorias`, `retos`, `simulacros`, `xp`, `rangos`, `referencias`, `alertas`, `avatares`. Cada clave se reemplaza completa: copia la actual de `base.json` y cambia lo que necesites.

Tipos de regla para insignias (`regla.tipo`): `racha`, `respuestas`, `aciertos`, `retos`, `reto_perfecto`, `dominio` (con `categoria`), `simulacro` (con `nivel`; `valor` es el % mínimo), `minutos`, `misiones`, `remontada`.

### Diseño y funciones → archivos en GitHub

1. Reemplaza en el repositorio los archivos que cambien (por ejemplo `css/tema.css` o algo en `js/`).
2. Sube el número de versión en **tres** sitios, con el mismo número: `js/config.js` (`VERSION`), `version.json` y los `?v=` de `index.html`.
3. Si la entrega trae un archivo SQL nuevo (por ejemplo `04_…sql`), ejecútalo en el SQL Editor. `02_funciones.sql` se puede volver a ejecutar completo sin perder datos.

Quien tenga la app abierta ve un aviso «Hay una versión nueva» con un botón para actualizar. En `version.json` puedes poner una frase en `notas` que aparece en ese aviso.

---

## Lo que ve el tutor

- **Alertas automáticas** cada vez que abres el panel: tres días o más sin practicar, o una caída de 15 puntos o más en el % de aciertos de un nivel (última semana frente a las tres anteriores). Cada alerta trae un mensaje sugerido que editas y envías como misión, o descartas. Los umbrales se cambian con `config.alertas`.
- Por estudiante: racha, días con práctica en la semana, minutos por día (solo cuenta tiempo con la app visible y en uso), dominio por nivel, evolución semanal, simulacros con desglose, las preguntas que más falla con su última respuesta, y el historial de lo que le has enviado (leído, pendiente, misión cumplida).
- **Mensajes, misiones y comentarios**: una misión es un reto de 5, 10 o 15 preguntas (de un nivel o mezclado) que ella ve destacado en su inicio y que da XP extra e insignias. Un comentario le llega con la pregunta citada y la respuesta correcta.

## Cómo funciona la práctica

- **Dominio (0–100)** por nivel: últimas 30 respuestas, ponderadas por dificultad.
- **Retos**: mezcla los cuatro niveles según `config.distribucion`, ajusta la dificultad al dominio de cada nivel, no repite en 30 días una pregunta ya respondida y reserva un 20 % para **repaso espaciado** de las que falló.
- **Simulacros**: textos completos con todas sus preguntas, reloj del servidor (no se puede pausar ni reiniciar recargando), entrega automática al vencer el tiempo y diagnóstico por nivel, frente a puntajes de corte de referencia y pregunta por pregunta. Si el banco tiene menos preguntas que el nivel pedido, usa todas y ajusta el tiempo en proporción. Con 30 preguntas cargadas, conviene sumar paquetes pronto: un banco sano tiene 150 o más.

## Tareas comunes

**Cambiar la contraseña de una estudiante** (SQL Editor):

```sql
update auth.users set encrypted_password = extensions.crypt('nueva-clave', extensions.gen_salt('bf'))
where email = 'sofia@entrelineas.app';
```

**Agregar otra estudiante**: repite el paso 3 con su correo. Aparece sola en tu panel.

**Plan gratuito de Supabase**: los proyectos sin actividad durante una semana se pausan; con uso diario no pasa. Si ocurre, se reactiva desde el panel de Supabase con un clic.
