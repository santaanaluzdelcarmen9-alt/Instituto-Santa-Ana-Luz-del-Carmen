let content = null;
let cloudinary = {};
const $ = (selector) => document.querySelector(selector);

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
// CAMPOS POR NOMBRE
// ==========================
// Cada campo del formulario se llama como el dato que guarda: name="lema.texto" es content.lema.texto,
// y name="docentes.2.name" es el nombre del tercer docente. Así se leen y se guardan todos igual.
function leerRuta(objeto, ruta) {
    return ruta.split('.').reduce((actual, parte) => (actual == null ? undefined : actual[parte]), objeto);
}

function escribirRuta(objeto, ruta, valor) {
    const partes = ruta.split('.');
    const ultima = partes.pop();
    const destino = partes.reduce((actual, parte) => {
        if (actual[parte] == null || typeof actual[parte] !== 'object') actual[parte] = {};
        return actual[parte];
    }, objeto);
    destino[ultima] = valor;
}

// ==========================
// LISTAS EDITABLES
// ==========================
// Cada lista dice qué campos tiene y, si lleva foto, en qué campo la guarda.
const listas = {
    cifras: {
        titulo: (i) => `Cifra ${i + 1}`,
        campos: [['numero', 'Número', 'text', '25'], ['texto', 'Texto', 'text', 'Años de historia']],
        nuevo: () => ({ numero: '', texto: '' })
    },
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
        carpetaVieja: 'fotos-instalaciones',
        nuevo: () => ({ id: `instalacion-${Date.now()}`, nombre: '', descripcion: '', foto: '' })
    },
    docentes: {
        titulo: (i) => `Docente ${i + 1}`,
        campos: [['order', 'Orden', 'number'], ['name', 'Nombre'], ['profession', 'Cargo o acompañamiento'], ['info', 'Asignatura'], ['infografia', 'Descripción', 'textarea']],
        foto: 'photo',
        carpeta: 'docentes',
        carpetaVieja: 'fotos-docentes',
        nuevo: () => ({ id: `docente-${Date.now()}`, order: content.docentes.length + 1, name: '', profession: '', info: '', infografia: '', photo: '' })
    },
    noticias: {
        titulo: (i) => `Noticia ${i + 1}`,
        campos: [['titulo', 'Título']],
        foto: 'url',
        carpeta: 'noticias',
        carpetaVieja: 'fotos-noticias',
        nuevo: () => ({ id: `noticia-${Date.now()}`, titulo: '', url: '' })
    },
    galeria: {
        titulo: (i) => `Foto ${i + 1}`,
        campos: [['descripcion', 'Descripción (opcional)']],
        foto: 'url',
        carpeta: 'galeria',
        carpetaVieja: 'fotos-galeria',
        nuevo: () => ({ id: `foto-${Date.now()}`, descripcion: '', url: '' })
    },
    personal: {
        titulo: (i) => `Persona ${i + 1}`,
        campos: [['order', 'Orden', 'number'], ['name', 'Nombre completo'], ['cargo', 'Cargo'], ['descripcion', 'Descripción', 'textarea']],
        foto: 'photo',
        carpeta: 'personal',
        carpetaVieja: 'imagenes-sitio/personal',
        nuevo: () => ({ id: `persona-${Date.now()}`, order: content.personal.length + 1, name: '', cargo: '', descripcion: '', photo: '' })
    },
    infoColegio: {
        titulo: (i) => `Tarjeta ${i + 1}`,
        campos: [['icono', 'Ícono', 'select', iconosInfo], ['titulo', 'Título'], ['texto', 'Texto', 'textarea']],
        nuevo: () => ({ id: `info-${Date.now()}`, icono: 'bi-info-circle', titulo: '', texto: '' })
    }
};
// Grado Once no está aquí a propósito: solo se cambia en el código (main.js).

function campoHtml(name, [, etiqueta, tipo, extra], valor) {
    const texto = escapeHtml(valor ?? '');
    if (tipo === 'textarea') {
        return `<label class="wide">${etiqueta}<textarea name="${name}" rows="3">${texto}</textarea></label>`;
    }
    if (tipo === 'select') {
        const opciones = Object.entries(extra).map(([clave, nombre]) =>
            `<option value="${clave}"${clave === valor ? ' selected' : ''}>${escapeHtml(nombre)}</option>`).join('');
        return `<label>${etiqueta}<select name="${name}">${opciones}</select></label>`;
    }
    const ejemplo = extra ? ` placeholder="${escapeHtml(extra)}"` : '';
    return `<label>${etiqueta}<input name="${name}" type="${tipo || 'text'}" value="${texto}"${ejemplo}></label>`;
}

// vista previa + botón para subir + campo oculto con la dirección de la foto
function fotoHtml(name, valor, carpetaVieja, atributos) {
    const foto = fotoUrl(valor, carpetaVieja);
    return `
        <div class="foto-campo">
            ${foto ? `<img class="foto-preview" src="${escapeHtml(foto)}" alt="">` : '<div class="foto-preview foto-vacia">Sin foto</div>'}
            <label class="file-picker">
                <input type="file" accept="image/*,.heic" ${atributos}>
                <span class="file-button">${foto ? 'Cambiar foto' : 'Subir foto'}</span>
            </label>
            ${foto ? `<button type="button" class="danger" data-quitar-foto="${name}">Quitar foto</button>` : ''}
            <input type="hidden" name="${name}" value="${escapeHtml(valor || '')}">
        </div>`;
}

