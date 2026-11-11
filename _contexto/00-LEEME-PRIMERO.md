# Entrelíneas · Carpeta de contexto

Esta carpeta guarda todo lo que hace falta saber para seguir trabajando en Entrelíneas sin tener que reconstruir la historia: para qué existe la app, cómo enseña, cómo está hecha por dentro, cómo se le agregan preguntas y cómo se cambia sin dañar el progreso de la estudiante.

La app no la necesita para funcionar. Es documentación: se puede subir al repositorio o dejarla solo en el computador, da igual. No contiene contraseñas y no debe contenerlas nunca.

Escrita el 4 de octubre de 2026 a partir de una lectura completa del código de la versión 1.0.0, de los documentos del proyecto «Simulacro Examen UdeA» en Claude y de las conversaciones en las que se diseñó y se montó la app. Ese mismo día se construyó la versión 1.1.0, que agrega Razonamiento Lógico; cada documento tiene al final una sección sobre ese componente. El 11 de noviembre de 2026 se construyó la 1.2.0 (cuentas desde la app, grupos, instalación en el celular y modo práctica del tutor); los documentos 01, 03, 04, 06, 07 y 08 tienen una sección sobre ella.

**Dónde se trabaja.** Desde el 11-nov-2026 la carpeta de trabajo es `Documents/GitHub/App-comprension-lectora/lectura-admision-udea`, conectada a GitHub Desktop (repositorio `godeloz/lectura-admision-udea`). Diego hace los commits y el push desde GitHub Desktop; Claude edita los archivos y no ejecuta git.

---

## La app en un párrafo

Entrelíneas es una app web para practicar el examen de admisión de la Universidad de Antioquia. Tiene dos componentes que se navegan por separado y nunca se mezclan en una misma sesión: Lectura (Competencia Lectora) y Lógica (Razonamiento Lógico). Cada estudiante entra con su correo y su contraseña (las cuentas las crea el tutor desde la app y se pueden agrupar), hace retos diarios de 5, 10 o 15 preguntas con explicación inmediata y simulacros cronometrados con diagnóstico; gana XP, rangos e insignias. En Lógica, cada respuesta trae la solución paso a paso y el tipo de error cometido, y hay una caja de herramientas con las técnicas y un cuaderno de errores. Diego, como tutor, ve su avance, recibe alertas automáticas y le envía mensajes, misiones y comentarios sobre preguntas falladas. Es un sitio estático (HTML, CSS y JavaScript sin frameworks) publicado en GitHub Pages, con Supabase para usuarios, datos y toda la lógica que no debe poder manipularse desde el navegador.

## Estado al 4 de octubre de 2026

| | |
|---|---|
| Versión de la app | En la carpeta: **1.2.0** (cuentas, grupos e instalación; 11-nov-2026). Lo publicado en GitHub Pages depende de los commits de Diego; para la 1.2.0 hay que hacer los pasos de «Pasar de la 1.1.0 a la 1.2.0» del `README.md` |
| Supabase | Conectado: `js/config.js` ya tiene la URL y la clave pública del proyecto |
| Base de datos | Esquema, funciones y carga inicial ejecutados el 26-sep-2026. Pendiente para la 1.1.0: ejecutar `04_razonamiento_logico.sql` y el `02_funciones.sql` nuevo |
| Banco de preguntas | Escritas: 25 lecturas y 150 preguntas en cinco paquetes, que era la meta mínima. Cargado en la app con certeza: `paquete-001` y `paquete-002` (61 preguntas). Preparados el 4-oct-2026 y por confirmar si ya se cargaron: `paquete-003` (32), `paquete-004` (30) y `paquete-005` (27) |
| Banco de lógica | Escrito el 4-oct-2026: 109 preguntas (27 de deducción, 36 de proporciones, 20 de patrones, 26 de geometría), 4 situaciones y 26 fichas de técnica, en `logica-base`, `logica-001` y `logica-002`. Sin cargar todavía |
| Insignias | 23 generales y de lectura; 16 de lógica cuando se cargue `logica-base` |
| Usuarios | Tutor `diego`; la estudiante se creó en Supabase Authentication. Desde la 1.2.0 las cuentas nuevas se crean en la app (Personas) |
| Publicación en GitHub Pages | Al aire: https://godeloz.github.io/lectura-admision-udea/ |

## Datos por completar

Son los únicos datos que no se pueden deducir del código. Conviene llenarlos aquí mismo:

- Dirección pública de la app (GitHub Pages): https://godeloz.github.io/lectura-admision-udea/
- Repositorio en GitHub: `godeloz/lectura-admision-udea` (deducido de la dirección de la página)
- Fecha del examen que va a presentar la estudiante: 26 y 27 de octubre de 2026, convocatoria 2027-1. Diego confirmó el 4-oct-2026 que está inscrita; falta saber cuál de los dos días le toca. Resultados: 11 de noviembre.
- Programa al que aspira (define contra qué puntaje de corte se mide): Artes Plásticas (dato de Diego, 4-oct-2026). Según la guía de aspirantes 2027-1, este programa se admite solo con el examen general, sin prueba específica.
- Nombre de usuario de la estudiante en la app: `________`

---

## Qué hay en esta carpeta

