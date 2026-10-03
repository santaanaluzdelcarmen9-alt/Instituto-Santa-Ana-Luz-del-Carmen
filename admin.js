const tokenKey = 'santa-ana-admin-token';
let content = null;
const $ = (selector) => document.querySelector(selector);
const camposLegales = ['nit', 'telefono', 'direccion', 'ciudad', 'correo', 'actualizado'];

function request(url, options = {}) {
    const token = sessionStorage.getItem(tokenKey);
    const headers = { ...(options.headers || {}) };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(url, { ...options, headers });
}

async function handleUnauthorized() {
    sessionStorage.removeItem(tokenKey);
    showLogin();
}

function showAdmin() {
    $('#login-view').hidden = true;
    $('#admin-view').hidden = false;
}

function showLogin() {
    $('#login-view').hidden = false;
    $('#admin-view').hidden = true;
}

function input(name, value, label, type = 'text') {
    return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value || '')}"></label>`;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ 
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
     }[character]
    ));
}

function render() {
    const sections = content.sections || {};
    const inicio = sections.inicio || {};

    $('[name="institution.name"]').value = content.institution.name || '';
    $('[name="institution.badge"]').value = content.institution.badge || '';
    $('[name="institution.description"]').value = content.institution.description || '';
    $('[name="section.inicio.mission"]').value = inicio.mission || '';
    $('[name="section.inicio.vision"]').value = inicio.vision || '';
    $('[name="section.inicio.values"]').value = inicio.values || '';
    $('[name="section.inicio.manual"]').value = inicio.manual || '';
    $('[name="section.Actividades"]').value = sections.Actividades || '';
    $('[name="section.academico"]').value = sections.academico || '';
    $('[name="section.instalaciones"]').value = sections.instalaciones || '';
    $('[name="section.noticias"]').value = sections.noticias || '';
    $('[name="section.contacto"]').value = sections.contacto || '';

    const legal = content.legal || {};
    camposLegales.forEach((campo) => { $(`[name="legal.${campo}"]`).value = legal[campo] || ''; });

    $('#notices-list').innerHTML = content.notices.map((notice, index) => `<div class="item notice-item" data-index="${index}">
      ${input(`notice.${index}.title`,notice.title, 'Título')}
        ${input(`notice.${index}.text`, notice.text, 'Texto')}
            <button type="button" class="remove" data-remove-notice="
        ${index}">Eliminar</button></div>`
    ).join('');

    $('#instalaciones-list').innerHTML = (content.instalaciones || []).map((inst, index) => `<div class="item instalacion-item" data-index="${index}">
      <h3>Instalación ${index + 1}</h3>
      ${input(`instalacion.${index}.nombre`, inst.nombre, 'Nombre')}
        ${input(`instalacion.${index}.descripcion`, inst.descripcion, 'Descripción')}
        ${input(`instalacion.${index}.foto`, inst.foto, 'Archivo de foto')}
      <label class="photo-upload">Subir una foto<span class="file-picker"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-photo-inst="${index}"><span class="file-button">Elegir foto</span><span class="file-name">${inst.foto ? escapeHtml(inst.foto) : 'Ningún archivo seleccionado'}</span></span>
        </label><button type="button" class="remove" data-remove-instalacion="${index}">Eliminar</button></div>`
    ).join('');

    $('#teachers-list').innerHTML = content.docentes.map((teacher, index) => 
        `<div class="item teacher-item" data-index="
        ${index}"><h3>Ficha ${index + 1}
            </h3><div class="item-grid">
        ${input(`teacher.${index}.order`, teacher.order, 'Orden', 'number')}
        ${input(`teacher.${index}.name`, teacher.name, 'Nombre')}
        ${input(`teacher.${index}.profession`, teacher.profession, 'Cargo o acompañamiento')}
        ${input(`teacher.${index}.infografia`, teacher.infografia, 'Descripción')}
        ${input(`teacher.${index}.info`, teacher.info, 'Asignatura')}
        ${input(`teacher.${index}.photo`, teacher.photo, 'Archivo de foto')}
        </div><label class="photo-upload">Subir una foto<span class="file-picker"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-photo="${index}"><span class="file-button">Elegir foto</span><span class="file-name">${teacher.photo ? escapeHtml(teacher.photo) : 'Ningún archivo seleccionado'}</span></span>
        </label><button type="button" class="remove" data-remove-teacher="${index}
        ">Eliminar</button></div>`
    ).join('');
}

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
    sections.instalaciones = $('[name="section.instalaciones"]').value;
    sections.noticias = $('[name="section.noticias"]').value;
    sections.contacto = $('[name="section.contacto"]').value;
    content.sections = sections;

    content.legal = {};
    camposLegales.forEach((campo) => { content.legal[campo] = $(`[name="legal.${campo}"]`).value.trim(); });

    document.querySelectorAll('.notice-item').forEach((element, index) => 
        { content.notices
            [index].title = element.querySelector(`[name="notice.${index}.title"]`)
          .value; content.notices
            [index].text = element.querySelector(`[name="notice.${index}.text"]`)
            .value; 
});

    document.querySelectorAll('.instalacion-item').forEach((element, index) => { 
        const inst = content.instalaciones[index];
        inst.nombre = element.querySelector(`[name="instalacion.${index}.nombre"]`).value;
        inst.descripcion = element.querySelector(`[name="instalacion.${index}.descripcion"]`).value;
        inst.foto = element.querySelector(`[name="instalacion.${index}.foto"]`).value;
    });

    document.querySelectorAll('.teacher-item').forEach((element, index) => { const teacher = content.docentes[index];
        teacher.order = Number(element.querySelector(`[name="teacher.${index}.order"]`).value) || 
        index + 1; teacher.name = element.querySelector(`[name="teacher.${index}.name"]`).value;
        teacher.profession = element.querySelector(`[name="teacher.${index}.profession"]`).value;
        teacher.infografia = element.querySelector(`[name="teacher.${index}.infografia"]`).value; 
        teacher.info = element.querySelector(`[name="teacher.${index}.info"]`).value; 
        teacher.photo = element.querySelector(`[name="teacher.${index}.photo"]`).value; 
    });


    content.docentes.sort((a, b) => a.order - b.order);
}

