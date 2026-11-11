# 03 · Arquitectura técnica

## Vista general

```
Navegador (celular o computador)
  index.html + css/ + js/           <- archivos estáticos en GitHub Pages
        │
        │  supabase-js (se carga desde cdn.jsdelivr.net)
        ▼
Supabase
  Authentication   usuarios con correo nombre@entrelineas.app y contraseña
  Postgres         13 tablas con seguridad por filas (RLS)
  Funciones SQL    toda la lógica: elegir preguntas, calificar, XP, insignias, alertas
```

No hay servidor propio, ni compilación, ni dependencias instaladas. Lo único externo que carga la app son las tipografías de Google Fonts y la librería `@supabase/supabase-js@2` desde jsDelivr (sin versión fija).

Si `SUPABASE_URL` está vacío en `js/config.js`, la app arranca en **modo demo**: `js/api-demo.js` reemplaza a Supabase y guarda todo en el `localStorage` de ese navegador.

## Mapa de archivos

Las cifras de líneas de esta tabla son de la versión 1.0.0. Lo que cambió y lo que se agregó en la 1.1.0 está en la sección «Razonamiento Lógico», al final.

| Archivo | Líneas | Qué contiene |
|---|---|---|
| `index.html` | 30 | Esqueleto. Carga fuentes, los dos CSS y los siete JS en orden, todos con `?v=1.0.0`. |
| `manifest.webmanifest`, `icono.svg` | | Para «Agregar a pantalla de inicio». No hay service worker: la app no funciona sin conexión. |
| `version.json` | | `{"version": "1.0.0", "notas": ""}`. La app lo consulta para avisar de una versión nueva. |
| `css/tema.css` | 41 | Variables: colores, tipografías, radios, sombra, ancho máximo. Cambiar la estética empieza aquí. |
| `css/app.css` | 351 | Componentes, organizados por secciones comentadas. |
| `js/config.js` | 21 | `window.LE_CONFIG`: `VERSION`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DOMINIO_USUARIOS`, `NOMBRE_TUTOR`. |
| `js/nucleo.js` | 210 | El objeto global `LE`: utilidades, rutas, acciones, diálogos, componentes compartidos y cronómetro de estudio. |
| `js/api-demo.js` | 404 | `LE_ApiDemo()`: réplica en JavaScript de las funciones SQL, con datos de muestra. |
| `js/api-supabase.js` | 75 | `LE_ApiSupabase(cfg)`: la misma interfaz, hablando con Supabase. |
| `js/vistas-estudiante.js` | 602 | Inicio, mensajes, reto, simulacro, diagnóstico y perfil. |
| `js/vistas-tutor.js` | 383 | Panel, detalle de estudiante, contenido y validación de paquetes. |
| `js/app.js` | 158 | Arranque: elige API, pantalla de ingreso, estructura con navegación, novedades, aviso de versión. |
| `supabase/01_esquema.sql` | 239 | Tablas, índices, políticas RLS y el disparador que crea el perfil. |
| `supabase/02_funciones.sql` | 671 | Toda la lógica. Se puede volver a ejecutar completo. |
| `supabase/03_carga_inicial.sql` | 9 | Configuración base, 23 insignias, paquete-001 y la novedad de bienvenida. Se ejecuta una sola vez. |
| `content/base.json` | | Configuración e insignias de fábrica. |
| `content/paquete-001.json` | | Las primeras 5 lecturas y 30 preguntas. |
| `content/plantilla-paquete.json` | | Modelo para paquetes nuevos. El panel del tutor lo ofrece para descargar. |
| `tools/generar_contenido.py` | 298 | Generó `base.json`, `paquete-001.json` y `03_carga_inicial.sql`. Reparte la respuesta correcta entre A y D. |
| `tools/construir_demo.py` | 31 | Arma `demo.html`: la app completa en un solo archivo, siempre en modo demo. |
| `demo.html` | | Resultado del script anterior. Se abre con doble clic. |
| `README.md` | | Puesta en marcha y actualización, escrito para Diego. |

## El front por dentro

### El objeto `LE`

Todo cuelga de `window.LE` (definido en `nucleo.js`):

- `LE.cfg`: la configuración de `config.js`.
- `LE.api`: la API activa, de Supabase o demo.
- `LE.estado`: `perfil`, `config` (la tabla `app_config` como objeto), `insignias` (catálogo), `sesion` (reto en curso), `sim` (simulacro en curso), `diag` (diagnóstico en pantalla), `alertas`, `vistaEst`, `paqueteListo`.
- `LE.rutas` y `LE.acciones`: registro de pantallas y de manejadores de clic.

### Rutas

Navegación por hash. Una pantalla se registra así:

```js
LE.ruta("/tutor/estudiante/:id", async ({ id }) => { ... LE.montar(html) ... }, { tutor: true });
```

Opciones: `tutor: true` (solo tutor), `estudiante: true` (solo estudiante), `sesion: true` (oculta la navegación mientras se responde). `LE.ir("#/inicio")` navega y `LE.montar(html)` pinta dentro de `<main id="vista">`.

| Ruta | Quién | Pantalla |
|---|---|---|
| `#/inicio` | estudiante | Saludo, XP, mensajes pendientes, retos del día, ecualizador, acceso al simulacro |
| `#/mensajes` | estudiante | Todo lo que ha escrito el tutor |
| `#/reto` | estudiante | Reto o misión en curso, y su pantalla final |
| `#/simulacro` | estudiante | Niveles e historial |
| `#/simulacro/jugar` | estudiante | Simulacro en curso |
| `#/diagnostico/:id` | ambos | Resultado de un simulacro (`nuevo` para el recién entregado) |
| `#/perfil` | estudiante | Estadísticas, mapa de calor, dominio, insignias, editar perfil, cerrar sesión |
| `#/tutor` | tutor | Alertas y lista de estudiantes |
| `#/tutor/estudiante/:id` | tutor | Detalle, compositor de mensajes, preguntas falladas |
| `#/tutor/contenido` | tutor | Banco, paquetes cargados y carga de paquetes |
| `#/salir` | ambos | Cierra la sesión |

