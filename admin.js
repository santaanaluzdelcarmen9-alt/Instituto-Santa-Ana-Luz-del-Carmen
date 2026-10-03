let content = null;
let cloudinary = {};
const $ = (selector) => document.querySelector(selector);
const camposLegales = ['nit', 'telefono', 'direccion', 'ciudad', 'correo', 'actualizado'];

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[character]));
}

function showAdmin() {
    $('#login-view').hidden = true;
    $('#admin-view').hidden = false;
}

function showLogin(texto = '') {
    $('#login-view').hidden = false;
    $('#admin-view').hidden = true;
    $('#login-message').textContent = texto;
}

// ==========================
// LISTAS EDITABLES (avisos, instalaciones, galería, noticias, docentes, Grado Once)
// ==========================
// Cada lista dice qué campos tiene y en qué campo guarda su foto; el panel las pinta y las lee igual.
const listas = {
    notices: {
        titulo: (i) => `Aviso ${i + 1}`,
        campos: [['title', 'Título'], ['text', 'Texto', 'textarea']],
        nuevo: () => ({ title: '', text: '' })
    },
    instalaciones: {
        titulo: (i) => `Instalación ${i + 1}`,
        campos: [['nombre', 'Nombre'], ['descripcion', 'Descripción', 'textarea']],
        foto: 'foto',
        carpeta: 'instalaciones',
        nuevo: () => ({ id: `instalacion-${Date.now()}`, nombre: '', descripcion: '', foto: '' })
    },
    galeria: {
        titulo: (i) => `Foto ${i + 1}`,
        campos: [['descripcion', 'Descripción (opcional)']],
        foto: 'url',
        carpeta: 'galeria',
        nuevo: () => ({ id: `foto-${Date.now()}`, descripcion: '', url: '' })
    },
    noticias: {
        titulo: (i) => `Noticia ${i + 1}`,
        campos: [['titulo', 'Título']],
        foto: 'url',
        carpeta: 'noticias',
        nuevo: () => ({ id: `noticia-${Date.now()}`, titulo: '', url: '' })
    },
    docentes: {
        titulo: (i) => `Ficha ${i + 1}`,
        campos: [['order', 'Orden', 'number'], ['name', 'Nombre'], ['profession', 'Cargo o acompañamiento'], ['info', 'Asignatura'], ['infografia', 'Descripción', 'textarea']],
        foto: 'photo',
        carpeta: 'docentes',
        nuevo: () => ({ id: `docente-${Date.now()}`, order: content.docentes.length + 1, name: '', profession: '', info: '', infografia: '', photo: '' })
    }
};
// Grado Once no está aquí a propósito: solo se cambia en el código (main.js).

// misma regla que la página pública (fotoUrl en firebase-init.js) para mostrar la vista previa
const carpetasViejas = { instalaciones: 'fotos-instalaciones', galeria: 'fotos-galeria', noticias: 'fotos-noticias', docentes: 'fotos-docentes' };

function campoHtml(lista, index, [campo, etiqueta, tipo], valor) {
    const name = `${lista}.${index}.${campo}`;
    const texto = escapeHtml(valor ?? '');
    if (tipo === 'textarea') {
        return `<label class="wide">${etiqueta}<textarea name="${name}" rows="3">${texto}</textarea></label>`;
    }
    return `<label>${etiqueta}<input name="${name}" type="${tipo || 'text'}" value="${texto}"></label>`;
}

function renderLista(lista) {
    const config = listas[lista];
    const items = content[lista];
    const contenedor = document.querySelector(`[data-lista="${lista}"]`);

    if (!items.length) {
        contenedor.innerHTML = '<p class="hint">Todavía no hay elementos.</p>';
        return;
    }

    contenedor.innerHTML = items.map((item, index) => {
        const foto = config.foto ? fotoUrl(item[config.foto], carpetasViejas[lista]) : '';
        const bloqueFoto = config.foto ? `
            <div class="foto-campo">
                ${foto ? `<img class="foto-preview" src="${escapeHtml(foto)}" alt="">` : '<div class="foto-preview foto-vacia">Sin foto</div>'}
                <label class="file-picker">
                    <input type="file" accept="image/*,.heic" data-subir="${lista}" data-index="${index}">
                    <span class="file-button">${foto ? 'Cambiar foto' : 'Subir foto'}</span>
                </label>
                <input type="hidden" name="${lista}.${index}.${config.foto}" value="${escapeHtml(item[config.foto] || '')}">
            </div>` : '';

        return `<div class="item" data-index="${index}">
            <h3>${config.titulo(index)}</h3>
            ${bloqueFoto}
            <div class="form-grid">${config.campos.map((campo) => campoHtml(lista, index, campo, item[campo[0]])).join('')}</div>
            <button type="button" class="remove" data-quitar="${lista}" data-index="${index}">Eliminar</button>
        </div>`;
    }).join('');
}