function renderLista(lista) {
    const config = listas[lista];
    const items = content[lista];
    const contenedor = document.querySelector(`[data-lista="${lista}"]`);
    if (!contenedor) return;

    if (!items.length) {
        contenedor.innerHTML = '<p class="hint">Todavía no hay elementos.</p>';
        return;
    }

    contenedor.innerHTML = items.map((item, index) => {
        const bloqueFoto = config.foto
            ? fotoHtml(`${lista}.${index}.${config.foto}`, item[config.foto], config.carpetaVieja, `data-subir="${lista}" data-index="${index}"`)
            : '';
        return `<div class="item" data-index="${index}">
            <h3>${config.titulo(index)}</h3>
            ${bloqueFoto}
            <div class="form-grid">${config.campos.map((campo) => campoHtml(`${lista}.${index}.${campo[0]}`, campo, item[campo[0]])).join('')}</div>
            <button type="button" class="remove" data-quitar="${lista}" data-index="${index}">Eliminar</button>
        </div>`;
    }).join('');
}

// fotos sueltas (escudo y portada)
function renderFotosSueltas() {
    document.querySelectorAll('[data-foto]').forEach((caja) => {
        const ruta = caja.dataset.foto;
        caja.innerHTML = `<p class="foto-etiqueta">${escapeHtml(caja.dataset.etiqueta || 'Foto')}</p>`
            + fotoHtml(ruta, leerRuta(content, ruta), 'imagenes-sitio', `data-subir-campo="${ruta}" data-carpeta="${caja.dataset.carpeta || 'sitio'}"`);
    });
}

// llena todos los campos sueltos (los que no están dentro de una lista) con lo guardado
function render() {
    document.querySelectorAll('#content-form [name]').forEach((campo) => {
        if (campo.closest('[data-lista], [data-foto]')) return;
        campo.value = leerRuta(content, campo.name) ?? '';
    });
    renderFotosSueltas();
    Object.keys(listas).forEach(renderLista);
}

// pasa lo escrito en el formulario a `content` (antes de agregar, quitar o subir, para no perder lo escrito)
function collect() {
    document.querySelectorAll('#content-form [name]').forEach((campo) => {
        let valor = campo.value;
        if (campo.type === 'number') {
            const index = Number(campo.name.split('.')[1]);
            valor = Number(valor) || index + 1;
        } else if (campo.type !== 'hidden') {
            valor = valor.trim();
        }
        escribirRuta(content, campo.name, valor);
    });
}

function normalizar(datos) {
    const lista = (valor) => (Array.isArray(valor) ? valor : []);
    const objeto = (valor) => (valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {});
    const resultado = {
        ...datos,
        institution: objeto(datos.institution),
        sections: objeto(datos.sections),
        lema: objeto(datos.lema),
        contacto: objeto(datos.contacto),
        redes: objeto(datos.redes),
        legal: objeto(datos.legal)
    };
    resultado.sections.inicio = objeto(resultado.sections.inicio);
    Object.keys(listas).forEach((nombre) => {
        // las listas que nunca se han guardado empiezan con su plantilla, para que se vea qué llenar
        resultado[nombre] = Array.isArray(datos[nombre]) ? datos[nombre] : JSON.parse(JSON.stringify(plantillas[nombre] || []));
    });
    resultado.notices = lista(resultado.notices);
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
        throw new Error('Primero llena y guarda la "Configuración de fotos (Cloudinary)", al final del panel.');
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
    const { subir: lista, subirVarias: varias, subirCampo: campoSuelto } = event.target.dataset;
    const archivos = [...(event.target.files || [])];
    if (!(lista || varias || campoSuelto) || !archivos.length) return;

    collect();
    $('#save-message').textContent = `Subiendo ${archivos.length === 1 ? 'la foto' : `${archivos.length} fotos`}...`;

    try {
        if (campoSuelto) {
            escribirRuta(content, campoSuelto, await subirFoto(archivos[0], event.target.dataset.carpeta || 'sitio'));
            renderFotosSueltas();
        } else {
            const nombre = lista || varias;
            const config = listas[nombre];
            for (const archivo of archivos) {
                const url = await subirFoto(archivo, config.carpeta);
                if (lista) content[nombre][Number(event.target.dataset.index)][config.foto] = url;
                else content[nombre].push({ ...config.nuevo(), [config.foto]: url });
            }
            renderLista(nombre);
        }
        hayCambios = true;
        $('#save-message').textContent = 'Foto lista. Pulsa "Guardar cambios" para publicarla.';
    } catch (error) {
        console.error('Error al subir la foto:', error);
        $('#save-message').textContent = error.message;
    }
    event.target.value = '';
});

// ==========================
// AGREGAR Y QUITAR ELEMENTOS Y FOTOS
// ==========================
document.addEventListener('click', (event) => {
    const { agregar, quitar, quitarFoto } = event.target.dataset;
    if (!agregar && !quitar && !quitarFoto) return;

    collect();
    if (quitarFoto) {
        escribirRuta(content, quitarFoto, '');
        renderFotosSueltas();
        Object.keys(listas).forEach(renderLista);
    } else {
        if (agregar) content[agregar].push(listas[agregar].nuevo());
        if (quitar) content[quitar].splice(Number(event.target.dataset.index), 1);
        renderLista(agregar || quitar);
    }
    hayCambios = true;
});

// ==========================
// GUARDAR
// ==========================
let hayCambios = false;

$('#content-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    collect();
    content.docentes.sort((a, b) => a.order - b.order);
    content.personal.sort((a, b) => a.order - b.order);
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