### Acciones

Los clics se manejan por delegación. En el HTML se escribe `data-accion="nombre"` y en el JS `LE.acciones.nombre = (boton, evento) => { ... }`. Los datos viajan en atributos `data-*` del botón. No hay `onclick` sueltos ni listeners por elemento, salvo formularios y casos puntuales dentro de diálogos.

### Utilidades que hay que usar

| Función | Para qué |
|---|---|
| `LE.esc(texto)` | Escapar todo dato antes de meterlo en HTML. Obligatorio. |
| `LE.md(texto)` | Markdown mínimo de las lecturas: `### título`, `- lista`, `**negrita**`, `*cursiva*`. Un salto de línea simple se conserva (sirve para poemas); una línea en blanco separa párrafos. |
| `LE.cat(c)` | Nombre, color y descripción de una categoría, leídos de la configuración. |
| `LE.dialogo(html, opciones)` | Abre un `<dialog>`; cualquier botón con `data-valor` lo cierra y devuelve ese valor. |
| `LE.confirmar(título, texto, sí, no)` | Diálogo de confirmación; devuelve verdadero o falso. |
| `LE.aviso(msg, tipo)` y `LE.error(e)` | Avisos breves en pantalla. |
| `LE.premios(lista)` | Muestra una por una las insignias recién ganadas. |
| `LE.ecualizador(dominio, opciones)` | Las cuatro columnas de dominio. |
| `LE.pistaXP(xp)` | Barra de progreso hacia el siguiente rango. |
| `LE.calor(dias)` | Mapa de calor de 28 días. |
| `LE.lecturaHTML(texto, plegable)` | La lectura sobre papel. |
| `LE.cronometro` | Cuenta el tiempo de estudio (ver `04`). |
| `LE.validarPaquete(p)` | Revisa un paquete antes de cargarlo (está en `vistas-tutor.js`). |

### La interfaz de la API

Las vistas nunca hablan con Supabase directamente: llaman a `LE.api`. Las dos implementaciones exponen exactamente los mismos métodos.