async function loadContent() {
    const response = await request('/api/admin/content');

    if (response.status === 401) {
        await handleUnauthorized();
        return;
    }

    if (!response.ok) throw new Error('No se pudo cargar el contenido');
    content = await response.json();

    // cambios que quedaron pendientes porque la sesión se cerró al guardar
    const borrador = leerBorrador();
    if (borrador) {
        content = borrador;
        render();
        showAdmin();
        await saveContent();
        return;
    }

    render();
    showAdmin();
    await loadProfesores();
    await loadUsers();
}

// ==========================
// PROFESORES (correos que entran a Actividades como profesor)
// ==========================
function renderProfesores(profesores) {
    $('#profesores-list').innerHTML = profesores.length
        ? profesores.map((email) => `<li data-email="${escapeHtml(email)}">
            <span>${escapeHtml(email)}</span>
            <button type="button" class="danger" data-quitar-profesor>Quitar</button>
        </li>`).join('')
        : '<li class="hint">Todavía no hay profesores. Mientras tanto, todos entran como estudiantes.</li>';
}

async function loadProfesores() {
    const response = await request('/api/admin/profesores');
    if (response.status === 401) return handleUnauthorized();
    if (!response.ok) {
        $('#profesores-message').textContent = 'No se pudo cargar la lista de profesores.';
        return;
    }
    renderProfesores(await response.json());
}

// después de cambiar la lista se recargan las cuentas, porque su rol cambia
async function afterProfesoresChange(response, okMessage) {
    if (response.status === 401) return handleUnauthorized();
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        $('#profesores-message').textContent = result.mensaje || 'No se pudo actualizar la lista.';
        return false;
    }
    renderProfesores(result);
    $('#profesores-message').textContent = okMessage;
    await loadUsers();
    return true;
}

$('#profesor-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('#profesor-email').value.trim().toLowerCase();
    const response = await request('/api/admin/profesores', { method: 'POST', body: JSON.stringify({ email }) });
    if (await afterProfesoresChange(response, `${email} ahora es profesor.`)) {
        $('#profesor-form').reset();
    }
});

