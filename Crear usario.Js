// Crea o actualiza una cuenta (estudiante o profesor) en data/usuarios.json
//
// Uso:
//   node crear-usuario.js <usuario> <estudiante|profesor> "<Nombre completo>" <contraseña>
//
// Ejemplo:
//   node crear-usuario.js maria profesor "María Gómez" MiClave2026
//
// La contraseña se guarda cifrada (scrypt + salt), nunca en texto plano.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [usuarioArg, rol, nombre, password] = process.argv.slice(2);
const rolesValidos = ['estudiante', 'profesor'];

if (!usuarioArg || !rolesValidos.includes(rol) || !nombre || !password) {
    console.log('Uso: node crear-usuario.js <usuario> <estudiante|profesor> "<Nombre completo>" <contraseña>');
    process.exit(1);
}

if (password.length < 8) {
    console.log('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
}

const usuario = usuarioArg.trim().toLowerCase();
const dataDir = path.join(__dirname, 'data');
const usuariosPath = path.join(dataDir, 'usuarios.json');

fs.mkdirSync(dataDir, { recursive: true });

let usuarios = [];
if (fs.existsSync(usuariosPath)) {
    usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex'); // misma función que usa server.js
const nuevo = { usuario, nombre, rol, salt, hash };

// Un mismo nombre de usuario puede existir como estudiante y como profesor; se distingue por rol
const indice = usuarios.findIndex((u) => u.usuario === usuario && u.rol === rol);
if (indice >= 0) {
    usuarios[indice] = nuevo;
    console.log(`Cuenta actualizada: ${usuario} (${rol})`);
} else {
    usuarios.push(nuevo);
    console.log(`Cuenta creada: ${usuario} (${rol})`);
}

fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

// Evita subir las cuentas a GitHub por accidente
const gitignorePath = path.join(__dirname, '.gitignore');
const linea = 'data/usuarios.json';
if (fs.existsSync(gitignorePath)) {
    const contenido = fs.readFileSync(gitignorePath, 'utf8');
    if (!contenido.split(/\r?\n/).some((l) => l.trim() === linea)) {
        fs.appendFileSync(gitignorePath, (contenido.endsWith('\n') ? '' : '\n') + linea + '\n');
        console.log(`Se agregó ${linea} a .gitignore`);
    }
} else {
    fs.writeFileSync(gitignorePath, `node_modules\n.env\n${linea}\n`);
    console.log('Se creó .gitignore con data/usuarios.json');
}