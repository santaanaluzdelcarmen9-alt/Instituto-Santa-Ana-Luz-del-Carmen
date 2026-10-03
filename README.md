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

## Ejecutar en local

Requisitos: Node.js 18 o superior y Firebase CLI (`npm install -g firebase-tools`).

```bash
firebase login
npm start
```

- Página pública: <http://localhost:3000>
- Panel de directivas: <http://localhost:3000/admin.html>

En local se usa la base de datos real de Firebase: lo que guardes en el panel se ve también en el sitio publicado.

## Publicar

```bash
npm run deploy
```

Publica el sitio en <https://santa-ana-web-e9f0f.web.app> y actualiza los permisos de `firestore.rules`. Los cambios de contenido **no** necesitan publicar: se guardan desde el panel.

`firebase.json` deja por fuera los archivos que no deben salir a internet (`.env`, `node_modules`, `data/usuarios.json`, `data/profesores.json` y las carpetas `fotos-galeria` y `fotos-noticias`, que pueden tener fotos de estudiantes sin autorización). Las fotos se publican subiéndolas desde el panel.

## Antes de publicar

- [ ] Ingreso con Google activado y preset de Cloudinary creado.
- [ ] **Datos legales del colegio** llenos en el panel.
- [ ] Textos legales revisados por las directivas o un asesor jurídico.
- [ ] Autorización escrita de padres o acudientes para los nombres y fotos de estudiantes (Grado Once y galería).

## Autor

Samuel Mateo Yate Escobar. Proyecto desarrollado para el Instituto Santa Ana Luz del Carmen.

Desarrollado con ayuda de [Claude Code](https://claude.com/claude-code), la herramienta de programación con inteligencia artificial de Anthropic.

## Licencia

MIT.
