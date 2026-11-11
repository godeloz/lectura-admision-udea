# 07 · Cómo hacer cambios

## Primero: ¿qué tipo de cambio es?

| Quiero… | Tipo | Qué se toca | ¿Sube versión? | ¿GitHub? | ¿Supabase? |
|---|---|---|---|---|---|
| Más lecturas y preguntas, corregir una pregunta, retirar una | A. Contenido | Un paquete JSON | No | No | No (se carga desde la app) |
| Más problemas de lógica, una ficha de técnica nueva, corregir una nota de error | A. Contenido de lógica | `tools/logica/` y `tools/generar_logica.py`, que producen el paquete JSON | No | No | No (se carga desde la app) |
| Cambiar XP, rangos, tiempos del simulacro, distribución, umbrales de alertas, avatares; añadir insignias | B. Gamificación | Un paquete JSON con `config` o `insignias` | No | No | No (se carga desde la app) |
| Cambiar colores, tipografías, tamaños, disposición | C. Diseño | `css/tema.css`, `css/app.css` | Sí | Sí | No |
| Cambiar textos de la interfaz o cómo se ve una pantalla | D. Front | `js/vistas-*.js`, `js/nucleo.js`, `js/app.js` | Sí | Sí | No |
| Cambiar una regla (cómo se elige, califica o premia) | E. Lógica | `supabase/02_funciones.sql` y `js/api-demo.js` | Solo si cambia el front | Solo si cambia el front | Sí: ejecutar `02` completo |
| Una función nueva (pantalla, dato, herramienta del tutor) | F. Función nueva | Front + API en sus dos versiones + SQL | Sí | Sí | Sí |
| Guardar un dato que hoy no se guarda | G. Esquema | Archivo SQL nuevo `04_…sql` | Según el caso | Según el caso | Sí |

Antes de programar algo, vale la pena preguntarse si se resuelve con un paquete. Muchos ajustes de «gamificación» son tipo B y no requieren publicar nada.

---

## A. Contenido

Todo el procedimiento está en `05-contenido-y-paquetes.md`. En corto: preparar `content/paquete-00N.json`, revisarlo, cargarlo en Tutor → Contenido, guardar el archivo y anotar en la bitácora.

Para lógica, el paquete no se edita a mano: se cambia la fuente en `tools/logica/`, se ejecuta `python3 tools/generar_logica.py` (que comprueba las respuestas) y se carga el JSON que resulta. Si solo se corrige una pregunta ya cargada, basta recargar el paquete: los códigos iguales se actualizan.

## B. Gamificación por paquete

1. Mirar el valor actual. `content/base.json` tiene los de fábrica; si ya se cambiaron, mandan los de la base de datos. En Supabase, SQL Editor: `select clave, valor from app_config;`
2. Copiar **la clave completa** que se va a cambiar y modificar solo lo necesario. Cada clave de `config` reemplaza por entero a la anterior: si se manda `xp` con un solo campo, los demás desaparecen y la app usa valores por defecto del código.
3. Armar el paquete, sin `textos`:

```json
{ "paquete": "ajustes-2026-10",
  "config": {
    "alertas": { "dias_inactividad": 2, "caida_puntos": 15, "minimo_respuestas": 5 }
  },
  "insignias": [
    { "codigo": "racha-14", "nombre": "Dos semanas", "descripcion": "Catorce días seguidos practicando.",
      "icono": "🎼", "color": "rosa", "orden": 13, "regla": { "tipo": "racha", "valor": 14 } }
  ],
  "novedad": { "version": "ajustes-2026-10", "titulo": "Insignia nueva", "cuerpo": "Ahora hay una insignia por dos semanas de racha." }
}
```

4. Cargarlo en Tutor → Contenido. La configuración se aplica de inmediato para quien entre después.
5. Guardar el archivo en `content/` y anotarlo en la bitácora.

Cuidados:

- Cambiar los umbrales de `rangos` mueve a la estudiante de rango en el acto, hacia arriba o hacia abajo. Bajarla de rango desmotiva: mejor añadir rangos por encima.
- Cambiar una insignia que ya ganó no se la quita. Poner `"activo": false` la oculta del catálogo.
- En `simulacros`, las claves `inicial`, `avanzado` y `experto` están atadas a insignias (`regla.nivel`) y al historial. Se pueden cambiar sus números, no sus nombres de clave.
- En `categorias` se pueden cambiar nombre visible, color y descripción. Las ocho claves (`literal`, `inferencial`, `critico`, `cohesion` y, para lógica, `deductivo`, `proporcional`, `abstracto`, `geometrico`) están fijas en el esquema, en las funciones y en el front. Como la clave se reemplaza completa, un paquete que la toque debe traer las ocho.
- Las claves de lógica (`retos_logica`, `simulacros_logica`, `distribucion_logica`, `referencias_logica`, `tipos_error`) tienen sus valores de fábrica en `content/logica-base.json`. Si se borra `retos_logica`, Lógica desaparece de la navegación.