| Método | Qué hace | En Supabase |
|---|---|---|
| `sesionActual()`, `entrar(usuario, clave)`, `salir()`, `perfil()` | Sesión | Auth + tabla `perfiles` |
| `config()`, `insignias()` | Configuración y catálogo | Tablas `app_config`, `insignias` |
| `novedadesPendientes(ultima)`, `marcarNovedades()` | Novedades al entrar | Tabla `novedades`, `marcar_novedades_vistas` |
| `actualizarPerfil(nombre, avatar, meta)` | Editar perfil | `actualizar_perfil` |
| `iniciarReto(n, categoria, mensajeId)` | Empieza reto o misión | `iniciar_reto` |
| `responder(sesion, pregunta, opcion, ms)` | Califica una respuesta | `responder` |
| `finalizarReto(sesion)` | Cierra y da bonos e insignias | `finalizar_reto` |
| `iniciarSimulacro(nivel)` | Empieza o retoma | `iniciar_simulacro` |
| `entregarSimulacro(sesion, respuestas)` | Califica todo | `entregar_simulacro` |
| `detalleSesion(sesion)` | Para revisar un simulacro pasado | `detalle_sesion` |
| `registrarTiempo(segundos)` | Suma tiempo de estudio | `registrar_tiempo` |
| `resumen(id)` | Todo lo del perfil o del detalle del tutor | `resumen_estudiante` |
| `mensajes(estudianteId)`, `marcarLeido(id)` | Bandeja | Tabla `mensajes`, `marcar_mensaje_leido` |
| `panel()`, `generarAlertas()`, `alertas()`, `cerrarAlerta(id, estado)` | Panel del tutor | `panel_tutor`, `generar_alertas`, tabla `alertas` |
| `enviarMensaje(m)`, `borrarMensaje(id)` | Mensajes, misiones y comentarios | Escritura directa en `mensajes` (lo permite la política del tutor) |
| `preguntasFalladas(id)`, `resumenContenido()`, `importarPaquete(p)` | Seguimiento y contenido | Funciones SQL del mismo nombre en `snake_case` |
| `reiniciar()` | Solo demo: borra los datos de prueba | No existe en Supabase |

### Lo que se guarda en el navegador

- `entrelineas-demo-v1`: la base de datos completa del modo demo.
- `sim-<id de sesión>`: respuestas, posición y marcas de un simulacro en curso, para que sobrevivan a una recarga. Se borra al entregar.
- La sesión de Supabase, que guarda la propia librería.

## La base de datos

### Tablas

| Tabla | Qué guarda | Notas |
|---|---|---|
| `perfiles` | Una fila por usuario: `nombre`, `usuario`, `rol` (`estudiante` o `tutor`), `avatar`, `xp`, `meta_programa`, `ultima_novedad`, `activo` | Se crea sola al añadir un usuario en Authentication (disparador `crear_perfil`). |
| `textos` | Lecturas: `codigo`, `titulo`, `tipologia`, `contenido`, `fuente`, `paquete`, `activo` | |
| `preguntas` | `codigo`, `texto_id`, `categoria`, `dificultad` (1 a 3), `enunciado`, `opciones` (arreglo de 4), `correcta` (0 a 3), `explicacion`, `paquete`, `activo` | La estudiante no puede leer esta tabla. |
| `sesiones` | Cada reto, misión o simulacro: `tipo`, `nivel`, `total`, `correctas`, `xp`, `preguntas` (arreglo de ids), `mensaje_id`, `inicio`, `limite`, `fin`, `resultado` (JSON) | En retos, `nivel` guarda la categoría o la cantidad; en simulacros, el nivel. |
| `respuestas` | Cada respuesta: `pregunta_id`, `sesion_id`, `opcion`, `correcta`, `tiempo_ms`, `contexto` | Es la fuente de dominio, rachas, tendencias y alertas. |
| `actividad_diaria` | Segundos de estudio por usuario y fecha | |
| `insignias` | Catálogo: `codigo`, `nombre`, `descripcion`, `icono`, `color`, `regla` (JSON), `orden`, `activo` | |
| `insignias_usuario` | Qué insignia ganó quién y cuándo | |
| `app_config` | Pares `clave` → `valor` (JSON) | Claves: `distribucion`, `categorias`, `retos`, `simulacros`, `xp`, `rangos`, `referencias`, `alertas`, `avatares`. |
| `novedades` | Avisos que la estudiante ve al entrar | |
| `mensajes` | Lo que el tutor envía: `tipo` (`mensaje`, `mision`, `comentario`), `titulo`, `cuerpo`, `mision` (JSON), `pregunta_id`, `leido`, `completado`, `sesion_id` | En una misión, `mision` es `{"n": 10, "categoria": "critico"}`. En un comentario, `{"cita": "...", "correcta": "B. ..."}`. |
| `alertas` | Avisos para el tutor: `tipo` (`inactividad` o `caida`), `detalle`, `sugerencia`, `estado` (`abierta`, `atendida`, `descartada`) | |