| Archivo | Para qué sirve | Cuándo leerlo |
|---|---|---|
| `01-proposito-y-decisiones.md` | Para quién es la app, qué se pidió, qué se decidió y por qué | Antes de proponer una función nueva |
| `02-examen-y-metodologia.md` | Cómo es el examen de la UdeA y cuál es el método de estudio que la app pone en práctica | Antes de tocar la lógica pedagógica o escribir preguntas |
| `03-arquitectura-tecnica.md` | Mapa de archivos, base de datos, funciones SQL, permisos y convenciones del código | Antes de cambiar cualquier archivo de `js/`, `css/` o `supabase/` |
| `04-reglas-y-formulas.md` | Las reglas exactas: dominio, selección de preguntas, XP, rachas, simulacros, alertas, insignias | Para responder «¿por qué la app hizo esto?» o para cambiar una regla |
| `05-contenido-y-paquetes.md` | Formato de los paquetes, criterios para escribir lecturas y preguntas, inventario del banco | Cada vez que se prepare un paquete nuevo |
| `06-diseno-y-voz.md` | Paleta, tipografías, metáforas visuales, componentes y tono de los textos | Antes de cambiar la apariencia o escribir textos de la interfaz |
| `07-como-hacer-cambios.md` | Recetas paso a paso según el tipo de cambio, cómo probar y cómo publicar | Siempre que se vaya a modificar algo |
| `08-estado-fases-y-pendientes.md` | Fases del proyecto, puntos débiles detectados en el código y lista de mejoras posibles | Para decidir qué sigue |
| `09-bitacora.md` | Registro fechado de lo que se ha hecho | Al terminar cada sesión de trabajo: añadir una entrada |

## Las diez reglas que no se rompen

1. **El progreso de la estudiante no se pierde.** Ningún cambio borra ni renombra tablas o columnas con datos. Los cambios de esquema van en un archivo SQL nuevo (`04_…sql`, `05_…sql`) y solo añaden.
2. **Lo que cambia con el tiempo vive en tablas, no en el código.** Preguntas, insignias, rangos, XP, tiempos y distribución se cambian con un paquete JSON desde Tutor → Contenido.
3. **La lógica sensible corre en Supabase.** Calificar, dar XP, otorgar insignias y elegir preguntas son funciones SQL. El navegador nunca recibe la respuesta correcta antes de que la estudiante responda.
4. **Toda función de la API existe dos veces:** en `js/api-supabase.js` (más su función SQL) y en `js/api-demo.js`. Si se cambia una y no la otra, el demo deja de parecerse a la app real. `_contexto/07` explica cómo comparar la forma de las respuestas de las dos.
5. **Los códigos son para siempre.** `P001-T01-03` identifica una pregunta toda la vida. Cargar de nuevo un código existente lo sobrescribe: sirve para corregir, nunca para poner una pregunta distinta.
6. **La versión se sube en tres sitios a la vez:** `js/config.js` (`VERSION`), `version.json` y los diez `?v=` de `index.html`.
7. **`03_carga_inicial.sql` no se vuelve a ejecutar** con la app en uso: devolvería la configuración a los valores de fábrica y duplicaría la novedad de bienvenida. `02_funciones.sql` sí se puede ejecutar completo las veces que haga falta.
8. **Todo texto que venga de la base de datos pasa por `LE.esc()`** antes de entrar al HTML.
9. **Sin frameworks, sin compilación, sin npm.** La app son archivos que se suben tal cual. Esa sencillez es lo que permite que Diego la publique arrastrando archivos a GitHub.
10. **Se prueba en el demo antes de publicar**, y se reconstruye `demo.html` cuando cambian `js/`, `css/` o `content/`.
11. **Lectura y Lógica no se mezclan.** Un reto, una misión o un simulacro es de un solo componente. Toda función que elige preguntas filtra por `componente`, y el validador de paquetes rechaza una pregunta puesta en el componente equivocado.

## Cómo retomar el trabajo con Claude

Con la carpeta `entrelineas` conectada, basta un mensaje así:

> Lee `_contexto/00-LEEME-PRIMERO.md` y los archivos que apliquen según lo que te voy a pedir. Quiero [describir el cambio]. Antes de tocar nada, dime qué archivos cambiarías y qué tengo que hacer yo en Supabase o en GitHub. Al terminar, añade una entrada en `_contexto/09-bitacora.md` y actualiza los documentos de contexto que hayan quedado desactualizados.

Para pedir preguntas nuevas, el mensaje modelo está en `05-contenido-y-paquetes.md`.

## Otras fuentes

Viven en el proyecto «Simulacro Examen UdeA» de Claude, no en esta carpeta (los cuadernillos tienen derechos de terceros y no conviene que terminen en un repositorio público):

- `Examen de Admisión UdeA.md`: análisis de la estructura, los puntajes de corte y la ruta de preparación del examen. Lo esencial está resumido en `02-examen-y-metodologia.md`.
- `simulacro-udea-b.md`: 20 preguntas de lectura y 20 de razonamiento lógico de un simulacro virtual, sin clave de respuestas. Sirve como referencia de estilo para los dos componentes (las de lógica 21 a 24 dependen de figuras que no se extrajeron).
- `Cuadernillo-examen-udea.pdf` (22 páginas, escaneado) y `Simulacro-virtual-udea2.pdf` (24 páginas): material original. Ojo con el cuadernillo: las páginas 1 a 17 son la guía de Razonamiento Lógico (temas, 20 problemas y el análisis de sus soluciones: es la fuente principal del componente de Lógica), y la parte de Competencia Lectora (páginas 18 a 22) es una guía de la Universidad de Cartagena, no de la UdeA. Sirve por sus patrones de pregunta (EXCEPTO, sinónimo, refrán aplicable, título adecuado), no como muestra del examen de la UdeA.
- `claude/entrelineas-app.md`: resumen corto de la app dentro del proyecto.
