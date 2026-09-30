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
// Cada persona entra con su cuenta de Google. La primera vez queda "pendiente"
// hasta que las directivas la aprueban en admin.html y le asignan un rol.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const usuariosPath = path.join(__dirname, 'data', 'usuarios.json');
const userSessions = new Map(); // token -> { email, nombre, rol, issuedAt }
const rolesValidos = ['estudiante', 'profesor'];
const estadosValidos = ['pendiente', 'aprobado', 'rechazado'];

function readUsuarios() {
    try {
        const data = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function writeUsuarios(usuarios) {
    fs.mkdirSync(path.dirname(usuariosPath), { recursive: true });
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
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
            Actividades: sections.Actividades || 'informacion',
            conocenos: sections.conocenos || 'informacion',
            academico: sections.academico || 'informacion',
            instalaciones: sections.instalaciones || 'informacion',
            noticias: sections.noticias || 'informacion',
            contacto: sections.contacto || 'informacion'
        }
    };
    res.json(normalized);
});

app.post('/api/admin/login', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const validEmail = process.env.ADMIN_EMAIL || 'directivas@santaana.edu.co';
    const validPassword = process.env.ADMIN_PASSWORD || 'SantaAna2026!';

    if (email !== validEmail.toLowerCase() || password !== validPassword) {
        return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }
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

    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalName = path.extname(safeName) ? safeName : `${safeName}${extension}`;
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
        user = {
            email,
            nombre: payload.name || email,
            foto: payload.picture || '',
            rol: null,
            estado: 'pendiente',
            creado: new Date().toISOString()
        };
        usuarios.push(user);
        writeUsuarios(usuarios);
    }

    if (user.estado === 'pendiente') {
        return res.status(403).json({ estado: 'pendiente', mensaje: 'Tu solicitud fue recibida. Las directivas deben aprobar tu cuenta antes de que puedas entrar.' });
    }
    if (user.estado !== 'aprobado' || !rolesValidos.includes(user.rol)) {
        return res.status(403).json({ estado: 'rechazado', mensaje: 'Tu cuenta no tiene acceso. Comunícate con las directivas del instituto.' });
    }

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
//API DE CUENTAS (las directivas aprueban solicitudes y asignan roles)
//==========================
app.get('/api/admin/usuarios', requireAdmin, (req, res) => {
    const usuarios = readUsuarios().sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
    res.json(usuarios);
});

app.put('/api/admin/usuarios/:email', requireAdmin, (req, res) => {
    const email = String(req.params.email).toLowerCase();
    const estado = String(req.body.estado || '');
    const rol = req.body.rol ? String(req.body.rol) : null;

    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado inválido' });
    }
    if (estado === 'aprobado' && !rolesValidos.includes(rol)) {
        return res.status(400).json({ mensaje: 'Para aprobar una cuenta hay que elegir un rol' });
    }

    const usuarios = readUsuarios();
    const user = usuarios.find((u) => u.email === email);
    if (!user) {
        return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    user.estado = estado;
    if (estado === 'aprobado') user.rol = rol;
    writeUsuarios(usuarios);
    cerrarSesionesDe(email); // así un cambio de rol o un bloqueo aplica de inmediato
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