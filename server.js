require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 horas

// permite recibir datos en formato JSON
app.use(express.json({ limit: '10mb' }));

const dataPath = path.join(__dirname, 'data', 'site-content.json');
const sessions = new Map();
const allowedImageTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
};

function readContent() {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function writeContent(content) {
    fs.writeFileSync(dataPath, JSON.stringify(content, null, 2));
}

function getToken(req) {
    return req.get('Authorization')?.replace(/^Bearer\s+/i, '').trim() || null;
}

function requireAdmin(req, res, next) {
    const token = getToken(req);
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ mensaje: 'Sesión no válida o expirada' });
    }

    const issuedAt = sessions.get(token);
    if (Date.now() - issuedAt > SESSION_TTL) {
        sessions.delete(token);
        return res.status(401).json({ mensaje: 'La sesión ha expirado' });
    }

    next();
}

// ==========================
// LOGIN DE ESTUDIANTES Y PROFESORES CON GOOGLE (sección Actividades)
// ==========================
// Cada persona entra con su cuenta de Google. Si su correo está en la lista de
// profesores que manejan las directivas en admin.html es profesor; si no, es estudiante.
// Las directivas pueden quitarle el acceso a cualquiera desde "Cuentas".
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const usuariosPath = path.join(__dirname, 'data', 'usuarios.json');
const profesoresPath = path.join(__dirname, 'data', 'profesores.json');
const userSessions = new Map(); // token -> { email, nombre, rol, issuedAt }
const estadosValidos = ['aprobado', 'rechazado'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readJsonList(filePath) {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function writeJsonList(filePath, list) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
}

const readUsuarios = () => readJsonList(usuariosPath);
const writeUsuarios = (usuarios) => writeJsonList(usuariosPath, usuarios);
const readProfesores = () => readJsonList(profesoresPath);
const writeProfesores = (profesores) => writeJsonList(profesoresPath, profesores);

function rolDe(email) {
    return readProfesores().includes(email) ? 'profesor' : 'estudiante';
}

// actualiza el rol guardado de una cuenta (si ya existe) cuando cambia la lista de profesores
function actualizarRolDe(email) {
    const usuarios = readUsuarios();
    const user = usuarios.find((u) => u.email === email);
    if (user) {
        user.rol = rolDe(email);
        writeUsuarios(usuarios);
    }
    cerrarSesionesDe(email);
}

// cierra todas las sesiones abiertas de un correo (al cambiar su rol o quitarle el acceso)
function cerrarSesionesDe(email) {
    for (const [token, session] of userSessions) {
        if (session.email === email) userSessions.delete(token);
    }
}

function getUserSession(req) {
    const token = getToken(req);
    const session = token && userSessions.get(token);
    if (!session) return null;

    if (Date.now() - session.issuedAt > SESSION_TTL) {
        userSessions.delete(token);
        return null;
    }
    return session;
}

// requireUser() -> cualquier usuario con sesión | requireUser('profesor') -> solo ese rol
function requireUser(rol) {
    return (req, res, next) => {
        const session = getUserSession(req);
        if (!session) {
            return res.status(401).json({ mensaje: 'Sesión no válida o expirada' });
        }
        if (rol && session.rol !== rol) {
            return res.status(403).json({ mensaje: 'No tienes permiso para esto' });
        }
        req.user = session;
        next();
    };
}

// los datos (incluye usuarios.json) nunca se sirven como archivos públicos
app.use('/data', (req, res) => res.status(404).json({ mensaje: 'No encontrado' }));

// servir los archivos del frontend
app.use(express.static(__dirname));

app.get('/api/public-content', (req, res) => {
    const content = readContent();
    const sections = content.sections || {};
    const normalized = {
        institution: content.institution || {},
        notices: Array.isArray(content.notices) ? content.notices : [],
        docentes: Array.isArray(content.docentes) ? content.docentes : [],
        sections: {
            inicio: sections.inicio || {},
            Actividades: sections.Actividades || '...',
            conocenos: sections.conocenos || '...',
            academico: sections.academico || '...',
            instalaciones: sections.instalaciones || '...',
            noticias: sections.noticias || '...',
            contacto: sections.contacto || '...'
        }
    };
    res.json(normalized);
});

// Las credenciales salen solo de .env (o de las variables del hosting). Sin ellas el panel no abre,
// para que nunca quede funcionando una contraseña conocida que esté publicada en GitHub.
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('Aviso: faltan ADMIN_EMAIL o ADMIN_PASSWORD en .env; el panel de directivas no permitirá entrar.');
}