function render() {
    const sections = content.sections || {};
    const inicio = sections.inicio || {};
    const legal = content.legal || {};

    $('[name="institution.name"]').value = content.institution.name || '';
    $('[name="institution.badge"]').value = content.institution.badge || '';
    $('[name="institution.description"]').value = content.institution.description || '';
    $('[name="section.inicio.mission"]').value = inicio.mission || '';
    $('[name="section.inicio.vision"]').value = inicio.vision || '';
    $('[name="section.inicio.values"]').value = inicio.values || '';
    $('[name="section.inicio.manual"]').value = inicio.manual || '';
    $('[name="section.Actividades"]').value = sections.Actividades || '';
    $('[name="section.academico"]').value = sections.academico || '';
    $('[name="section.contacto"]').value = sections.contacto || '';
    camposLegales.forEach((campo) => { $(`[name="legal.${campo}"]`).value = legal[campo] || ''; });

    Object.keys(listas).forEach(renderLista);
}

// pasa lo escrito en el formulario a `content` (se llama antes de agregar, quitar o subir, para no perder lo escrito)
function collect() {
    const sections = content.sections || {};
    const inicio = sections.inicio || {};

    content.institution.name = $('[name="institution.name"]').value;
    content.institution.badge = $('[name="institution.badge"]').value;
    content.institution.description = $('[name="institution.description"]').value;
    inicio.mission = $('[name="section.inicio.mission"]').value;
    inicio.vision = $('[name="section.inicio.vision"]').value;
    inicio.values = $('[name="section.inicio.values"]').value;
    inicio.manual = $('[name="section.inicio.manual"]').value;
    sections.inicio = inicio;
    sections.Actividades = $('[name="section.Actividades"]').value;
    sections.academico = $('[name="section.academico"]').value;
    sections.contacto = $('[name="section.contacto"]').value;
    content.sections = sections;

    content.legal = {};
    camposLegales.forEach((campo) => { content.legal[campo] = $(`[name="legal.${campo}"]`).value.trim(); });

    Object.entries(listas).forEach(([lista, config]) => {
        content[lista].forEach((item, index) => {
            const campos = config.foto ? [...config.campos, [config.foto]] : config.campos;
            campos.forEach(([campo, , tipo]) => {
                const input = document.querySelector(`[name="${lista}.${index}.${campo}"]`);
                if (!input) return;
                item[campo] = tipo === 'number' ? (Number(input.value) || index + 1) : input.value;
            });
        });
    });
}

function normalizar(datos) {
    const lista = (valor) => (Array.isArray(valor) ? valor : []);
    const resultado = { ...datos, institution: datos.institution || {}, sections: datos.sections || {}, legal: datos.legal || {} };
    Object.keys(listas).forEach((nombre) => { resultado[nombre] = lista(datos[nombre]); });
    return resultado;
}

async function loadContent() {
    const snap = await contenidoDoc.get();
    let datos = snap.data();
    $('#contenido-inicial').hidden = snap.exists;

    // la primera vez no hay nada en Firestore: se parte del contenido que venía en el proyecto
    if (!snap.exists) {
        const response = await fetch('data/site-content.json');
        datos = response.ok ? await response.json() : {};
    }

    content = normalizar(datos || {});
    render();
}

// ==========================
// FOTOS (Cloudinary)
// ==========================
async function loadCloudinary() {
    const snap = await db.collection('config').doc('cloudinary').get();
    cloudinary = snap.data() || {};
    $('#cloudinary-form [name="cloudName"]').value = cloudinary.cloudName || '';
    $('#cloudinary-form [name="preset"]').value = cloudinary.preset || '';
}

$('#cloudinary-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const datos = {
        cloudName: event.target.cloudName.value.trim(),
        preset: event.target.preset.value.trim()
    };
    try {
        await db.collection('config').doc('cloudinary').set(datos);
        cloudinary = datos;
        $('#cloudinary-message').textContent = 'Configuración guardada. Ya puedes subir fotos.';
    } catch (error) {
        console.error(error);
        $('#cloudinary-message').textContent = 'No se pudo guardar la configuración.';
    }
});