### Permisos (RLS)

Todas las tablas tienen seguridad por filas. La regla general: cada estudiante ve lo suyo y el tutor ve todo.

| Tabla | Estudiante | Tutor |
|---|---|---|
| `perfiles` | Lee el suyo. Lo edita solo a través de `actualizar_perfil` | Lee y edita todos |
| `textos`, `insignias`, `app_config`, `novedades` | Lee | Lee y escribe |
| `preguntas` | Nada | Lee y escribe |
| `sesiones`, `respuestas`, `actividad_diaria`, `insignias_usuario` | Lee lo suyo | Lee todo |
| `mensajes` | Lee los suyos | Lee y escribe |
| `alertas` | Nada | Lee y escribe |

Nadie escribe directamente en `sesiones`, `respuestas`, `actividad_diaria` ni `insignias_usuario`: solo las funciones. Por eso las funciones son `security definer` y validan con `auth.uid()` quién las llama.

Al final de `02_funciones.sql` se retira el permiso de ejecución a los usuarios anónimos y se concede a los autenticados, salvo tres funciones internas que nadie puede llamar desde fuera: `aplicar_paquete`, `evaluar_insignias` y `seleccionar_preguntas`.

### Funciones SQL

| Función | Devuelve | Quién |
|---|---|---|
| `hoy()`, `dia(ts)` | Fecha en hora de Bogotá | utilidades |
| `cfg(clave)` | El valor de `app_config` | utilidad |
| `es_tutor()`, `puede_ver(uid)` | Verdadero o falso | utilidades de permisos |
| `dominio_categorias(uid)` | `categoria`, `dominio`, `respondidas` | utilidad |
| `rachas(uid)` | `actual`, `mejor` | utilidad |
| `seleccionar_preguntas(uid, n, categoria)` | Arreglo de ids | interna |
| `empaquetar(ids)` | Preguntas sin clave y sus textos | utilidad |
| `iniciar_reto(n, categoria, mensaje)` | `sesion_id`, `tipo`, preguntas, textos | estudiante |
| `responder(sesion, pregunta, opcion, tiempo_ms)` | `correcta`, `opcion_correcta`, `explicacion`, `xp` | estudiante |
| `finalizar_reto(sesion)` | Resultado, `nuevas_insignias`, `xp_total` | estudiante |
| `iniciar_simulacro(nivel)` | `sesion_id`, `limite`, `ahora`, `retomado`, preguntas, textos | estudiante |
| `entregar_simulacro(sesion, respuestas)` | Resultado completo con detalle | estudiante |
| `detalle_sesion(sesion)` | Sesión y textos | dueña o tutor |
| `registrar_tiempo(segundos)` | | estudiante |
| `evaluar_insignias(uid)` | Insignias recién ganadas | interna |
| `resumen_estudiante(uid)` | Perfil, rachas, minutos, 28 días, dominio, tendencia, totales, insignias, simulacros | dueña o tutor |
| `actualizar_perfil`, `marcar_mensaje_leido`, `marcar_novedades_vistas` | | estudiante |
| `panel_tutor()`, `generar_alertas()`, `preguntas_falladas(uid)`, `resumen_contenido()` | | tutor |
| `importar_paquete(json)` → `aplicar_paquete(json)` | Conteo de lo cargado | tutor (la segunda es interna) |
| `crear_perfil()` | | disparador sobre `auth.users` |

La zona horaria está fija en `America/Bogota` dentro de `hoy()` y `dia()`. Rachas, minutos por día y mapa de calor dependen de ellas.

## Cómo arranca la app