// tras 5 intentos fallidos desde la misma conexión hay que esperar 1 minuto (frena a quien intente adivinar)
const MAX_INTENTOS = 5;
const ESPERA_INTENTOS = 60 * 1000;
const intentosFallidos = new Map(); // ip -> { cuenta, desde }

function mismoTexto(a, b) {
    const hashA = crypto.createHash('sha256').update(String(a)).digest();
    const hashB = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(hashA, hashB);
}

app.post('/api/admin/login', (req, res) => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        return res.status(503).json({ mensaje: 'El acceso de directivas no está configurado en el servidor' });
    }

    const ip = req.ip;
    const intentos = intentosFallidos.get(ip);
    if (intentos && Date.now() - intentos.desde > ESPERA_INTENTOS) {
        intentosFallidos.delete(ip);
    } else if (intentos && intentos.cuenta >= MAX_INTENTOS) {
        return res.status(429).json({ mensaje: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.' });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!mismoTexto(email, ADMIN_EMAIL) || !mismoTexto(password, ADMIN_PASSWORD)) {
        const actual = intentosFallidos.get(ip) || { cuenta: 0, desde: Date.now() };
        actual.cuenta += 1;
        intentosFallidos.set(ip, actual);
        return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }
    intentosFallidos.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now());
    res.json({ token, email });
});

app.get('/api/admin/content', requireAdmin, (req, res) => {
    try {
        const content = readContent();
        res.json({
            institution: content.institution || {},
            notices: Array.isArray(content.notices) ? content.notices : [],
            docentes: Array.isArray(content.docentes) ? content.docentes : [],
            instalaciones: Array.isArray(content.instalaciones) ? content.instalaciones : [],
            sections: content.sections || {}
        });
    } catch (error) {
        console.error('Error leyendo contenido:', error);
        res.status(500).json({ mensaje: 'No se pudo leer el contenido' });
    }
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
    sessions.delete(getToken(req));
    res.json({ ok: true });
});

app.put('/api/admin/content', requireAdmin, (req, res) => {
    const next = req.body;
    if (!next || !next.institution || !Array.isArray(next.notices) || !Array.isArray(next.docentes)) {
        return res.status(400).json({ mensaje: 'Formato de contenido inválido' });
    }

    const normalizedSections = next.sections && typeof next.sections === 'object' ? next.sections : {};
    const contentToSave = {
        institution: next.institution,
        notices: next.notices,
        docentes: next.docentes,
        instalaciones: Array.isArray(next.instalaciones) ? next.instalaciones : [], // <-- esto faltaba
        sections: normalizedSections
    };

    writeContent(contentToSave);
    res.json({ ok: true });
});

app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const { fileName, data, folder = 'fotos-docentes' } = req.body;
    const extension = allowedImageTypes[req.body.type];
    const validFolders = ['fotos-docentes', 'fotos-galeria', 'fotos-noticias', 'fotos-instalaciones'];
    if (!fileName || !data || !extension || !validFolders.includes(folder)) {
        return res.status(400).json({ mensaje: 'Imagen o carpeta inválida' });
    }

    // la extensión sale siempre del tipo de imagen, así nadie puede subir un .html o un .js disfrazado
    const safeName = path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, '_') || 'imagen';
    const finalName = `${safeName}${extension}`;
    const targetFolder = path.join(__dirname, folder);
        fs.mkdirSync(targetFolder, { recursive: true });
    const base64 = String(data).replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(path.join(targetFolder, finalName), Buffer.from(base64, 'base64'));
    res.json({ fileName: finalName });
});