## C. Diseño

1. Colores, fuentes y radios: `css/tema.css`. Componentes: `css/app.css`, en la sección que corresponda.
2. Si cambia la tipografía, cambiar también el enlace de Google Fonts en `index.html`.
3. Si cambia el color de fondo, cambiarlo también en `theme-color` de `index.html`, en `manifest.webmanifest` y en `icono.svg`.
4. Revisar en celular y en computador, y con las lecturas largas: la legibilidad del texto manda.
5. Reconstruir el demo, subir versión y publicar (ver más abajo).

## D. Cambios en el front

- Textos y pantallas de la estudiante: `js/vistas-estudiante.js`. Del tutor: `js/vistas-tutor.js`. Ingreso, navegación, novedades y aviso de versión: `js/app.js`. Componentes compartidos: `js/nucleo.js`.
- Una pantalla nueva es un `LE.ruta(...)`; un botón nuevo es un `data-accion` y su `LE.acciones.nombre`. Si la pantalla va en la navegación, se añade a `navEst()` o `NAV_TUT` en `app.js`.
- Lo propio de Lógica va en `js/vistas-logica.js`. El reto, el simulacro y el diagnóstico son comunes y están en `vistas-estudiante.js`: cualquier cambio ahí afecta a los dos componentes y hay que probarlo en ambos.
- Todo dato dinámico pasa por `LE.esc()`.
- Nombres de funciones, variables y clases en español, como el resto del código.
- Los mensajes sugeridos de las alertas no están en el front: salen de `generar_alertas` en `02_funciones.sql` y de su réplica en `api-demo.js`.

## E. Cambios de lógica

1. Editar la función en `supabase/02_funciones.sql`.
2. Hacer el mismo cambio en `js/api-demo.js`, que tiene una función espejo por cada función SQL.
3. Probar en el demo.
4. En Supabase, SQL Editor: pegar y ejecutar **todo** `02_funciones.sql`. Está hecho para eso: usa `create or replace` y termina reasignando los permisos.
5. Si cambió lo que devuelve una función y el front lo usa, es también un cambio tipo D: subir versión y publicar.

Cuidados:

- `create or replace` falla si cambian los parámetros o el tipo de retorno de una función. En ese caso, añadir antes un `drop function if exists nombre(tipos);` en el mismo archivo.
- Las funciones nuevas quedan disponibles para usuarios autenticados por el `grant` del final. Si una función es interna, añadirle su `revoke` junto a los tres que ya hay.
- Toda función que reciba un `uid` ajeno debe comprobar permisos con `puede_ver(uid)` o `es_tutor()`.
- Publicar primero el SQL y después el front. Así, quien tenga abierta la versión anterior no llama a algo que todavía no existe. Y procurar que el SQL nuevo siga sirviéndole al front viejo durante esos minutos: añadir campos a una respuesta es seguro; quitarlos o renombrarlos, no.

## F. Función nueva de punta a punta

Orden recomendado:

1. Escribir en una frase qué problema resuelve y a cuál de las piezas del método sirve (`02-examen-y-metodologia.md`).
2. ¿Necesita guardar algo nuevo? Entonces empieza por G.
3. Función SQL en `02_funciones.sql`.
4. Método en `js/api-supabase.js`.
5. El mismo método en `js/api-demo.js`, con datos de muestra en `sembrar()` si hace falta para que se vea.
6. Vista y acciones.
7. Estilos.
8. Probar en el demo, reconstruir `demo.html`, subir versión, ejecutar el SQL, publicar.
9. Actualizar `README.md` si cambia algo que Diego hace a mano, y los archivos de `_contexto/` que apliquen.

## G. Cambios de esquema

La regla es no perder datos. Por eso:

- **No se edita `01_esquema.sql` para cambiar una base que ya existe.** Se crea un archivo nuevo numerado (`04_nombre.sql`, `05_…`).
- Los cambios son aditivos y repetibles: `alter table … add column if not exists …`, `create table if not exists …`, `create index if not exists …`.
- Una tabla nueva lleva `enable row level security` y sus políticas, con el patrón del esquema: la estudiante ve lo suyo y el tutor ve todo (`es_tutor()`).
- Nada de `drop table`, `drop column` ni cambios de tipo sobre columnas con datos.
- En una base existente: ejecutar el archivo nuevo y después `02_funciones.sql`.
- En una instalación desde cero el orden es: `01`, luego las migraciones `04`, `05`… en orden, luego `02` y al final `03`. Así está escrito en el `README.md`. La primera migración, `04_razonamiento_logico.sql`, sirve de modelo: columnas con `add column if not exists`, un bloque que retira y vuelve a crear las listas de valores permitidos, tabla nueva con sus políticas, y se puede ejecutar dos veces.
- El modo demo no tiene esquema: su «base» es un objeto en `localStorage`. Si la estructura cambia, subir el número de la clave (hoy `entrelineas-demo-v2`) en `api-demo.js` para que los demos viejos se regeneren.

Antes de ejecutar una migración conviene exportar a CSV, desde el Table Editor de Supabase, las tablas que guardan el progreso: `perfiles`, `respuestas`, `sesiones`, `actividad_diaria`, `insignias_usuario` y `mensajes`.

---

## Probar

### En el demo

1. Reconstruir: desde la carpeta de la app, `python3 tools/construir_demo.py`. Escribe `demo.html` e imprime su tamaño.
2. Abrir `demo.html` con doble clic.
3. Si el demo ya se había usado en ese navegador, entrar como `sofia` y pulsar «Reiniciar datos del demo» en el perfil, para partir de datos limpios.

Recorrido mínimo como estudiante (`sofia` / `demo`):

- [ ] El inicio carga con saludo, XP, racha, misión pendiente, retos y ecualizador.
- [ ] Una Canción completa: elegir, confirmar, ver explicación, terminar, ver resultado y XP.
- [ ] Salir de un reto a la mitad.
- [ ] Empezar la misión pendiente y terminarla: queda como cumplida.
- [ ] Simulacro inicial: responder algunas, marcar una, navegar por el mapa, recargar la página y retomarlo, entregar con preguntas vacías, ver el diagnóstico y abrir una lectura desde la revisión.
- [ ] Perfil: estadísticas, mapa de calor, insignias, editar nombre y avatar.
- [ ] Mensajes: se marcan como leídos y el punto rosa desaparece.

Como tutor (`tutor` / `demo`):

- [ ] El panel muestra una alerta (el demo siembra una caída en el nivel inferencial). Editar el mensaje y enviar la misión.
- [ ] Detalle de la estudiante: estadísticas, evolución semanal, simulacros, preguntas falladas.
- [ ] Enviar un mensaje, una misión y un comentario sobre una pregunta. Borrar uno.
- [ ] Contenido: pegar `content/plantilla-paquete.json`, revisar y cargar. Pegar un JSON roto y ver los errores.

En las dos vistas, revisar a 390 px de ancho (celular) y a 1280 px (computador).

Cuando la app se construyó, este recorrido se automatizó con Playwright y Chromium sobre el demo, en tamaño de escritorio y de celular. Desde la 1.1.0 los guiones están guardados en `tools/pruebas/` (ver su `LEEME.md`): `recorrido_estudiante.py` y `recorrido_tutor.py`. Claude puede ejecutarlos en su espacio de trabajo cada vez que cambie el front.

Para Lógica, el recorrido mínimo de la estudiante añade:

- [ ] La portada de Lógica carga con sus retos, su ecualizador y «Aprende de tus errores».
- [ ] Un Riff completo: pedir la pista en una, fallar otra a propósito y ver «Qué pasó», la solución paso a paso y la ficha de la técnica.
- [ ] El cierre del reto muestra «Para repasar»; «Practicar» lanza un reto de esa técnica.
- [ ] Caja de herramientas y una ficha. Cuaderno de errores: abrir una pregunta y lanzar el repaso.
- [ ] Simulacro de lógica inicial: recargar a la mitad, entregar con vacías, ver «Cómo te equivocaste» y «Técnicas para repasar».
- [ ] Un reto de lectura no trae problemas de lógica, y al revés.
- [ ] Una pregunta con figura y una situación con cuadro, a 390 px de ancho.

### En Supabase

El demo no prueba el SQL. Para cambios tipo E, F o G hay dos pruebas.

**Antes de tocar la base real**, en un Postgres local: `tools/pruebas/prueba_sql.py` monta una base desde cero con los archivos de `supabase/`, carga los paquetes y recorre las funciones como estudiante y como tutor; `tools/pruebas/comparar_formas.py` comprueba que el demo y el SQL devuelvan las mismas claves, que es justo lo que el demo solo no puede garantizar. Claude puede ejecutarlos en su espacio de trabajo.