// sube una imagen a Cloudinary y devuelve una dirección que la entrega optimizada (y convierte HEIC a JPG/WebP)
async function subirFoto(archivo, carpeta) {
    if (!cloudinary.cloudName || !cloudinary.preset) {
        throw new Error('Primero llena y guarda la "Configuración de fotos (Cloudinary)".');
    }
    const form = new FormData();
    form.append('file', archivo);
    form.append('upload_preset', cloudinary.preset);
    form.append('folder', `santa-ana/${carpeta}`);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinary.cloudName)}/image/upload`, { method: 'POST', body: form });
    const resultado = await response.json().catch(() => ({}));
    if (!response.ok || !resultado.secure_url) {
        throw new Error(resultado.error?.message || 'Cloudinary no aceptó la foto.');
    }
    return resultado.secure_url.replace('/upload/', '/upload/f_auto,q_auto,c_limit,w_1600/');
}

document.addEventListener('change', async (event) => {
    const unaFoto = event.target.dataset.subir;
    const varias = event.target.dataset.subirVarias;
    const lista = unaFoto || varias;
    const archivos = [...(event.target.files || [])];
    if (!lista || !archivos.length) return;

    collect();
    const config = listas[lista];
    $('#save-message').textContent = `Subiendo ${archivos.length === 1 ? 'la foto' : `${archivos.length} fotos`}...`;

    try {
        for (const archivo of archivos) {
            const url = await subirFoto(archivo, config.carpeta);
            if (unaFoto) {
                content[lista][Number(event.target.dataset.index)][config.foto] = url;
            } else {
                content[lista].push({ ...config.nuevo(), [config.foto]: url });
            }
        }
        hayCambios = true;
        renderLista(lista);
        $('#save-message').textContent = 'Foto lista. Pulsa "Guardar cambios" para publicarla.';
    } catch (error) {
        console.error('Error al subir la foto:', error);
        $('#save-message').textContent = error.message;
    }
    event.target.value = '';
});

// ==========================
// AGREGAR Y QUITAR ELEMENTOS DE LAS LISTAS
// ==========================
document.addEventListener('click', (event) => {
    const agregar = event.target.dataset.agregar;
    const quitar = event.target.dataset.quitar;
    if (!agregar && !quitar) return;

    collect();
    if (agregar) content[agregar].push(listas[agregar].nuevo());
    if (quitar) content[quitar].splice(Number(event.target.dataset.index), 1);
    hayCambios = true;
    renderLista(agregar || quitar);
});

// ==========================
// GUARDAR
// ==========================
let hayCambios = false;

$('#content-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    collect();
    content.docentes.sort((a, b) => a.order - b.order);
    $('#save-message').textContent = 'Guardando...';

    try {
        await contenidoDoc.set(content);
        hayCambios = false;
        $('#contenido-inicial').hidden = true;
        render();
        $('#save-message').textContent = 'Cambios guardados. Ya se ven en la página.';
    } catch (error) {
        console.error('Error al guardar:', error);
        $('#save-message').textContent = error.code === 'permission-denied'
            ? 'Tu cuenta ya no tiene permiso para guardar. Vuelve a entrar.'
            : 'No se pudieron guardar los cambios. Revisa tu conexión y vuelve a intentarlo.';
    }
});

// avisa antes de salir o recargar si hay cambios sin guardar
['input', 'change'].forEach((tipo) => $('#content-form').addEventListener(tipo, () => { hayCambios = true; }));
window.addEventListener('beforeunload', (event) => {
    if (!hayCambios) return;
    event.preventDefault();
    event.returnValue = '';
});

// ==========================
// DIRECTIVAS Y PROFESORES (listas de correos)
// ==========================
async function loadCorreos(coleccion) {
    const lista = $(`#${coleccion}-list`);
    try {
        const snap = await db.collection(coleccion).get();
        const correos = snap.docs.map((doc) => doc.id).sort();
        lista.innerHTML = correos.length
            ? correos.map((email) => `<li data-email="${escapeHtml(email)}">
                <span>${escapeHtml(email)}</span>
                <button type="button" class="danger" data-quitar-correo="${coleccion}">Quitar</button>
            </li>`).join('')
            : `<li class="hint">La lista está vacía.</li>`;
        return correos;
    } catch (error) {
        console.error(error);
        $(`#${coleccion}-message`).textContent = 'No se pudo cargar la lista.';
        return [];
    }
}

document.querySelectorAll('[data-lista-correos]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const coleccion = form.dataset.listaCorreos;
        const input = form.querySelector('input');
        const email = input.value.trim().toLowerCase();
        try {
            await db.collection(coleccion).doc(email).set({ agregado: firebase.firestore.FieldValue.serverTimestamp() });
            form.reset();
            $(`#${coleccion}-message`).textContent = `${email} quedó en la lista.`;
            await loadCorreos(coleccion);
            if (coleccion === 'profesores') await loadUsers();
        } catch (error) {
            console.error(error);
            $(`#${coleccion}-message`).textContent = 'No se pudo agregar el correo.';
        }
    });
});