//==========================
//API DE ACTIVIDADES (login con Google de estudiantes y profesores)
//==========================
app.get('/api/actividades/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID });
});

app.post('/api/actividades/google', async (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
        return res.status(503).json({ mensaje: 'El inicio de sesión con Google aún no está configurado' });
    }

    // Google firma el token; aquí se comprueba la firma y que fue emitido para este sitio
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: String(req.body.credential || ''),
            audience: GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
    } catch (error) {
        return res.status(401).json({ mensaje: 'No se pudo verificar la cuenta de Google' });
    }

    if (!payload?.email || !payload.email_verified) {
        return res.status(401).json({ mensaje: 'La cuenta de Google no tiene un correo verificado' });
    }

    const email = payload.email.toLowerCase();
    const usuarios = readUsuarios();
    let user = usuarios.find((u) => u.email === email);

    if (!user) {
        user = { email, creado: new Date().toISOString(), estado: 'aprobado' };
        usuarios.push(user);
    }

    if (user.estado === 'rechazado') {
        return res.status(403).json({ estado: 'rechazado', mensaje: 'Tu cuenta no tiene acceso. Comunícate con las directivas del instituto.' });
    }

    // el rol sale siempre de la lista de profesores, y se refrescan nombre y foto
    user.estado = 'aprobado';
    user.rol = rolDe(email);
    user.nombre = payload.name || user.nombre || email;
    user.foto = payload.picture || user.foto || '';
    user.ultimoIngreso = new Date().toISOString();
    writeUsuarios(usuarios);

    const token = crypto.randomBytes(32).toString('hex');
    userSessions.set(token, { email: user.email, nombre: user.nombre, rol: user.rol, issuedAt: Date.now() });
    res.json({ token, email: user.email, nombre: user.nombre, rol: user.rol });
});

app.get('/api/actividades/me', requireUser(), (req, res) => {
    const { email, nombre, rol } = req.user;
    res.json({ email, nombre, rol });
});

app.post('/api/actividades/logout', requireUser(), (req, res) => {
    userSessions.delete(getToken(req));
    res.json({ ok: true });
});

//==========================
//API DE PROFESORES (lista de correos que entran como profesor)
//==========================
app.get('/api/admin/profesores', requireAdmin, (req, res) => {
    res.json(readProfesores());
});

app.post('/api/admin/profesores', requireAdmin, (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!emailRegex.test(email)) {
        return res.status(400).json({ mensaje: 'Escribe un correo válido' });
    }

    const profesores = readProfesores();
    if (profesores.includes(email)) {
        return res.status(409).json({ mensaje: 'Ese correo ya está en la lista de profesores' });
    }

    profesores.push(email);
    profesores.sort();
    writeProfesores(profesores);
    actualizarRolDe(email); // si ya había entrado como estudiante, pasa a profesor de inmediato
    res.json(profesores);
});

app.delete('/api/admin/profesores/:email', requireAdmin, (req, res) => {
    const email = String(req.params.email).toLowerCase();
    const profesores = readProfesores();
    const restantes = profesores.filter((p) => p !== email);

    if (restantes.length === profesores.length) {
        return res.status(404).json({ mensaje: 'Ese correo no está en la lista' });
    }

    writeProfesores(restantes);
    actualizarRolDe(email); // vuelve a ser estudiante
    res.json(restantes);
});

//==========================
//API DE CUENTAS (quién ha entrado; las directivas pueden quitar o devolver el acceso)
//==========================
app.get('/api/admin/usuarios', requireAdmin, (req, res) => {
    const usuarios = readUsuarios()
        .map((u) => ({ ...u, rol: rolDe(u.email) }))
        .sort((a, b) => String(b.ultimoIngreso || b.creado).localeCompare(String(a.ultimoIngreso || a.creado)));
    res.json(usuarios);
});

