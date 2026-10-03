# Instituto Santa Ana Luz del Carmen

Sitio institucional del Instituto Santa Ana Luz del Carmen, hecho con HTML, CSS y JavaScript y publicado en **Firebase**. Incluye la página pública, un panel para que las directivas actualicen todo el contenido sin tocar el código y una sección de Actividades donde estudiantes y profesores entran con su cuenta de Google.

## Qué incluye

- Página pública con las secciones Inicio, Actividades, Académico, Instalaciones, Docentes, Noticias, Galería, Contacto y Grado Once.
- Páginas legales: Política de tratamiento de datos personales (Ley 1581 de 2012), Términos y condiciones y Aviso de imágenes y servicios externos.
- Panel de directivas (`admin.html`) donde se editan textos, datos legales, avisos, instalaciones, galería, noticias, docentes, profesores, directivas y cuentas. **Grado Once no está en el panel:** solo se cambia en `main.js` (lista `gradoOnceStudents`) y sus fotos van en `fotos-grado-once/`.
- Fotos subidas desde el panel a **Cloudinary** (se convierten y optimizan solas; también acepta fotos HEIC de iPhone).
- Lo que se guarda en el panel se ve en la página de inmediato.

## Cómo funciona

| Pieza | Para qué |
| --- | --- |
| **Firebase Hosting** | Publica los archivos del sitio. |
| **Firestore** | Guarda el contenido (`sitio/contenido`), las listas de `directivas` y `profesores`, las `usuarios` que entran a Actividades y la configuración de Cloudinary (`config/cloudinary`). |
| **Firebase Authentication** | Ingreso con Google para directivas, profesores y estudiantes. |
| **Cloudinary** | Guarda las fotos que se suben desde el panel. |
| `firestore.rules` | Permisos: cualquiera lee el contenido público; solo las directivas lo cambian; cada persona solo ve su propia cuenta. |

## Estructura del proyecto

```text
instituto-santa-ana-luz-del-carmen/
├── index.html              # Página pública
├── styles.css              # Estilos de la página pública
├── main.js                 # Secciones, carruseles, páginas legales y Actividades
├── admin.html              # Panel de directivas
├── admin.js                # Lógica del panel
├── admin.css               # Estilos del panel
├── firebase-init.js        # Conexión con Firebase (compartida por la página y el panel)
├── firebase.json           # Qué archivos publica Firebase Hosting
├── firestore.rules         # Permisos de la base de datos
├── .firebaserc             # Proyecto de Firebase (santa-ana-web-e9f0f)
└── data/site-content.json  # Contenido inicial: se usa solo hasta el primer "Guardar cambios" del panel
```

## Primera configuración (una sola vez)

1. **Ingreso con Google:** en la [consola de Firebase](https://console.firebase.google.com/project/santa-ana-web-e9f0f/authentication/providers) → **Authentication** → **Comenzar** → **Google** → **Habilitar**, elige el correo de asistencia y **Guardar**.
2. **Cloudinary:** en [cloudinary.com](https://cloudinary.com) → **Settings → Upload → Upload presets → Add upload preset**, con **Signing mode: Unsigned** y la carpeta `santa-ana`. Guarda el nombre del preset.
3. Entra a `admin.html` con la **cuenta principal del colegio** (es directiva siempre, está en `firestore.rules`).
4. En **Configuración de fotos (Cloudinary)** escribe el *Cloud name* y el nombre del preset.
5. Agrega en **Directivas** los correos de las demás directivas y en **Profesores** los de los profesores.
6. Revisa el contenido, llena los **Datos legales del colegio** y pulsa **Guardar cambios**.

## Qué se cambia dónde

| Quiero cambiar... | Dónde | ¿Hay que publicar? |
| --- | --- | --- |
| Textos, avisos, fotos, docentes, instalaciones, galería, noticias, datos legales, profesores o directivas | Panel: <https://santa-ana-web-e9f0f.web.app/admin.html> | **No.** Se ve al instante al pulsar *Guardar cambios*. |
| Diseño, colores, secciones nuevas, textos legales, **Grado Once** | El código (este proyecto) | **Sí**, con `npm run deploy` (pasos abajo). |

## Cambiar el código paso a paso

### Una sola vez en cada computador

1. Instala [Node.js](https://nodejs.org) (versión 18 o superior).
2. Instala Firebase CLI y entra con la **cuenta del colegio**:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

   `firebase login` abre el navegador para entrar con Google. Queda guardado en ese computador: no hay que repetirlo cada vez. Para ver con qué cuenta estás: `firebase login:list`.

3. Para subir cambios a GitHub, entra también con GitHub CLI (`gh auth login --web`) o con tu usuario de Git.

### Cada vez que cambies algo

1. **Trae la última versión** (por si alguien más cambió algo):

   ```bash
   git checkout main
   git pull
   ```

2. **Haz el cambio** en VS Code (por ejemplo en `styles.css`, `main.js` o `index.html`).
3. **Pruébalo en tu computador:**

   ```bash
   npm start
   ```

   Abre <http://localhost:3000> (página) y <http://localhost:3000/admin.html> (panel). Para apagarlo: `Ctrl + C` en la terminal.

   > Ojo: en local se usa la **base de datos real**. Lo que guardes en el panel mientras pruebas también cambia el sitio publicado.

4. **Publícalo en internet** cuando esté bien:

   ```bash
   npm run deploy
   ```

   Sube la página a <https://santa-ana-web-e9f0f.web.app> y actualiza los permisos (`firestore.rules`). Si sale un error tipo `Failed to make request` o `ENOTFOUND`, es la conexión a internet: vuelve a ejecutar el comando.

5. **Guárdalo en GitHub:**

   ```bash
   git add -A
   git commit -m "describe aquí qué cambiaste"
   git push
   ```

   Antes del `commit`, revisa con `git status` que **no** aparezcan `.env` ni fotos de estudiantes.

### Qué se publica y qué no

`firebase.json` decide qué archivos salen a internet. Deja por fuera los archivos y carpetas ocultos (`.env`, `.git`, `.vscode`...), `node_modules`, `README.md`, `package.json`, `data/usuarios.json`, `data/profesores.json` y las carpetas `fotos-galeria` y `fotos-noticias`, que pueden tener fotos de estudiantes sin autorización. Las fotos nuevas se suben desde el panel, a Cloudinary.

**No quites `"**/.*/**"` de `firebase.json`:** es lo que evita que se publique la carpeta `.git`.

## Antes de publicar contenido nuevo

- [ ] **Datos legales del colegio** llenos en el panel.
- [ ] Textos legales revisados por las directivas o un asesor jurídico.
- [ ] Autorización escrita de padres o acudientes para los nombres y fotos de estudiantes (Grado Once y galería).

## Autor

Samuel Mateo Yate Escobar. Proyecto desarrollado para el Instituto Santa Ana Luz del Carmen.

Desarrollado con ayuda de [Claude Code](https://claude.com/claude-code), la herramienta de programación con inteligencia artificial de Anthropic.

## Licencia

MIT.
