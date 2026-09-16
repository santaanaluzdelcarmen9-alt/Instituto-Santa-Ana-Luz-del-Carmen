# Instituto Santa Ana Luz del Carmen

Sitio institucional del Instituto Santa Ana Luz del Carmen, creado con HTML, CSS, JavaScript y Node.js + Express. El proyecto incluye una landing page pública y un panel de administración para que el personal directivo pueda actualizar contenido sin tocar el código.

## Descripción

Este proyecto incluye:

- Página principal con estructura institucional.
- Navegación por secciones: inicio, conocenos, académico, instalaciones, docentes, noticias, logros, galería y contacto.
- Sección de Grado Once con carrusel visual.
- Panel de administración para editar información pública.
- Gestión de avisos y docentes con orden y fotografía.
- API Express para leer y guardar contenido JSON.
- Carga de imágenes desde directorios del proyecto.

## Estructura del proyecto

```bash
instituto-santa-ana-luz-del-carmen/
├── index.html                # Página principal del sitio
├── styles.css                # Estilos generales del sitio
├── main.js                   # Lógica de UI, carruseles y carga de contenido
├── server.js                 # Backend Express con APIs
├── package.json              # Scripts y dependencias del proyecto
├── package-lock.json         # Lockfile de npm
├── README.md                 # Documentación del proyecto
├── admin.html                # Panel administrativo
├── admin.js                  # Lógica del panel de directivas
├── admin.css                 # Estilos del panel administrativo
├── data/
│   └── site-content.json     # Contenido editable del sitio
├── fotos-docentes/           # Imágenes de docentes
├── fotos-galeria/            # Imágenes de la galería
├── fotos-grado-once/         # Imágenes del Grado Once
└── .gitignore                # Archivos ignorados por Git
```

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- npm

## Requisitos previos

Asegúrate de tener instalado:

- Node.js 18 o superior
- npm

## Instalación

1. Entrar a la carpeta del proyecto.

```bash
cd "d:\ruta\al\proyecto\instituto-santa-ana-luz-del-carmen"
```

2. Instalar dependencias.

```bash
npm install
```

## Ejecución

### Arranque normal

```bash
npm start
```

Esto inicia el backend en:

```text
http://localhost:3000
```

Y la página principal queda disponible en:

```text
http://localhost:3000/
```

### Arranque con apertura automática de la web y el panel

```bash
npm run start:all
```

Este comando levanta el servidor y abre la página pública y el panel administrativo en el navegador.

### Frontend solo

```bash
npm run frontend
```

Esta opción sirve archivos estáticos pero no reemplaza al backend; para que la administración y la API funcionen, debe estar activo el servidor principal con `npm start`.

## Panel de directivas

Abre esta URL desde el navegador:

```text
http://localhost:3000/admin.html
```

Desde allí puedes editar:

- Información institucional
- Misión, visión, valores y manual
- Conócenos, académico, instalaciones, noticias, logros y contacto
- Avisos
- Docentes y su orden/fotografía

Se excluye la administración de Grado Once desde este panel.

### Credenciales por defecto

- Correo: directivas@santaana.edu.co
- Contraseña: SantaAna2026!

Puedes cambiar estas credenciales antes de iniciar el servidor definiendo:

```bash
ADMIN_EMAIL
ADMIN_PASSWORD
```

## Endpoints principales

### GET /api/status

Retorna el estado del servidor.

```json
{
  "estado": "ok",
  "mensaje": "el backend del Instituto Santa Ana Luz Del Carmen está funcionando"
}
```

### GET /api/public-content

Devuelve el contenido público almacenado en JSON, incluyendo institución, avisos, docentes y secciones editables.

### GET /api/galeria

Devuelve la lista de imágenes disponibles en la carpeta `fotos-galeria`.

### GET /api/docentes

Devuelve la lista de imágenes disponibles en la carpeta `fotos-docentes`.

### POST /api/admin/login

Inicia sesión en el panel administrativo.

### GET /api/admin/content

Obtiene el contenido actual del sitio para el panel.

### PUT /api/admin/content

Guarda el contenido editado en el JSON del sitio.

### POST /api/admin/upload

Sube imágenes para docentes.

## Funcionalidades principales

- Diseño institucional moderno y responsivo.
- Secciones editables desde administración.
- Carrusel para Grado Once.
- Carrusel de docentes.
- Galería de fotos.
- Panel administrativo funcional para directivas.
- Backend ligero para pruebas locales y despliegue sencillo.

## Desarrollo

Para continuar trabajando en el proyecto:

```bash
npm start
```

Luego abre en el navegador:

```text
http://localhost:3000
```

## Autor

Autor: Samuel Mateo Yate Escobar 

Proyecto desarrollado para el Instituto Santa Ana Luz del Carmen.

## Licencia

Este proyecto está bajo la licencia MIT.