app.put('/api/admin/usuarios/:email', requireAdmin, (req, res) => {
    const email = String(req.params.email).toLowerCase();
    const estado = String(req.body.estado || '');

    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado inválido' });
    }

    const usuarios = readUsuarios();
    const user = usuarios.find((u) => u.email === email);
    if (!user) {
        return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    user.estado = estado;
    user.rol = rolDe(email);
    writeUsuarios(usuarios);
    cerrarSesionesDe(email); // así un bloqueo aplica de inmediato
    res.json(user);
});

app.delete('/api/admin/usuarios/:email', requireAdmin, (req, res) => {
    const email = String(req.params.email).toLowerCase();
    const usuarios = readUsuarios();
    const restantes = usuarios.filter((u) => u.email !== email);

    if (restantes.length === usuarios.length) {
        return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    writeUsuarios(restantes);
    cerrarSesionesDe(email);
    res.json({ ok: true });
});

//==========================
//API DE PRUEBA
//==========================
app.get('/api/status', (req, res) => 
    {
    res.json
    ({ estado:'ok', 
        mensaje: 'el backend del Instituto Santa Ana Luz Del Carmen está funcionando '
    });
});

//==========================
//API DE GALERIA
//==========================
app.get('/api/galeria', (req, res) => {
   
    const carpetagaleria = path.join(
    __dirname,
    'fotos-galeria'

);

  fs.readdir(carpetagaleria, (error, archivos) => {
     
     if(error) { 
        return res.status(500).json({
            estado: 'error',
            mensaje: 'No se pudo leer la carpeta de imágenes'
        });
     }
     
     const imagenes = archivos.filter(archivo => {

        const extension = path.extname(archivo).toLowerCase();

        return [
                '.jpg',
                '.jpeg',
                '.png', 
                '.webp', 
                '.gif'
            ].includes(extension);

     });

     res.json(imagenes.sort((a, b) => a.localeCompare(b, 'es', { numeric: true })));

    });

});

//==========================
//API DE INSTALACIONES
//==========================
app.get('/api/instalaciones', (req, res) => {
    try {
        const content = readContent();
        const instalaciones = Array.isArray(content.instalaciones) ? content.instalaciones : [];
        res.json(instalaciones);
    } catch (error) {
        console.error('Error al leer instalaciones:', error);
        res.status(500).json({
            estado: 'error',
            mensaje: 'No se pudieron leer las instalaciones'
        });        }
});

//==========================
//API DE DOCENTES
//==========================
app.get('/api/docentes', (req, res) => {
    const carpetaDocentes = path.join(__dirname, 'fotos-docentes');

    fs.readdir(carpetaDocentes, (error, archivos) => {
        if (error) {
            return res.status(500).json({
                estado: 'error',
                mensaje: 'No se pudo leer la carpeta de imágenes de docentes'
            });
        }

        const imagenes = archivos.filter(archivo => {
            const extension = path.extname(archivo).toLowerCase();

            return [
                '.jpg', 
                '.jpeg', 
                '.png', 
                '.webp', 
                '.gif'
            ].includes(extension);
        });

        res.json(imagenes.sort((a, b) => a.localeCompare(b, 'es', { numeric: true })));
    });
});


//inicio del servidor

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});

app.get('/api/noticias', (req, res) => {
    const carpetaNoticias = path.join(__dirname, 'fotos-noticias');

    fs.readdir(carpetaNoticias, (error, archivos) => {
        if (error) {
            return res.status(500).json({
                estado: 'error',
                mensaje: 'No se pudo leer la carpeta de imágenes de noticias'
            });
        }

        const imagenes = archivos.filter(archivo => {
            const extension = path.extname(archivo).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension);
        });

        res.json(imagenes.sort((a, b) => a.localeCompare(b, 'es', { numeric: true })));
    });
});