$('#profesores-list').addEventListener('click', async (event) => {
    if (!event.target.matches('[data-quitar-profesor]')) return;
    const email = event.target.closest('li').dataset.email;
    if (!confirm(`¿Quitar a ${email} de la lista de profesores? Pasará a ser estudiante.`)) return;
    const response = await request(`/api/admin/profesores/${encodeURIComponent(email)}`, { method: 'DELETE' });
    await afterProfesoresChange(response, `${email} ahora es estudiante.`);
});

// ==========================
// CUENTAS (personas que han entrado con Google)
// ==========================
const rolTexto = { profesor: 'Profesor', estudiante: 'Estudiante' };

function renderUsers(usuarios) {
    if (!usuarios.length) {
        $('#users-list').innerHTML = '<p class="hint">Todavía nadie ha entrado con Google.</p>';
        return;
    }

    $('#users-list').innerHTML = usuarios.map((user) => {
        const email = escapeHtml(user.email);
        const bloqueado = user.estado === 'rechazado';

        return `<div class="item user-item" data-email="${email}">
            <div class="user-info">
                <strong>${escapeHtml(user.nombre || user.email)}</strong>
                <span class="hint">${email}</span>
                <span class="user-badges">
                    <span class="user-estado rol-${escapeHtml(user.rol)}">${rolTexto[user.rol] || escapeHtml(user.rol)}</span>
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
}

async function loadUsers() {
    const response = await request('/api/admin/usuarios');
    if (response.status === 401) return handleUnauthorized();
    if (!response.ok) {
        $('#users-message').textContent = 'No se pudieron cargar las cuentas.';
        return;
    }
    $('#users-message').textContent = '';
    renderUsers(await response.json());
}

$('#refresh-users').addEventListener('click', loadUsers);

$('#users-list').addEventListener('click', async (event) => {
    const action = event.target.dataset.userAction;
    if (!action) return;

    const email = encodeURIComponent(event.target.closest('.user-item').dataset.email);
    const response = action === 'eliminar'
        ? await request(`/api/admin/usuarios/${email}`, { method: 'DELETE' })
        : await request(`/api/admin/usuarios/${email}`, { method: 'PUT', body: JSON.stringify({ estado: action }) });

    if (response.status === 401) return handleUnauthorized();
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        $('#users-message').textContent = result.mensaje || 'No se pudo actualizar la cuenta.';
        return;
    }
    await loadUsers();
});

$('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: $('#email').value, password: $('#password').value 
        }) 
});

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        $('#login-message').textContent = error.mensaje || 'Correo o contraseña incorrectos.';
         return;
    }

    const result = await response.json();
        sessionStorage.setItem(tokenKey, result.token);
        await loadContent();
});

// ==========================
// GUARDAR SIN PERDER CAMBIOS
// ==========================
// Las sesiones viven en la memoria del servidor: si se reinicia mientras el panel está abierto, el
// guardado responde 401. En ese caso los cambios se guardan como borrador en este navegador, se pide
// entrar de nuevo y, al entrar, se guardan solos.
const draftKey = 'santa-ana-admin-borrador';
let hayCambios = false;

function leerBorrador() {
    try { return JSON.parse(sessionStorage.getItem(draftKey) || 'null'); } catch (error) { return null; }
}

function guardarBorrador(data) {
    try { sessionStorage.setItem(draftKey, JSON.stringify(data)); } catch (error) { /* sin almacenamiento */ }
}

function borrarBorrador() {
    try { sessionStorage.removeItem(draftKey); } catch (error) { /* sin almacenamiento */ }
}

async function saveContent() {
    $('#save-message').textContent = 'Guardando...';
    let response;
    try {
        response = await request('/api/admin/content', { method: 'PUT', body: JSON.stringify(content) });
    } catch (error) {
        $('#save-message').textContent = 'No hay conexión con el servidor. Revisa que esté encendido (npm start) y vuelve a guardar.';
        return;
    }

    if (response.status === 401) {
        guardarBorrador(content);
        hayCambios = false;
        await handleUnauthorized();
        $('#login-message').textContent = 'Tu sesión se cerró. Vuelve a entrar: tus cambios no se perdieron y se guardarán solos.';
        return;
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        $('#save-message').textContent = error.mensaje || 'No se pudieron guardar los cambios.';
        return;
    }

    borrarBorrador();
    hayCambios = false;
    $('#save-message').textContent = 'Cambios guardados.';
    setTimeout(() => window.location.reload(), 600);
}

$('#content-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    collect();
    await saveContent();
});

// avisa antes de salir o recargar si hay cambios sin guardar
['input', 'change'].forEach((tipo) => $('#content-form').addEventListener(tipo, () => { hayCambios = true; }));
document.addEventListener('click', (event) => {
    if (event.target.matches('#add-notice, #add-instalacion, #add-teacher, [data-remove-notice], [data-remove-instalacion], [data-remove-teacher]')) {
        hayCambios = true;
    }
});
window.addEventListener('beforeunload', (event) => {
    if (!hayCambios) return;
    event.preventDefault();
    event.returnValue = '';
});

$('#add-notice').addEventListener('click', () => { content.notices.push({ title: '', text: '' }); render();
});

$('#add-instalacion').addEventListener('click', () => { 
    if (!content.instalaciones) content.instalaciones = [];
    content.instalaciones.push({ 
        id: `instalacion-${Date.now()}`,
        nombre: '', 
        descripcion: '' 
    }); 
    render();
});

$('#add-teacher').addEventListener('click', () => {
     content.docentes.push({ id: `docente-${Date.now()}`,
    order: content.docentes.length + 1,
    name: '',
    photo: '',
    infografia: '',
    info: '',
    profession: '' 
});

render();
});

document.addEventListener(
    'click', (event) => { 
        const notice = event.target.dataset.removeNotice; 
        const instalacion = event.target.dataset.removeInstalacion;
        const teacher = event.target.dataset.removeTeacher;
        if (notice !== undefined) 
            { content.notices.splice(Number(notice), 1);
            render(); 
        }
        if (instalacion !== undefined) 
            { content.instalaciones.splice(Number(instalacion), 1);
            render(); 
        }
        if (teacher !== undefined) 
            { content.docentes.splice(Number(teacher), 1);
            render(); 
        }
});

document.addEventListener('change', async (event) => { 
    const photoIndex = event.target.dataset.photo;
    const photoInstIndex = event.target.dataset.photoInst;

    if (photoIndex === undefined && photoInstIndex === undefined || !event.target.files[0]) return;

    const file = event.target.files[0];
    event.target.closest('.file-picker').querySelector('.file-name').textContent = file.name;
    const data = await new Promise((resolve, reject) => { 
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject; 
        reader.readAsDataURL(file); 
    });

    // Upload para docentes
    if (photoIndex !== undefined) {
        const response = await request('/api/admin/upload',
            { method: 'POST', body: JSON.stringify({ 
                fileName: `${content.docentes[photoIndex].order}-${content.docentes[photoIndex].name || 'docente'}-${Date.now()}`, 
                type: file.type, 
                data, 
                folder: 'fotos-docentes' 
            }) 
        });

        if (response.ok) { 
            const result = await response.json();
            content.docentes[photoIndex].photo = result.fileName; 
            render(); 
        } 
    }

    // Upload para instalaciones
    if (photoInstIndex !== undefined) {
        const response = await request('/api/admin/upload',
            { method: 'POST', body: JSON.stringify({ 
                fileName: `${content.instalaciones[photoInstIndex].nombre}-${Date.now()}`, 
                type: file.type, 
                data, 
                folder: 'fotos-instalaciones' 
            }) 
        });

        if (response.ok) { 
            const result = await response.json();
            content.instalaciones[photoInstIndex].foto = result.fileName; 
            render(); 
        } 
    }
});

$('#logout-button').addEventListener('click', async () => {
    try {
        await request('/api/admin/logout', { method: 'POST' });
    } catch (error) {
        console.warn('No se pudo cerrar sesión en el servidor', error);
    }

    sessionStorage.removeItem(tokenKey);
    showLogin();
});

if (sessionStorage.getItem(tokenKey)) {
    loadContent().catch(() => {
        sessionStorage.removeItem(tokenKey);
        showLogin();
    });
} else {
    showLogin();
}