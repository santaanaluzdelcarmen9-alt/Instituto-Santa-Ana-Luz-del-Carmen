const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 horas

// permite recibir datos en formato JSON
app.use(express.json());

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

app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const token = getToken(req);
    sessions.delete(token);
    res.json({ ok: true });
});

app.get('/api/admin/content', requireAdmin, (req, res) => res.json(readContent()));

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
    const base64 = String(data).replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(path.join(targetFolder, finalName), Buffer.from(base64, 'base64'));
    res.json({ fileName: finalName });
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

app.listen(PORT, () => {
    console.log
    (`Servidor funcionando en http://localhost:${PORT}`);
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