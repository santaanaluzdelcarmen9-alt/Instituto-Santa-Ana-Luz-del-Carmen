const tokenKey = 'santa-ana-admin-token';
let content = null;
const $ = (selector) => document.querySelector(selector);

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
    $('[name="section.conocenos"]').value = sections.conocenos || '';
    $('[name="section.academico"]').value = sections.academico || '';
    $('[name="section.instalaciones"]').value = sections.instalaciones || '';
    $('[name="section.noticias"]').value = sections.noticias || '';
    $('[name="section.contacto"]').value = sections.contacto || '';

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
    sections.conocenos = $('[name="section.conocenos"]').value;
    sections.academico = $('[name="section.academico"]').value;
    sections.instalaciones = $('[name="section.instalaciones"]').value;
    sections.noticias = $('[name="section.noticias"]').value;
    sections.contacto = $('[name="section.contacto"]').value;
    content.sections = sections;

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
    render();
    showAdmin();
}

$('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: $('#email').value, password: $('#password').value 
        }) 
});

    if (!response.ok) { $('#login-message').textContent = 'Correo o contraseña incorrectos.';
         return;
    }

    const result = await response.json();
        sessionStorage.setItem(tokenKey, result.token);
        await loadContent();
});

$('#content-form').addEventListener('submit', async (event) => {
    event.preventDefault(); collect();
    const response = await request('/api/admin/content', { method: 'PUT', body: JSON.stringify(content) });
    $('#save-message').textContent = response.ok ? 'Cambios guardados.' : 'No se pudieron guardar los cambios.';

    if (response.ok) {
        setTimeout(() => {
            window.location.reload();
        }, 300);
    }
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