1. `index.html` carga `config.js`, `nucleo.js`, `api-demo.js`, `api-supabase.js`, `vistas-estudiante.js`, `vistas-tutor.js` y `app.js`, en ese orden. El orden importa: las vistas necesitan `LE` y `app.js` necesita las rutas ya registradas.
2. `app.js` decide: con URL y clave de Supabase, carga la librería desde el CDN y usa `LE_ApiSupabase`; sin ellas, `LE_ApiDemo`.
3. Si hay sesión guardada, entra directo; si no, pinta el ingreso. El usuario `sofia` se convierte en `sofia@entrelineas.app`.
4. `arrancar(perfil)` carga configuración e insignias, pinta la barra con la navegación del rol, activa las rutas y navega.
5. Para estudiantes arranca el cronómetro y se muestran las novedades pendientes (hasta tres).
6. Cada 10 minutos, y cada vez que la pestaña vuelve a estar visible, se consulta `version.json`. Si la versión publicada es distinta de `LE.cfg.VERSION`, aparece la banda «Hay una versión nueva» con el botón Actualizar.

## El modo demo

- Usuarios: `sofia` / `demo` (estudiante) y `tutor` / `demo`.
- Siembra un historial de muestra: doce días de retos, un simulacro inicial con 56,7 %, una caída del nivel inferencial en la última semana para que el tutor vea una alerta, una misión pendiente y un mensaje leído.
- En el perfil de la estudiante hay un botón «Reiniciar datos del demo».
- `demo.html` trae incrustados `content/base.json` y `content/paquete-001.json`. Si se quiere que el demo incluya paquetes nuevos, hay que añadirlos en dos sitios: la lista `paquetes` de `tools/construir_demo.py` y la función `cargarDatos()` de `js/api-demo.js`.
- Como `js/config.js` ya tiene las credenciales reales, la única forma de ver el modo demo es abrir `demo.html`: el script que lo construye neutraliza la URL de Supabase.

---

## Razonamiento Lógico (versión 1.1.0)

### Archivos nuevos y archivos que cambiaron

| Archivo | Qué cambió |
|---|---|
| `supabase/04_razonamiento_logico.sql` | **Nuevo.** Migración: columnas y tabla nuevas. Se puede ejecutar más de una vez. |
| `supabase/02_funciones.sql` | Todas las funciones que eligen, califican o resumen distinguen componente. Funciones nuevas: `componente_de`, `cuaderno_errores`, `aplicar_pregunta`. Al comienzo retira cuatro funciones cuya lista de parámetros cambió. |
| `supabase/respaldo/volver_a_1.0.0.sql` | **Nuevo.** Las funciones de la 1.0.0, para una emergencia. |
| `js/vistas-logica.js` | **Nuevo.** Portada de Lógica, caja de herramientas y cuaderno de errores. |
| `js/nucleo.js` | `LE.COMP` (los dos componentes), cuadros en `LE.md`, `LE.figura` (limpieza de SVG), `LE.plano`, tipos de error, fichas, `LE.diagnosticoError`, `LE.pasosHTML`, `LE.perfilErrores`. |
| `js/vistas-estudiante.js` | `LE.portada(comp)` sirve a las dos portadas; el reto, el simulacro y el diagnóstico pintan preguntas de cualquiera de los dos componentes. |
| `js/vistas-tutor.js` | Dominio y errores de lógica, misiones por componente, banco de lógica, validador de paquetes de lógica. |
| `js/api-supabase.js`, `js/api-demo.js` | Métodos nuevos `tecnicas()` y `cuaderno()`; parámetros de componente, técnica y pista. |
| `js/app.js` | La navegación depende de si Lógica está activada. Carga las técnicas junto con la configuración. |
| `css/app.css` | Sección «Lógica»; colores de los cuatro niveles; acento por componente; arreglo de la navegación en celular. |
| `index.html` | Carga `js/vistas-logica.js` (diez `?v=`). |
| `content/logica-base.json`, `logica-001.json`, `logica-002.json`, `plantilla-logica.json` | **Nuevos.** |
| `tools/generar_logica.py` y `tools/logica/` | **Nuevos.** Fuente de los paquetes de lógica, con comprobaciones. |
| `tools/construir_demo.py` | Incluye todos los paquetes de `content/` (lectura y lógica) y ya no deja el `">` suelto. |
| `tools/pruebas/` | **Nuevo.** Guiones de prueba: SQL contra un Postgres local, comparación demo/SQL y recorrido del demo. |

