# Instituto Santa Ana Luz del Carmen

Sitio institucional del Instituto Santa Ana Luz del Carmen, creado con HTML, CSS, JavaScript y Node.js + Express. Incluye la página pública, un panel para que las directivas actualicen el contenido sin tocar el código y una sección de Actividades donde estudiantes y profesores entran con su cuenta de Google.

## Qué incluye

- Página pública con las secciones Inicio, Actividades, Académico, Instalaciones, Docentes, Noticias, Galería, Contacto y Grado Once.
- Tarjetas de Misión, Visión, Valores y Manual, y avisos en la barra lateral.
- Carruseles de Docentes, Noticias y Grado Once, y galería de fotos.
- Textos largos recortados con puntos suspensivos (…) y un botón **Ver más / Ver menos**, para que las tarjetas no se deformen sin importar cuánto se escriba en el panel.
- Panel de directivas (`admin.html`) para editar textos, avisos, docentes, instalaciones y fotos.
- Ingreso con Google en Actividades: los correos registrados como profesores entran como profesores y cualquier otro correo entra como estudiante.

## Estructura del proyecto

```text
instituto-santa-ana-luz-del-carmen/
├── index.html              # Página pública
├── styles.css              # Estilos de la página pública
├── main.js                 # Secciones, carruseles, recorte de textos y login de Actividades
├── admin.html              # Panel de directivas
├── admin.js                # Lógica del panel
├── admin.css               # Estilos del panel
├── server.js               # Servidor Express y APIs
├── package.json            # Scripts y dependencias
├── .env.example            # Plantilla de configuración (copiar como .env)
├── data/
│   ├── site-content.json   # Contenido editable del sitio
│   ├── usuarios.json       # Cuentas que han entrado con Google (se crea solo, no se sube a GitHub)
│   └── profesores.json     # Correos de profesores (se crea solo, no se sube a GitHub)
├── fotos-docentes/         # Fotos de docentes
├── fotos-galeria/          # Fotos de la galería
├── fotos-grado-once/       # Fotos del Grado Once
├── fotos-instalaciones/    # Fotos de instalaciones
└── fotos-noticias/         # Imágenes de noticias
```

## Requisitos

- Node.js 18 o superior (con npm)

## Instalación en un computador nuevo

```bash
cd "d:\ruta\al\proyecto\instituto-santa-ana-luz-del-carmen"
npm install
```

Luego crea el archivo `.env` (ver la sección siguiente).

## Configuración (`.env`)

Copia `.env.example` con el nombre `.env` y llena los valores:

```bash
ADMIN_EMAIL=correo-de-las-directivas@ejemplo.com
ADMIN_PASSWORD=una-contraseña-larga-y-difícil
GOOGLE_CLIENT_ID=123456789012-xxxxxxxx.apps.googleusercontent.com
```

| Variable | Para qué sirve |
| --- | --- |
| `ADMIN_EMAIL` | Correo con el que las directivas entran a `admin.html`. |
| `ADMIN_PASSWORD` | Contraseña del panel. **Es obligatoria**: si falta, el panel no deja entrar a nadie. |
| `GOOGLE_CLIENT_ID` | ID de cliente de Google para el ingreso en Actividades. |
| `PORT` | Opcional. Puerto del servidor (por defecto 3000). Los hostings suelen ponerlo solos. |

> **Importante:** `.env` está en `.gitignore` y **nunca** debe subirse a GitHub. Si alguna vez se sube por error, cambia la contraseña de inmediato.

## Ejecutar en local

```bash
npm start
```

- Página pública: <http://localhost:3000>
- Panel de directivas: <http://localhost:3000/admin.html>

`npm run start:all` hace lo mismo y además abre las dos páginas en el navegador. El servidor solo funciona mientras la terminal siga abierta.

> `npm run frontend` sirve solo los archivos estáticos: el panel, Actividades y las APIs **no** funcionan con esa opción.

## Panel de directivas

En `admin.html`, con el correo y la contraseña del `.env`, se puede:

- Editar la información institucional, misión, visión, valores, manual, académico, actividades y contacto.
- Editar los avisos, los docentes (orden y foto) y las instalaciones.
- Manejar la lista de **Profesores** y las **Cuentas que han entrado** (ver abajo).

Grado Once no se administra desde el panel; sus datos están en `main.js`.

Tras 5 intentos fallidos de contraseña hay que esperar un minuto antes de volver a intentarlo.

## Actividades: ingreso de estudiantes y profesores

Estudiantes y profesores entran con su cuenta de Google; el sitio no guarda contraseñas.