**Después, en la app publicada:**

1. Crear en Authentication un usuario de prueba, por ejemplo `prueba@entrelineas.app`, con «Auto Confirm User».
2. Entrar a la app publicada con `prueba` y repetir el recorrido de la estudiante.
3. Entrar como tutor y comprobar que el panel y el detalle cargan.
4. Borrar el usuario de prueba en Authentication → Users. Se va con todo su historial.

---

## Publicar

### Subir la versión

El mismo número en tres sitios:

1. `js/config.js` → `VERSION: "1.0.1"`
2. `version.json` → `"version": "1.0.1"`, y en `notas` una frase corta que saldrá en el aviso («preguntas más legibles en celular»)
3. `index.html` → los diez `?v=` (dos hojas de estilo y ocho scripts)

Para comprobar que no quedó ninguno atrás: buscar el número viejo en esos tres archivos.

Numeración: el tercer dígito para correcciones (1.0.1), el segundo para funciones nuevas (1.1.0), el primero para un cambio grande (2.0.0).

Si se sube `version.json` y se olvida `config.js`, el aviso «Hay una versión nueva» aparece siempre y no se quita al actualizar. Si se olvidan los `?v=`, el navegador puede seguir usando archivos viejos guardados.

### Llevarlo a GitHub

1. En el repositorio: **Add file → Upload files**.
2. Arrastrar los archivos que cambiaron, respetando su carpeta (`js/…`, `css/…`). Si se arrastra el contenido completo de `entrelineas`, GitHub reemplaza lo que cambió y deja igual lo demás.
3. **Commit changes**.
4. Esperar uno o dos minutos y abrir la app. Quien la tenga abierta verá el aviso en los siguientes 10 minutos o al volver a la pestaña.

`js/config.js` lleva la URL y la clave pública de Supabase. Es correcto que esté en el repositorio: es la clave `publishable`, y los permisos los controla la base de datos. La clave `service_role` o `secret` no va nunca en ningún archivo de esta carpeta.

### Volver atrás

- **Front:** cada subida a GitHub queda en el historial del repositorio; se puede recuperar la versión anterior de cualquier archivo. Antes de un cambio grande, además, duplicar la carpeta `entrelineas` dentro de «Versiones de la App UdeA» con el número de versión en el nombre.
- **SQL:** guardar copia del `02_funciones.sql` anterior. Volver a ejecutarlo restaura la lógica, salvo cuando la versión nueva cambió los parámetros de una función: entonces hay que retirar primero las funciones nuevas. Para el paso de la 1.0.0 a la 1.1.0 eso ya está resuelto y probado en `supabase/respaldo/volver_a_1.0.0.sql`. Conviene dejar un archivo así en cada cambio de SQL que modifique parámetros.
- **Paquetes:** un paquete mal cargado se corrige cargando otro con los mismos códigos y el contenido bueno, o con `"activo": false`.

---

## Tareas de administración

**Agregar una estudiante.** Supabase → Authentication → Users → Add user → Create new user: correo `nombre@entrelineas.app`, contraseña y «Auto Confirm User». El perfil se crea solo y aparece en el panel del tutor. Para ponerle nombre completo:

```sql
update perfiles set nombre = 'Nombre Apellido' where usuario = 'nombre';
```

**Convertir a alguien en tutor.**

```sql
update perfiles set rol = 'tutor' where usuario = 'diego';
```

**Cambiar una contraseña.** La estudiante no puede hacerlo desde la app.

```sql
update auth.users set encrypted_password = extensions.crypt('nueva-clave', extensions.gen_salt('bf'))
where email = 'nombre@entrelineas.app';
```

**Sacar a una estudiante del panel sin borrar su historial.**

```sql
update perfiles set activo = false where usuario = 'nombre';
```

**Ver la configuración vigente.**

```sql
select clave, valor from app_config order by clave;
```

**El proyecto de Supabase se pausó.** En el plan gratuito pasa tras una semana sin actividad. Se reactiva desde el panel de Supabase con un clic; no se pierde nada.

---

## Al terminar cualquier cambio

1. Añadir una entrada en `_contexto/09-bitacora.md`.
2. Actualizar el archivo de `_contexto/` que haya quedado desactualizado (una regla en `04`, una tabla en `03`, el inventario en `05`, el estado en `00` y `08`).
3. Si cambió algo que Diego hace a mano, actualizar `README.md`.