Orden de carga de los scripts: `config`, `nucleo`, `api-demo`, `api-supabase`, `vistas-estudiante`, `vistas-logica`, `vistas-tutor`, `app`.

### Componentes en el front

```js
LE.COMP = {
  lectura: { nombre: "Lectura", ruta: "#/inicio", cats: ["literal", "inferencial", "critico", "cohesion"], … },
  logica:  { nombre: "Lógica",  ruta: "#/logica", cats: ["deductivo", "proporcional", "abstracto", "geometrico"], … }
};
```

| Utilidad | Para qué |
|---|---|
| `LE.logicaActiva()` | Verdadero si existe la clave de configuración `retos_logica`, es decir, si el tutor cargó `logica-base`. Si es falso, la navegación y las pantallas son las de la 1.0.0. |
| `LE.compActual(nuevo)` | Lee o guarda (en `localStorage`, clave `le-componente`) el componente en el que estuvo la estudiante. De ahí sale a qué portada vuelve y qué simulacros ve. |
| `LE.cfgDe(clave, comp)` | Devuelve `config[clave]` para lectura y `config[clave + "_logica"]` para lógica. |
| `LE.compDe(categoria)` | A qué componente pertenece una categoría. |
| `LE.md(texto)` | Ahora también arma cuadros: filas que empiezan y terminan con `|`; la primera es el encabezado. |
| `LE.figura(svg)` | Reconstruye el SVG dejando pasar solo las etiquetas y atributos de dibujo de una lista blanca. Nunca se inserta el SVG tal cual. |
| `LE.plano(texto, max)` | Enunciado en una línea, sin marcas, para resúmenes y citas. |
| `LE.tecnica(codigo)`, `LE.estadoTecnica(x)` | Ficha de una técnica y su estado (`nueva`, `proceso`, `dominada`). |
| `LE.tipoError(tipo)` | Nombre y consejo de un tipo de error (configuración `tipos_error`, con valores de respaldo en el código). |
| `LE.empezarReto({ n, cat, comp, tema, mensajeId, boton })` | Punto único para empezar un reto, una misión, un reto por técnica o un repaso (`tema: "@errores"`). |

`LE.estado` tiene además `tecnicas` (las fichas activas).

### Rutas nuevas

| Ruta | Pantalla |
|---|---|
| `#/logica` | Portada de Lógica: retos, «Aprende de tus errores», ecualizador lógico, simulacro |
| `#/logica/tecnicas` | Caja de herramientas |
| `#/logica/tecnica/:cod` | Ficha de una técnica, con su avance y el botón para practicarla |
| `#/logica/errores` | Cuaderno de errores |

`#/simulacro` muestra el componente actual, con un selector Lectura | Lógica. `#/reto`, `#/simulacro/jugar` y `#/diagnostico/:id` son comunes: se adaptan según el componente de la sesión.

### Cambios en la API

| Método | Cambio |
|---|---|
| `tecnicas()` | **Nuevo.** Fichas activas. Si la tabla no existe todavía, devuelve una lista vacía. |
| `cuaderno(componente, id)` | **Nuevo.** Perfil de errores, avance por técnica, preguntas pendientes y errores corregidos. Función SQL `cuaderno_errores`. |
| `iniciarReto(n, categoria, mensajeId, componente, tema)` | Dos parámetros más. Si hay categoría, el componente sale de ella. |
| `responder(sesion, pregunta, opcion, ms, pista)` | Un parámetro más. Devuelve además `pasos`, `tema` y `error` (el diagnóstico de la opción marcada, si falló). |
| `iniciarSimulacro(nivel, componente)` | Un parámetro más. Devuelve `componente`. |
| `resumen(id)` | Devuelve además `dominio_logica` y `por_componente`; cada simulacro trae `componente`. `dominio` sigue siendo solo de lectura. |
| `entregarSimulacro` | El resultado trae `componente`, `por_error`, `por_tema` y, en cada pregunta del detalle, `figura`, `tema`, `pasos`, `tiempo_ms` y `error`. |

En `api-supabase.js`, `iniciarReto`, `responder` e `iniciarSimulacro` reintentan con la forma de la 1.0.0 si la base todavía no tiene las funciones nuevas. Es una red de seguridad por si el front se publica antes de ejecutar el SQL; para Lógica no hay reintento posible.