document.addEventListener('click', async (event) => {
    const coleccion = event.target.dataset.quitarCorreo;
    if (!coleccion) return;
    const email = event.target.closest('li').dataset.email;
    if (!confirm(`¿Quitar a ${email} de la lista?`)) return;
    try {
        await db.collection(coleccion).doc(email).delete();
        $(`#${coleccion}-message`).textContent = `${email} salió de la lista.`;
        await loadCorreos(coleccion);
        if (coleccion === 'profesores') await loadUsers();
    } catch (error) {
        console.error(error);
        $(`#${coleccion}-message`).textContent = 'No se pudo quitar el correo.';
    }
});

// ==========================
// CUENTAS (personas que han entrado con Google en Actividades)
// ==========================
const rolTexto = { profesor: 'Profesor', estudiante: 'Estudiante' };

async function loadUsers() {
    try {
        const [usuariosSnap, profesoresSnap] = await Promise.all([
            db.collection('usuarios').get(),
            db.collection('profesores').get()
        ]);
        const profesores = new Set(profesoresSnap.docs.map((doc) => doc.id));
        const momento = (fecha) => (fecha?.toMillis ? fecha.toMillis() : 0);
        const usuarios = usuariosSnap.docs
            .map((doc) => ({ uid: doc.id, ...doc.data() }))
            .map((user) => ({ ...user, rol: profesores.has(user.email) ? 'profesor' : 'estudiante' }))
            .sort((a, b) => momento(b.ultimoIngreso) - momento(a.ultimoIngreso));

        $('#users-message').textContent = '';
        if (!usuarios.length) {
            $('#users-list').innerHTML = '<p class="hint">Todavía nadie ha entrado con Google.</p>';
            return;
        }

        $('#users-list').innerHTML = usuarios.map((user) => {
            const bloqueado = user.estado === 'rechazado';
            return `<div class="item user-item" data-uid="${escapeHtml(user.uid)}">
                <div class="user-info">
                    <strong>${escapeHtml(user.nombre || user.email)}</strong>
                    <span class="hint">${escapeHtml(user.email)}</span>
                    <span class="user-badges">
                        <span class="user-estado rol-${user.rol}">${rolTexto[user.rol]}</span>
                        ${bloqueado ? '<span class="user-estado estado-rechazado">Sin acceso</span>' : ''}
                    </span>
                </div>
                <div class="user-actions">
                    ${bloqueado
                        ? '<button type="button" data-user-action="aprobado">Devolver acceso</button>'
                        : '<button type="button" class="secondary" data-user-action="rechazado">Quitar acceso</button>'}
                    <button type="button" class="danger" data-user-action="eliminar">Eliminar</button>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error(error);
        $('#users-message').textContent = 'No se pudieron cargar las cuentas.';
    }
}

$('#refresh-users').addEventListener('click', loadUsers);

$('#users-list').addEventListener('click', async (event) => {
    const action = event.target.dataset.userAction;
    if (!action) return;
    const ref = db.collection('usuarios').doc(event.target.closest('.user-item').dataset.uid);
    try {
        if (action === 'eliminar') {
            if (!confirm('¿Eliminar esta cuenta de la lista? Si vuelve a entrar con Google, aparecerá de nuevo.')) return;
            await ref.delete();
        } else {
            await ref.update({ estado: action });
        }
        await loadUsers();
    } catch (error) {
        console.error(error);
        $('#users-message').textContent = 'No se pudo actualizar la cuenta.';
    }
});

// ==========================
// ENTRAR Y SALIR
// ==========================
$('#login-button').addEventListener('click', async () => {
    $('#login-message').textContent = '';
    try {
        await entrarConGoogle();
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            console.error(error);
            $('#login-message').textContent = 'No se pudo entrar con Google. Inténtalo de nuevo.';
        }
    }
});

$('#logout-button').addEventListener('click', () => auth.signOut());

// Solo las directivas pueden leer la lista de directivas (lo deciden las reglas de Firestore),
// así que si esa lectura falla, la cuenta no es directiva.
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        showLogin();
        return;
    }
    try {
        await db.collection('directivas').limit(1).get();
    } catch (error) {
        await auth.signOut();
        showLogin(`La cuenta ${user.email} no es directiva. Pide a una directiva que la agregue en el panel.`);
        return;
    }

    try {
        $('#admin-email').textContent = user.email;
        await loadContent();
        showAdmin();
        await Promise.all([loadCloudinary(), loadCorreos('directivas'), loadCorreos('profesores'), loadUsers()]);
    } catch (error) {
        console.error('Error al cargar el panel:', error);
        showLogin('No se pudo cargar el panel. Revisa tu conexión y vuelve a intentarlo.');
    }
});
