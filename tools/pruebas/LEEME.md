# Guiones de prueba

Sirven para comprobar un cambio antes de publicarlo. No hacen parte de la app y no hace falta subirlos a GitHub (tampoco estorban si se suben). Están pensados para que Claude los ejecute en su espacio de trabajo cuando se le pida un cambio; necesitan Python, Playwright con Chromium y, los de SQL, un Postgres local.

| Guion | Qué comprueba |
|---|---|
| `recorrido_estudiante.py` | El demo como estudiante, en celular: retos de lectura y de lógica, técnica, repaso de errores, simulacro de lógica, diagnóstico. Falla si un reto mezcla componentes o si hay errores de JavaScript. |
| `recorrido_tutor.py` | El demo como tutor: panel, detalle, misiones de lógica, contenido y validador de paquetes. |
| `recorrido_comunidad.py` | La 1.2.0 en el demo: el tutor crea una cuenta (contraseña temporal, mensaje para WhatsApp), restablece, desactiva y activa, arma un grupo, explora el banco y practica como estudiante; la persona nueva cambia la contraseña en el primer ingreso, ve el paso de instalar, entra a sus grupos; instrucciones de instalación en iPhone, Android y computador; la navegación de seis entradas en 320 px; una cuenta desactivada no entra. |
| `prueba_sql.py` | Las funciones de `supabase/` en un Postgres de verdad: base desde cero, paquetes, retos, pista, diagnóstico de errores, cuaderno, simulacros, insignias, tutor y permisos; desde la 1.2.0 también cuentas, contraseñas (cifrado bcrypt verificado), desactivar, grupos, privacidad entre compañeros y práctica del tutor. |
| `comparar_formas.py` | Que el demo y el SQL respondan con las mismas claves. |
| `imitacion_supabase.sql` | Lo mínimo de Supabase que necesita `prueba_sql.py`: los roles `anon` y `authenticated`, `auth.users` (con las columnas que llena `crear_usuario`), `auth.identities`, `auth.uid()`, `auth.role()` y pgcrypto en el esquema `extensions`, como en Supabase. |

`comparar_formas.py` puede informar dos o tres diferencias que no son fallos: `textos.<clave>` (el reto o simulacro que salió en un lado no traía ninguna situación) y `sesion.mensaje_id` (el demo no guarda ese campo en los simulacros). Cualquier otra diferencia hay que mirarla.

Orden habitual:

```
python3 tools/generar_logica.py        # si cambió algo en tools/logica/
python3 tools/construir_demo.py
python3 tools/pruebas/recorrido_estudiante.py
python3 tools/pruebas/recorrido_tutor.py
python3 tools/pruebas/recorrido_comunidad.py
python3 tools/pruebas/prueba_sql.py && python3 tools/pruebas/comparar_formas.py
```

Para levantar un Postgres local de pruebas (versión 16, sin clave, puerto 5544):

```
initdb -D /ruta/datos -A trust -U postgres
pg_ctl -D /ruta/datos -o "-p 5544 -k /tmp" -l /ruta/log start
```

Ninguno de estos guiones toca la base real de Supabase. Para un cambio de SQL, la prueba final sigue siendo la de `_contexto/07-como-hacer-cambios.md`: un usuario de prueba en la app publicada.

Si Playwright no puede descargar su Chromium, cualquier Chrome instalado sirve: basta pasar `executable_path` a `chromium.launch()`.