### Cambios en la base de datos

| Tabla | Columnas nuevas |
|---|---|
| `preguntas` | `componente` (`lectura` o `logica`), `tema` (código de la técnica), `pista`, `pasos` (lista JSON), `errores` (lista JSON de 4, alineada con las opciones), `figura` (SVG). `texto_id` ahora puede ser nulo: un problema de lógica puede ir suelto. La lista de categorías permitidas pasa a ocho. |
| `textos` | `componente`, `figura`. Tipología nueva: `situacion`. |
| `sesiones` | `componente`. En un reto por técnica, `nivel` guarda el código de la técnica; en un repaso, `@errores`. |
| `respuestas` | `pista` (si pidió la pista antes de responder). |
| `tecnicas` (**nueva**) | `codigo`, `componente`, `categoria`, `nombre`, `cuando`, `pasos`, `ejemplo`, `trampa`, `orden`, `activo`. Lectura para cualquier usuario autenticado; escritura solo del tutor. |

Todo lo que existía antes de la migración queda con `componente = 'lectura'` por el valor por defecto.

Funciones:

| Función | Cambio |
|---|---|
| `componente_de(categoria)` | **Nueva.** `logica` para las cuatro categorías de lógica; `lectura` para el resto. |
| `seleccionar_preguntas(uid, n, categoria, componente, tema)` | Filtra por componente y, si viene, por técnica. Con `tema = '@errores'` devuelve solo lo pendiente del cuaderno. Interna. |
| `empaquetar(ids)` | Cada pregunta trae además `componente`, `figura` y `pista`. Nunca `correcta`, `pasos`, `errores`, `tema` ni `explicacion`. |
| `iniciar_reto(p_n, p_categoria, p_mensaje, p_componente, p_tema)` | Ver API. |
| `responder(p_sesion, p_pregunta, p_opcion, p_tiempo_ms, p_pista)` | Ver API. |
| `iniciar_simulacro(p_nivel, p_componente)` | Lectura: lecturas completas, como antes. Lógica: cupo por nivel. Si hay un simulacro abierto, retoma ese, sea del componente que sea. |
| `entregar_simulacro` | Ver API. |
| `cuaderno_errores(p_componente, p_uid)` | **Nueva.** Solo devuelve preguntas que esa persona ya respondió. Comprueba permisos con `puede_ver`. |
| `dominio_categorias(uid)` | Devuelve las ocho categorías. |
| `evaluar_insignias(uid)` | Reglas con `componente` opcional y dos tipos nuevos (ver `04`). |
| `resumen_estudiante`, `panel_tutor`, `generar_alertas`, `preguntas_falladas`, `resumen_contenido` | Datos de lógica añadidos. Ningún campo anterior cambió de nombre ni de significado. |
| `aplicar_pregunta(q, texto, paquete)` | **Nueva**, interna. Inserta o actualiza una pregunta; rechaza categorías desconocidas. |
| `aplicar_paquete(p)` | Acepta además `preguntas` (sueltas) y `tecnicas`. |

`04` y `02` terminan con `notify pgrst, 'reload schema'`, para que la API de Supabase relea funciones y tablas.

### Compatibilidad entre versiones

- **SQL nuevo con front 1.0.0:** funciona. Las funciones nuevas tienen valores por defecto en los parámetros añadidos, y `resumen.dominio` sigue trayendo solo lectura. Se probó llamando las funciones con los nombres de parámetros que usa la 1.0.0.
- **Front 1.1.0 con SQL viejo:** Lectura funciona gracias al reintento; Lógica no aparece (no hay `retos_logica`).
- **Volver atrás:** `supabase/respaldo/volver_a_1.0.0.sql` retira las funciones nuevas, repone las de la 1.0.0 y desactiva las preguntas de lógica para que no se cuelen en retos de lectura. No borra columnas ni datos.

### El demo

La clave de almacenamiento pasó a `entrelineas-demo-v2`. `demo.html` trae incrustados `base.json`, los cinco paquetes de lectura y los tres de lógica. Siembra además cuatro días de retos de lógica con fallos, para que el cuaderno, el perfil de errores y la caja de herramientas tengan qué mostrar.