1. La persona abre **Actividades**. Google le ofrece su cuenta ("Continuar como …") o puede pulsar **Continuar con Google**.
2. Si su correo está en la lista de **Profesores** del panel, entra como profesor; si no, entra como estudiante. No hay que aprobar a nadie.
3. Si las directivas agregan o quitan un correo de la lista, el rol de esa persona cambia de inmediato.
4. En **Cuentas que han entrado** se ve quién ha ingresado. **Quitar acceso** o **Eliminar** cierran sus sesiones al instante.
5. Quien ya entró una vez en ese navegador vuelve a entrar solo. La sesión dura 8 horas.

### Configurar Google (una sola vez)

1. Entra a <https://console.cloud.google.com/> y crea un proyecto (por ejemplo "Santa Ana").
2. En **APIs y servicios → Pantalla de consentimiento de OAuth**, elige **Externo**, escribe el nombre del instituto y un correo de soporte, y publica la app.
3. En **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**, elige **Aplicación web**.
4. En **Orígenes autorizados de JavaScript** agrega `http://localhost:3000` y, cuando el sitio esté publicado, su dirección pública (por ejemplo `https://santaana.edu.co`), sin `/` al final.
5. Copia el **ID de cliente** en `GOOGLE_CLIENT_ID` del `.env`.

Si Google muestra `origin_mismatch` o "no registered origin", falta la dirección del sitio en el paso 4.

## Publicar el sitio en internet

El sitio necesita un hosting que ejecute **Node.js** (por ejemplo Render, Railway o un servidor propio). Un hosting solo de archivos estáticos (GitHub Pages, Netlify sin funciones, Firebase Hosting solo) **no** sirve, porque el panel y Actividades necesitan `server.js`.

Pasos:

1. Sube los cambios a GitHub (ver "Comandos de Git" abajo).
2. En el hosting, crea un servicio web desde el repositorio con:
   - Comando de instalación: `npm install`
   - Comando de inicio: `npm start`
3. En las **variables de entorno** del hosting agrega `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `GOOGLE_CLIENT_ID` (los mismos del `.env`; el `.env` no viaja con GitHub).
4. En Google Cloud agrega la dirección pública del sitio a los **Orígenes autorizados de JavaScript**.
5. Abre `https://tu-sitio/api/status`: debe responder `"estado": "ok"`.

> **Ojo con los datos guardados:** lo que se edita en el panel se guarda en la carpeta `data/` y las fotos subidas en las carpetas `fotos-*`. Muchos hostings gratuitos borran esos archivos cada vez que el servicio se reinicia o se vuelve a publicar. Usa un hosting con **disco persistente** (por ejemplo un "disk" en Render) o haz copia de `data/` y de las fotos antes de cada publicación.

### Lista de revisión antes de publicar

- [ ] `npm install` y `npm start` funcionan sin errores en local.
- [ ] `ADMIN_PASSWORD` es una contraseña propia, larga y que no aparece en ningún archivo del repositorio.
- [ ] `git status` **no** muestra `.env`, `data/usuarios.json` ni `data/profesores.json`.
- [ ] Las variables de entorno están puestas en el hosting.
- [ ] La dirección pública está en Google Cloud.
- [ ] Probado: entrar al panel, guardar un cambio, entrar con Google en Actividades.

## APIs

| Método y ruta | Qué hace | Acceso |
| --- | --- | --- |
| `GET /api/status` | Estado del servidor. | Público |
| `GET /api/public-content` | Contenido público (institución, avisos, docentes, secciones). | Público |
| `GET /api/galeria` · `/api/docentes` · `/api/noticias` | Lista de imágenes de cada carpeta. | Público |
| `GET /api/instalaciones` | Lista de instalaciones. | Público |
| `POST /api/admin/login` · `/api/admin/logout` | Entrar y salir del panel. | — |
| `GET / PUT /api/admin/content` | Leer y guardar el contenido del sitio. | Directivas |
| `POST /api/admin/upload` | Subir imágenes. | Directivas |
| `GET / POST / DELETE /api/admin/profesores` | Lista de correos de profesores. | Directivas |
| `GET / PUT / DELETE /api/admin/usuarios` | Cuentas que han entrado: ver, quitar o devolver acceso, eliminar. | Directivas |
| `GET /api/actividades/config` | ID de cliente de Google para el botón. | Público |
| `POST /api/actividades/google` | Verifica el token de Google y abre la sesión con su rol. | — |
| `GET /api/actividades/me` · `POST /api/actividades/logout` | Sesión actual y salir. | Estudiantes y profesores |

Los archivos de `data/` nunca se sirven al navegador.

## Comandos de Git (Git Bash)

```bash
cd "/d/sml - copia - copia-definitiva/santa ana/instituto-santa-ana-luz-del-carmen"
git status                          # revisa que no aparezca .env
git add .
git commit -m "descripción del cambio"
git push
```

## Autor

Samuel Mateo Yate Escobar. Proyecto desarrollado para el Instituto Santa Ana Luz del Carmen.

## Licencia

MIT.
