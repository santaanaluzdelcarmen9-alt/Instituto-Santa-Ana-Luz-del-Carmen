document.addEventListener('DOMContentLoaded', function () {
    const contentPanel = document.getElementById('content-panel');
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const pageHeader = document.querySelector('.page-header');
    let publicContent = {
        institution: {},
        notices: [],
        docentes: [],
        instalaciones: [],
        galeria: [],
        noticias: [],
        legal: {},
        sections: {
            inicio: { mission: '...', vision: '...', values: '...', manual: '...' },
            Actividades: '...',
            academico: '...',
            instalaciones: '...',
            noticias: '...',
            contacto: '...'
        }
    };

    const escapeHtml = (value = '') => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // las secciones con fotos esperan a que llegue el contenido (mientras tanto dicen "Cargando...")
    let contenidoCargado = false;

    // Lee el contenido que guardan las directivas en Firestore. Mientras nadie haya guardado desde el panel,
    // se usa el contenido inicial de data/site-content.json.
    async function leerContenido() {
        const snap = await contenidoDoc.get();
        if (snap.exists) return snap.data();
        const response = await fetch('data/site-content.json');
        if (!response.ok) throw new Error('No se pudo cargar el contenido inicial');
        return response.json();
    }

    async function loadPublicContent() {
        try {
            const datos = await leerContenido();
            const lista = (valor) => (Array.isArray(valor) ? valor : []);
            publicContent = {
                ...publicContent,
                ...datos,
                notices: lista(datos.notices),
                docentes: lista(datos.docentes).slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
                instalaciones: lista(datos.instalaciones),
                galeria: lista(datos.galeria),
                noticias: lista(datos.noticias),
                sections: { ...publicContent.sections, ...(datos.sections || {}) }
            };
            contenidoCargado = true;
            const institution = publicContent.institution || {};
            const title = document.querySelector('.page-header__title');
            const badge = document.querySelector('.page-header__badge');
            const description = document.querySelector('.page-header__text');

            if (title) title.textContent = institution.name || title.textContent;
            if (badge) badge.textContent = institution.badge || badge.textContent;
            if (description) description.textContent = institution.description || description.textContent;

            // los avisos se pintan todos desde el panel: se pueden agregar o quitar sin tocar index.html
            const avisos = document.querySelector('.right');
            if (avisos && Array.isArray(publicContent.notices)) {
                avisos.querySelectorAll('.notice').forEach((notice) => notice.remove());
                publicContent.notices
                    .filter((notice) => notice.title || notice.text)
                    .forEach((data) => {
                        const notice = document.createElement('div');
                        notice.className = 'notice';
                        notice.innerHTML = `<h4>${escapeHtml(data.title || '')}</h4><p>${escapeHtml(data.text || '')}</p>`;
                        avisos.appendChild(notice);
                    });
            }

            const sectionName = window.location.hash.substring(1) || 'inicio';
            renderSection(sectionName);
        } catch (error) {
            console.error('Error al cargar el contenido público:', error);
        }
    }

    // ==========================
    // DATOS LEGALES DEL COLEGIO
    // ==========================
    // Los datos se llenan en admin.html ("Datos legales del colegio"). Mientras falten, se muestran [corchetes].
    function datoLegal(campo, siFalta) {
        const valor = String(publicContent.legal?.[campo] || '').trim();
        return valor ? escapeHtml(valor) : siFalta;
    }

    function fechaLegal() {
        const valor = publicContent.legal?.actualizado;
        const fecha = valor ? new Date(`${valor}T12:00:00`) : null;
        return fecha && !isNaN(fecha)
            ? fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
            : '[fecha de la última actualización]';
    }

    const datosLegales = {
        get nit() { return datoLegal('nit', '[NIT del colegio]'); },
        get direccion() { return datoLegal('direccion', '[Dirección del colegio]'); },
        get ciudad() { return `${datoLegal('ciudad', '[Ciudad]')}, Colombia`; },
        get correo() { return datoLegal('correo', '[correo de contacto de las directivas]'); },
        get telefono() { return datoLegal('telefono', '[teléfono]'); },
        get actualizado() { return fechaLegal(); }
    };

    function paginaLegal(titulo, cuerpo) {
        return `
            <section class="section-card legal-section">
                <h2>${titulo}</h2>
                <div class="legal">${cuerpo}</div>
            </section>
        `;
    }

    function nombreColegio() {
        return escapeHtml(publicContent.institution?.name || 'Instituto Santa Ana Luz del Carmen');
    }

    const sections = {
        privacidad: () => paginaLegal('Política de tratamiento de datos personales', `
            <p class="legal-fecha">Última actualización: ${datosLegales.actualizado}</p>

            <h3>1. Responsable del tratamiento</h3>
            <p>${nombreColegio()}, NIT ${datosLegales.nit}, con domicilio en ${datosLegales.direccion}, ${datosLegales.ciudad}.
            Correo: ${datosLegales.correo}. Teléfono: ${datosLegales.telefono}.</p>

            <h3>2. Marco legal</h3>
            <p>Esta política se expide en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el
            Decreto 1074 de 2015) y la Ley 1098 de 2006 (Código de la Infancia y la Adolescencia).</p>

            <h3>3. Datos que recogemos y para qué</h3>
            <ul>
                <li><strong>Ingreso a Actividades con Google:</strong> nombre, correo electrónico, foto de perfil y fecha del último
                ingreso. Se usan solo para identificar a estudiantes y profesores, darles acceso a la sección y permitir que las
                directivas administren las cuentas.</li>
                <li><strong>Panel de directivas:</strong> el correo de acceso de las directivas, para proteger la edición del sitio.</li>
                <li><strong>Docentes:</strong> nombre, cargo, asignatura y fotografía, publicados con su autorización.</li>
                <li><strong>Fotografías de actividades y de Grado Once:</strong> publicadas con fines institucionales y de memoria
                escolar, con la autorización previa de los padres o acudientes cuando aparecen menores de edad.</li>
            </ul>
            <p>El sitio no recoge contraseñas de estudiantes ni de profesores, no vende datos y no los usa con fines comerciales.</p>

            <h3>4. Datos de niños, niñas y adolescentes</h3>
            <p>El tratamiento de datos de menores de edad respeta su interés superior y sus derechos fundamentales. Las imágenes y
            nombres de estudiantes solo se publican con autorización expresa de sus padres o representantes legales, quienes
            pueden retirarla en cualquier momento escribiendo a ${datosLegales.correo}.</p>

            <h3>5. Derechos de los titulares</h3>
            <p>Toda persona puede conocer, actualizar, rectificar y pedir la supresión de sus datos; solicitar prueba de la
            autorización; ser informada sobre el uso de sus datos; revocar la autorización y presentar quejas ante la
            Superintendencia de Industria y Comercio.</p>

            <h3>6. Cómo ejercer sus derechos</h3>
            <p>Escriba a ${datosLegales.correo} indicando su nombre, la solicitud y un medio de respuesta. Las consultas se responden
            en máximo 10 días hábiles y los reclamos en máximo 15 días hábiles, según los artículos 14 y 15 de la Ley 1581 de 2012.</p>

            <h3>7. Servicios de terceros y transferencia internacional</h3>
            <p>El sitio se aloja en Google Firebase, que también guarda las cuentas de Actividades y permite el ingreso con Google;
            las fotografías se guardan en Cloudinary, y el asistente de chat usa Botpress. Estos proveedores pueden tratar datos
            en servidores fuera de Colombia (principalmente en Estados Unidos) bajo sus propias políticas de privacidad. Al usar
            esas funciones, el usuario lo acepta.</p>

            <h3>8. Seguridad y conservación</h3>
            <p>Los datos se guardan con medidas razonables de seguridad y solo durante el tiempo necesario para la finalidad
            descrita. Las directivas pueden eliminar una cuenta en cualquier momento.</p>

            <h3>9. Almacenamiento en el navegador</h3>
            <p>El sitio guarda en el navegador solo lo necesario para mantener abierta la sesión. No usa cookies de publicidad ni
            de seguimiento propias.</p>
        `),
        terminos: () => paginaLegal('Términos y condiciones de uso', `
            <p class="legal-fecha">Última actualización: ${datosLegales.actualizado}</p>

            <h3>1. Aceptación</h3>
            <p>Al navegar este sitio, de ${nombreColegio()}, usted acepta estos términos. Si no está de acuerdo, por favor no lo use.</p>

            <h3>2. Finalidad del sitio</h3>
            <p>El sitio es informativo y educativo: presenta la institución, sus noticias y actividades, y ofrece a la comunidad
            educativa una sección de Actividades.</p>

            <h3>3. Cuentas en Actividades</h3>
            <ul>
                <li>El ingreso es personal; no comparta su cuenta.</li>
                <li>Se debe usar con respeto, conforme al Manual de Convivencia del colegio.</li>
                <li>Las directivas pueden suspender o eliminar el acceso de quien haga mal uso del sitio.</li>
            </ul>

            <h3>4. Conductas prohibidas</h3>
            <p>Publicar contenido ofensivo, discriminatorio o que afecte a menores; suplantar a otra persona; intentar acceder sin
            permiso al panel o a cuentas ajenas, o dañar el sitio. Estas conductas pueden constituir delitos según la Ley 1273 de 2009.</p>

            <h3>5. Propiedad intelectual</h3>
            <p>Los textos, logotipos, fotografías y diseños son del colegio o de sus autores, protegidos por la Ley 23 de 1982. No se
            pueden copiar ni usar con fines comerciales sin autorización escrita.</p>

            <h3>6. Responsabilidad</h3>
            <p>El colegio procura que la información esté actualizada, pero puede contener errores o cambiar sin aviso. No responde
            por fallas de conexión ni por los servicios de terceros enlazados (Google, Cloudinary, Botpress).</p>

            <h3>7. Datos personales</h3>
            <p>El tratamiento de datos se rige por la <a href="#privacidad" class="legal-link" data-section="privacidad">Política de
            tratamiento de datos personales</a>.</p>

            <h3>8. Cambios y ley aplicable</h3>
            <p>El colegio puede modificar estos términos; la versión vigente es la publicada aquí. Se rigen por las leyes de la
            República de Colombia. Contacto: ${datosLegales.correo}.</p>

            <h3>9. Desarrollo del sitio</h3>
            <p>Sitio desarrollado por Samuel Mateo Yate Escobar con ayuda de Claude Code, una herramienta
            de inteligencia artificial de Anthropic.</p>
        `),
        'avisos-legales': () => paginaLegal('Aviso de imágenes y servicios externos', `
            <h3>Uso de imágenes</h3>
            <p>Las fotografías de estudiantes, docentes y actividades se publican con fines institucionales y con la autorización
            correspondiente. Si usted aparece en una foto, o es padre, madre o acudiente de un estudiante que aparece, y desea que
            se retire, escriba a ${datosLegales.correo} y será retirada en el menor tiempo posible.</p>

            <h3>Servicios externos</h3>
            <ul>
                <li><strong>Google Firebase:</strong> aloja el sitio, guarda su contenido y las cuentas de Actividades, y permite
                ingresar con Google. Ver la política de privacidad de Google.</li>
                <li><strong>Cloudinary:</strong> guarda y muestra las fotografías del sitio.</li>
                <li><strong>Botpress:</strong> el asistente de chat. No escriba en el chat datos sensibles como documentos de
                identidad, datos de salud o contraseñas.</li>
                <li><strong>jsDelivr:</strong> sirve los íconos del sitio.</li>
            </ul>
        `),
        inicio: () => {
            const inicio = publicContent.sections?.inicio || {};
            return `
            <section class="cards">
                <div class="card">
                    <h3>Misión</h3>
                    <p>${escapeHtml(inicio.mission || '...')}</p>
                </div>
                <div class="card">
                    <h3>Visión</h3>
                    <p>${escapeHtml(inicio.vision || '...')}</p>
                </div>
                <div class="card">
                    <h3>Valores</h3>
                    <p>${escapeHtml(inicio.values || '...')}</p>
                </div>
                <div class="card">
                    <h3>Manual</h3>
                    <p>${escapeHtml(inicio.manual || '...')}</p>
                </div>
            </section>
        `;
        },
        Actividades: () => `
            <section class="section-card actividades-section">
                <h2>Actividades</h2>
                <p>${escapeHtml(publicContent.sections?.Actividades || '...')}</p>

                <div id="actividades-login" class="actividades-login">
                    <div class="actividades-form">
                        <h3>Ingreso de estudiantes y profesores</h3>
                        <p class="actividades-ayuda">Entra con tu cuenta de Google. Los profesores registrados por las directivas entran como profesores; los demás, como estudiantes.</p>
                        <button type="button" id="actividades-google" class="actividades-google-btn"><i class="bi bi-google"></i> Continuar con Google</button>
                        <p class="actividades-aviso">Al continuar, el colegio guardará tu nombre, correo y foto de Google para darte acceso. Consulta la
                            <a href="#privacidad" class="legal-link" data-section="privacidad">Política de tratamiento de datos</a> y los
                            <a href="#terminos" class="legal-link" data-section="terminos">Términos y condiciones</a>.</p>
                        <p id="actividades-mensaje" class="actividades-mensaje" role="alert"></p>
                    </div>
                </div>

                <div id="actividades-panel" class="actividades-panel" hidden>
                    <div class="actividades-bar">
                        <h3 id="actividades-bienvenida"></h3>
                        <button type="button" id="actividades-salir" class="actividades-salir">Cerrar sesión</button>
                    </div>
                    <p id="actividades-contenido"></p>
                </div>
            </section>
        `,
        academico: () => `
            <section class="section-card">
                <h2>Académico</h2>
                <p>${escapeHtml(publicContent.sections?.academico || '...')}</p>
            </section>
        `,
        instalaciones: () => `
            <section class="section-card instalaciones-section">
                <h2>Instalaciones</h2>
                <div id="instalaciones-container" class="instalaciones-container">
                    <p>Cargando instalaciones...</p>
                </div>
            </section>
        `,
        docentes: () => `
            <section class="section-card docentes-section">
                <h2>Docentes</h2>

                <div class="docente-carousel" id="docente-carousel">
                    <div class="docente-card" id="docente-card">
                        <!-- contenido dinámico del docente -->
                    </div>

                    <div class="docente-controls">
                        <button class="docente-prev" id="docente-prev" aria-label="Anterior">&larr;</button>
                        <div class="docente-dots" id="docente-dots" aria-hidden="false"></div>
                        <button class="docente-next" id="docente-next" aria-label="Siguiente">&rarr;</button>
                    </div>
                </div>
            </section>
        `,
        noticias: () => `
            <section class="section-card noticias-container">
                <h2>Noticias</h2>
                
                
                <div class="notices-carousel" id="noticias-carousel">
                        <div class="noticias-card" id="noticias-container">
                     <!-- contenido dinamico del noticiero-->
                    </div>

                    <div class="noticias-controls">
                            <button class="noticias-prev" id="noticias-prev" aria-label="Anterior">&larr;</button>
                        <div class="noticias-dots" id="noticias-dots" aria-hidden="false"></div>
                        <button class="noticias-next" id="noticias-next" aria-label="Siguiente">&rarr;</button>
                    </div>
                </div>
            </section>
        `,
        galeria: () => `
            <section class="section-card">
                <h2>Galería</h2>

                <div id="galeria-container" class="galeria-container">
                    <p>Cargando fotografías...</p>
                </div>
            </section>
        `,
        contacto: () => `
            <section class="section-card">
                <h2>Contacto</h2>
                <p>${escapeHtml(publicContent.sections?.contacto || '...')}</p>
            </section>
        `,
        "grado-once": () => `
            <section class="section-card grado-once-section">
                <h2>Grado Once</h2>

                <div class="grado-carousel" id="grado-carousel">
                    <div class="grado-card" id="grado-card">
                        <!-- contenido dinámico del estudiante -->
                    </div>

                    <div class="grado-controls">
                        <button class="grado-prev" id="grado-prev" aria-label="Anterior">&larr;</button>
                        <div class="grado-dots" id="grado-dots" aria-hidden="false"></div>
                        <button class="grado-next" id="grado-next" aria-label="Siguiente">&rarr;</button>
                    </div>
                </div>
            </section>
        `
    };

    // ==========================
    // ACTIVIDADES: ingreso de estudiantes y profesores con Google (Firebase Authentication)
    // ==========================
    // Firebase recuerda la sesión en este navegador. Si el correo está en la lista de profesores del panel
    // es profesor; si no, estudiante. Las directivas pueden quitarle el acceso a cualquiera desde el panel.
    const textosActividades = {
        estudiante: 'Aquí verás las actividades que publiquen tus profesores.',
        profesor: 'Aquí podrás publicar y revisar actividades para tus estudiantes.'
    };

    // guarda (o actualiza) la cuenta en Firestore y devuelve su rol, o null si las directivas le quitaron el acceso
    async function registrarCuenta(user) {
        const email = String(user.email || '').toLowerCase();
        const ref = db.collection('usuarios').doc(user.uid);
        const snap = await ref.get();

        if (snap.exists && snap.data().estado === 'rechazado') return null;

        const datos = {
            email,
            nombre: user.displayName || email,
            foto: user.photoURL || '',
            ultimoIngreso: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (!snap.exists) {
            datos.estado = 'aprobado';
            datos.creado = firebase.firestore.FieldValue.serverTimestamp();
        }
        await ref.set(datos, { merge: true });

        const profesor = await db.collection('profesores').doc(email).get();
        return profesor.exists ? 'profesor' : 'estudiante';
    }

    let dejarDeEscucharSesion = null;

    function initActividades() {
        const loginView = document.getElementById('actividades-login');
        const panelView = document.getElementById('actividades-panel');
        const botonGoogle = document.getElementById('actividades-google');
        const mensaje = document.getElementById('actividades-mensaje');
        const bienvenida = document.getElementById('actividades-bienvenida');
        const contenido = document.getElementById('actividades-contenido');
        const botonSalir = document.getElementById('actividades-salir');

        if (!loginView || !panelView || !botonGoogle) return;

        function mostrarPanel(user, rol) {
            loginView.hidden = true;
            panelView.hidden = false;
            panelView.dataset.rol = rol;
            bienvenida.textContent = `Hola, ${user.displayName || user.email}`;
            contenido.textContent = textosActividades[rol] || '';
        }

        function mostrarLogin(texto = '') {
            panelView.hidden = true;
            loginView.hidden = false;
            mensaje.textContent = texto;
        }

        botonGoogle.addEventListener('click', async () => {
            mensaje.textContent = '';
            try {
                await entrarConGoogle();
            } catch (error) {
                if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                    console.error('Error al iniciar sesión en Actividades:', error);
                    mensaje.textContent = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
                }
            }
        });

        botonSalir.addEventListener('click', () => auth.signOut());

        // cada vez que se abre Actividades se vuelve a escuchar la sesión (la sección se pinta de nuevo)
        if (dejarDeEscucharSesion) dejarDeEscucharSesion();
        dejarDeEscucharSesion = auth.onAuthStateChanged(async (user) => {
            if (!document.body.contains(loginView)) return;
            if (!user) {
                mostrarLogin();
                return;
            }
            try {
                const rol = await registrarCuenta(user);
                if (!rol) {
                    await auth.signOut();
                    mostrarLogin('Tu cuenta no tiene acceso. Comunícate con las directivas del instituto.');
                    return;
                }
                mostrarPanel(user, rol);
            } catch (error) {
                console.error('Error al revisar la cuenta:', error);
                mostrarLogin('No se pudo revisar tu cuenta. Inténtalo de nuevo.');
            }
        });
    }

    // Grado Once se edita solo aquí, en el código (no está en el panel admin)
    const gradoOnceStudents = [
        {
            name: 'Dagoberto perez',
            photo: 'fotos-grado-once/docente1.jpg',
            infografia: 'Carismático, alegre y trabajador, siempre buscando lo mejor para sus estudiantes, defensor de quienes lo necesitan y con una gran capacidad para escuchar y comprender, dispuesto a acompañarnos y apoyarnos en cada momento, dejando una huella especial en quienes han compartido esta etapa con él.',
            info: 'Curso: 11 · Documento: 9001',
            dedicatoria: ''
        },
        {
            name: 'Sandra pinilla',
            photo: 'fotos-grado-once/docente2.jpg',
            infografia: 'Gran profesora, alegre, amable y siempre dispuesta a buscar lo mejor para sus estudiantes, resiliente y fuerte ante cada obstáculo, cariñosa, solidaria y defensora de quienes quiere, dejando una huella especial en cada persona que ha tenido la oportunidad de conocerla.',
            info: 'Curso: 11 · Documento: 9002',
            dedicatoria: ''
        },
        {
            name: 'Juan Pablo Bautista Rodríguez',
            photo: 'fotos-grado-once/alumno1.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1001',
            profession: 'Futuro ingeniero de sistemas'
        },
        {
            name: 'Valery Sofía Bonaldy yepes',
            photo: 'fotos-grado-once/alumno2.jpg',
            infografia: 'Gran personalidad, buena amiga y compañera, solidaria, valiente y con un gran estilo, siempre dispuesta a apoyar a quienes quiere, llena de sueños, metas y nuevos retos que está preparada para conquistar.',
            info: 'Curso: 11 · Documento: 1002',
            profession: 'Futura psicóloga'
        },
        {
            name: 'Nicolás Camen García ',
            photo: 'fotos-grado-once/alumno3.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1003',
            profession: 'Futuro ingeniero de sistemas'
        },
        {
            name: 'Mariana Castro blanco ',
            photo: 'fotos-grado-once/alumno4.jpg',
            infografia: 'Inteligente, estudiosa y responsable, apasionada por el baile, realista y constante con todo lo que se propone, una gran amiga y apoyo para quienes la rodean, alegre y dedicada, con sueños enormes y metas infinitas que la motivan a seguir creciendo y alcanzar todo aquello que se proponga.',
            info: 'Curso: 11 · Documento: 1004',
            profession: 'Futura ingeniera de sistemas'
        },
        {
            name: 'Ashley nicolle Choles soto ',
            photo: 'fotos-grado-once/alumno5.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1005',
            profession: 'Futura ingeniera de sistemas'
        },
        {
            name: 'Laura Sofía Cupasachoa cabezas ',
            photo: 'fotos-grado-once/alumno6.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1006',
            profession: 'Futura ingeniera de sistemas'
        },
        {
            name: 'Luis Carlos Domínguez truyol ',
            photo: 'fotos-grado-once/alumno7.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1007',
            profession: 'Futuro'
        },
        {
            name: 'Jennyfer Valentina Espitia ladino',
            photo: 'fotos-grado-once/alumno8.jpg',
            infografia: 'Extrovertida, cariñosa y llena de energía, un poquito ruidosa pero siempre con una sonrisa y una ocurrencia para compartir, amante del maquillaje y de los gatos, consciente de lo que quiere y de lo que la rodea, con un corazón dispuesto a escuchar, ayudar y hacer sentir bien a los demás, llena de sueños y metas por cumplir.',
            info: 'Curso: 11 · Documento: 1008',
            profession: 'Futura psicóloga'
        },
        {
            name: 'Yary yaneid Fajardo Cruz',
            photo: 'fotos-grado-once/alumno9.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1009',
            profession: 'Futura'
        },
        {
            name: 'Joseph Starly Gómez castellanos ',
            photo: 'fotos-grado-once/alumno10.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1010',
            profession: 'Futuro'
        },
        {
            name: 'María Camila López castiblanco',
            photo: 'fotos-grado-once/alumno11.jpg',
            infografia: 'Alegre, carismática y con una personalidad que no pasa desapercibida, con gustos variados y siempre dispuesta a descubrir cosas nuevas, apoya incondicionalmente a sus amigos, valiente y fuerte ante cualquier desafío, respetuosa, solidaria y con una energía que hace especial cada momento.',
            info: 'Curso: 11 · Documento: 1011',
            profession: 'Futura'
        },
        {
            name: 'Laura carolina lozada Martínez',
            photo: 'fotos-grado-once/alumno12.jpg',
            infografia: 'Carismática, responsable, amable y solidaria, con una personalidad alegre y un gran corazón, buena amiga y compañera, llena de sueños infinitos y nuevas experiencias por vivir, dejando su huella en cada paso que da.',
            info: 'Curso: 11 · Documento: 1012',
            profession: 'Futura'
        },
        {
            name: 'Julián David Mateus Amaya',
            photo: 'fotos-grado-once/alumno13.jpg',
            infografia: 'Gran estilo y personalidad, siempre destacando por su forma de ser y su buena energía, gran amigo, alegre y con un ambiente que contagia a quienes lo rodean, fuerte y valiente ante los retos, con grandes metas y la determinación para hacerlas realidad.',
            info: 'Curso: 11 · Documento: 1013',
            profession: 'Futuro'
        },
        {
            name: 'John David Monroy tique',
            photo: 'fotos-grado-once/alumno14.jpg',
            infografia: 'Corazón amable, extrovertido, muy alegre e inteligente, quiere mucho a sus amigos, siempre da lo mejor de sí, positivo y divertido, fan de Milo J, con muchas metas por alcanzar.',
            info: 'Curso: 11 · Documento: 1014',
            profession: 'Futuro médico veterinario zootecnista'
        },
        {
            name: 'Diego Ortega feria ',
            photo: 'fotos-grado-once/alumno15.jpg',
            infografia: 'Extrovertido, alegre y espontáneo, divertido y carismático, siempre tiene una ocurrencia para hacer reír, le encanta compartir con sus amigos y convertir cualquier momento en una anécdota, viviendo cada experiencia al máximo.',
            info: 'Curso: 11 · Documento: 1015',
            profession: 'Futuro'
        },
        {
            name: 'Vivian Johana quintero caceres',
            photo: 'fotos-grado-once/alumno16.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1016',
            profession: 'Futura ingeniera de sistemas'
        },
        {
            name: 'María José salas Ruiz ',
            photo: 'fotos-grado-once/alumno17.jpg',
            infografia: 'Gran amiga, carismática, responsable y deportista, con muchos sueños por cumplir, siempre comprometida con lo que se propone y con un gran corazón para sus amistades, disfrutando cada etapa mientras trabaja por aquello que desea.',
            info: 'Curso: 11 · Documento: 1017',
            profession: 'Futura repostera'
        },
        {
            name: 'Laura Alejandra Suárez giraldo ',
            photo: 'fotos-grado-once/alumno18.jpg',
            infografia: 'Gran compañía, alegre, extrovertida y apasionada, le encanta compartir y salir con sus amigos, decidida y soñadora, siempre lucha por aquello que se propone y está construyendo el camino hacia sus sueños.',
            info: 'Curso: 11 · Documento: 1018',
            profession: 'Futura negociadora internacional'
        },
        {
            name: 'Matías tiempo Ávila ',
            photo: 'fotos-grado-once/alumno19.jpg',
            infografia: 'Infografía',
            info: 'Curso: 11 · Documento: 1019',
            profession: 'Futuro ingeniero de sistemas'
        },
        {
            name: 'Kim mai lee Vanegas Rivas',
            photo: 'fotos-grado-once/alumno20.jpg',
            infografia: 'Súper extrovertida, deportista, carismática y alegre, siempre dispuesta a compartir momentos divertidos, con un gran corazón y mucha sensibilidad, le gusta ayudar a quienes la rodean y está lista para cumplir cada una de sus metas.',
            info: 'Curso: 11 · Documento: 1020',
            profession: 'Futura gastrónoma'
        },
        {
            name: 'Daysi Vanesa Vega gallo ',
            photo: 'fotos-grado-once/alumno21.jpg',
            infografia: 'Personalidad alegre, extrovertida y risueña, muy habladora, estudiosa e inteligente, con un corazón noble y siempre dispuesta a ayudar, amistosa, dedicada y llena de ilusiones que espera convertir en grandes logros.',
            info: 'Curso: 11 · Documento: 1021',
            profession: 'Futura'
        },
        {
            name: 'Duvan Velázquez ',
            photo: 'fotos-grado-once/alumno22.jpg',
            infografia: 'Callado, introvertido y alegre, de pocas palabras pero con un gran sentido del humor, amable, tranquilo y comprensivo, disfruta compartir con las personas que quiere, buen amigo y con muchas aspiraciones que poco a poco hará realidad.',
            info: 'Curso: 11 · Documento: 1022',
            profession: 'Futura ingeniera de sistemas'
        },
        {
            name: 'Samuel Mateo Yate Escobar',
            photo: 'fotos-grado-once/IMG-20260724-WA0139 - Copia.jpg',
            infografia: 'Gran amigo, comprensivo, le gusta compartir con sus amigos, extrovertido, fanático de la F1, futuro emprendedor',
            info: 'Curso: 11 · CD: 1023',
            profession: 'Futuro ingeniero de sistemas'
        }
    ];

    function renderGradoCard(student) {
        const name = escapeHtml(student.name || '');
        const foto = fotoUrl(student.photo, 'fotos-grado-once');
        const photo = foto
            ? `<img src="${escapeHtml(foto)}" alt="${name}" />`
            : `<div class="placeholder-photo">${escapeHtml((student.name || '').charAt(0))}</div>`;

        return `
            <div class="grado-card__inner">
                <div class="grado-card__photo">${photo}</div>
                <div class="grado-card__info">
                    <h3 class="grado-card__name">${name}</h3>
                    <p class="grado-card__text">${escapeHtml(student.infografia || '')}</p>
                    <p class="grado-card__text">${escapeHtml(student.info || '')}</p>
                    <p class="grado-card__text">${escapeHtml(student.profession || student.dedicatoria || 'Estudiante del grado once')}</p>
                </div>
            </div>
        `;
    }

    // los textos de los docentes vienen del panel, por eso se escapan antes de pintarlos
    function renderDocenteCard(docente) {
        const name = escapeHtml(docente.name || '');
        const foto = fotoUrl(docente.photo, 'fotos-docentes');
        const photo = foto
            ? `<img src="${escapeHtml(foto)}" alt="${name}" />`
            : `<div class="placeholder-photo">${escapeHtml((docente.name || '').charAt(0))}</div>`;

        return `
            <div class="docente-card__inner">
                <div class="docente-card__photo">${photo}</div>
                <div class="docente-card__info">
                    <h3 class="docente-card__name">${name}</h3>
                    <p class="docente-card__text">${escapeHtml(docente.infografia || '')}</p>
                    <p class="docente-card__text">${escapeHtml(docente.info || '')}</p>
                    <p class="docente-card__text">${escapeHtml(docente.profession || 'Docente institucional')}</p>
                </div>
            </div>
        `;
    }

    function renderGaleria() {
        const container = document.getElementById('galeria-container');
        if (!container || !contenidoCargado) return;

        const fotos = publicContent.galeria.filter((foto) => foto.url);
        if (fotos.length === 0) {
            container.innerHTML = '<p>No hay fotos disponibles en la galería.</p>';
            return;
        }

        container.innerHTML = fotos.map((foto) => `
            <div class="galeria-item">
                <img
                    src="${escapeHtml(fotoUrl(foto.url, 'fotos-galeria'))}"
                    alt="${escapeHtml(foto.descripcion || 'Foto del Instituto Santa Ana Luz del Carmen')}"
                    loading="lazy"
                >
            </div>
        `).join('');
    }

    function renderInstalaciones() {
        const container = document.getElementById('instalaciones-container');
        if (!container || !contenidoCargado) return;

        const instalaciones = publicContent.instalaciones;
        if (instalaciones.length === 0) {
            container.innerHTML = '<p>No hay instalaciones disponibles.</p>';
            return;
        }

        // imagen gris con el nombre, para cuando la instalación no tiene foto o la foto no carga
        const imagenVacia = (nombre) => 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%25%22 height=%22100%25%22%3E%3Crect fill=%22%23e6e6e6%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3E' + encodeURIComponent(nombre || '').replace(/'/g, '%27') + '%3C/text%3E%3C/svg%3E';

        container.innerHTML = instalaciones.map((inst) => {
            const vacia = escapeHtml(imagenVacia(inst.nombre));
            const foto = fotoUrl(inst.foto, 'fotos-instalaciones');
            return `
            <div class="instalacion-item">
                <div class="instalacion-imagen">
                    <img
                        src="${foto ? escapeHtml(foto) : vacia}"
                        alt="${escapeHtml(inst.nombre)}"
                        loading="lazy"
                        onerror="this.onerror=null; this.src='${vacia}'"
                    >
                </div>
                <div class="instalacion-info">
                    <h3>${escapeHtml(inst.nombre)}</h3>
                    <p>${escapeHtml(inst.descripcion)}</p>
                </div>
            </div>
        `;
        }).join('');
    }

    // ==========================
    // CARRUSELES (Docentes y Grado Once)
    // ==========================
    // Un solo atajo de teclado para el carrusel que esté en pantalla, así no se acumulan al cambiar de sección
    let carruselActivo = null;
    document.addEventListener('keydown', (e) => {
        if (!carruselActivo || !document.body.contains(carruselActivo.container)) return;
        if (e.key === 'ArrowLeft') carruselActivo.show(carruselActivo.current - 1);
        if (e.key === 'ArrowRight') carruselActivo.show(carruselActivo.current + 1);
    });

    function iniciarCarrusel(prefijo, items, renderCard) {
        const container = document.getElementById(`${prefijo}-card`);
        const prevBtn = document.getElementById(`${prefijo}-prev`);
        const nextBtn = document.getElementById(`${prefijo}-next`);
        const dotsContainer = document.getElementById(`${prefijo}-dots`);

        if (!container || !prevBtn || !nextBtn || !dotsContainer || !contenidoCargado) return;
        if (items.length === 0) {
            container.innerHTML = '<p>Aún no hay información para mostrar.</p>';
            return;
        }

        const carrusel = { container, current: 0 };
        carrusel.show = (index) => {
            carrusel.current = (index + items.length) % items.length;
            container.innerHTML = renderCard(items[carrusel.current]);

            dotsContainer.innerHTML = '';
            items.forEach((item, i) => {
                const dot = document.createElement('button');
                dot.className = `${prefijo}-dot` + (i === carrusel.current ? ' active' : '');
                dot.setAttribute('aria-label', `Ver ${item.name || i + 1}`);
                dot.addEventListener('click', () => carrusel.show(i));
                dotsContainer.appendChild(dot);
            });
        };

        prevBtn.addEventListener('click', () => carrusel.show(carrusel.current - 1));
        nextBtn.addEventListener('click', () => carrusel.show(carrusel.current + 1));
        carruselActivo = carrusel;
        carrusel.show(0);
    }

    function initGradoOnceCarousel() {
        iniciarCarrusel('grado', gradoOnceStudents, renderGradoCard);
    }

    function initDocentesCarousel() {
        iniciarCarrusel('docente', publicContent.docentes, renderDocenteCard);
    }

    function renderNoticias() {
        const container = document.getElementById('noticias-container');
        const prevBtn = document.getElementById('noticias-prev');
        const nextBtn = document.getElementById('noticias-next');
        const dotsContainer = document.getElementById('noticias-dots');
        const controls = document.querySelector('.noticias-controls');

        if (!container || !prevBtn || !nextBtn || !dotsContainer || !contenidoCargado) return;

        const noticias = publicContent.noticias.filter((noticia) => noticia.url);
        if (noticias.length === 0) {
            container.innerHTML = '<p class="noticias-message">Aún no hay noticias publicadas.</p>';
            if (controls) controls.hidden = true;
            return;
        }

        let current = 0;
        if (controls) controls.hidden = false;

        container.innerHTML = noticias.map((noticia, index) => `
            <div class="noticias-item${index === 0 ? ' active' : ''}" data-index="${index}">
                <img src="${escapeHtml(fotoUrl(noticia.url, 'fotos-noticias'))}" alt="${escapeHtml(noticia.titulo || `Noticia ${index + 1}`)}" loading="lazy">
            </div>
        `).join('');

        const items = [...container.querySelectorAll('.noticias-item')];
        dotsContainer.innerHTML = noticias.map((noticia, index) => `
            <button class="noticias-dot${index === 0 ? ' active' : ''}" data-index="${index}" aria-label="Ver noticia ${index + 1}"></button>
        `).join('');

        const dots = [...dotsContainer.querySelectorAll('.noticias-dot')];
        const show = (index) => {
            current = (index + items.length) % items.length;
            items.forEach((item, itemIndex) => item.classList.toggle('active', itemIndex === current));
            dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === current));
        };

        prevBtn.addEventListener('click', () => show(current - 1));
        nextBtn.addEventListener('click', () => show(current + 1));
        dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.index))));
    }

    function renderSection(sectionName) {
        if (!contentPanel) return;

        if (pageHeader) {
            pageHeader.style.display = sectionName === 'inicio' ? 'grid' : 'none';
        }

        const renderer = sections[sectionName] || sections.inicio;
        contentPanel.innerHTML = renderer();

        if (sectionName === 'grado-once') {
            setTimeout(initGradoOnceCarousel, 0);
        }

        if (sectionName === 'docentes') {
            setTimeout(initDocentesCarousel, 0);
        }

        if (sectionName === 'instalaciones') {
            setTimeout(renderInstalaciones, 0);
        }

        if (sectionName === 'galeria') {
            setTimeout(renderGaleria, 0);
        }

        if (sectionName === 'noticias') {
            setTimeout(renderNoticias, 0);
        }

        if (sectionName === 'Actividades') {
            setTimeout(initActividades, 0);
        }
    }

    // ==========================
    // TEXTOS LARGOS: se recortan con "..." y un botón "Ver más"
    // ==========================
    // Todos los textos editables desde admin.html. Las líneas visibles de cada uno están en styles.css (--lineas).
    const SELECTOR_RECORTE = [
        '.card p',
        '.notice p',
        '.section-card > p:not(.actividades-ayuda):not(.actividades-mensaje)',
        '.instalacion-info p',
        '.docente-card__text',
        '.grado-card__text'
    ].join(', ');

    // el botón solo aparece si el texto de verdad no cabe
    function revisarRecorte(texto) {
        texto.classList.add('recortable');
        const boton = texto.nextElementSibling?.classList.contains('ver-mas') ? texto.nextElementSibling : null;
        if (texto.classList.contains('expandido')) return;

        const sobra = texto.scrollHeight > texto.clientHeight + 1;
        if (sobra && !boton) {
            const nuevo = document.createElement('button');
            nuevo.type = 'button';
            nuevo.className = 'ver-mas';
            nuevo.textContent = 'Ver más';
            nuevo.setAttribute('aria-expanded', 'false');
            texto.after(nuevo);
        } else if (!sobra && boton) {
            boton.remove();
        }
    }

    let recortePendiente = false;
    function aplicarRecortes() {
        if (recortePendiente) return;
        recortePendiente = true;
        requestAnimationFrame(() => {
            recortePendiente = false;
            document.querySelectorAll(SELECTOR_RECORTE).forEach(revisarRecorte);
        });
    }

    document.addEventListener('click', (event) => {
        const boton = event.target.closest('.ver-mas');
        if (!boton) return;
        const texto = boton.previousElementSibling;
        const expandido = texto.classList.toggle('expandido');
        boton.textContent = expandido ? 'Ver menos' : 'Ver más';
        boton.setAttribute('aria-expanded', String(expandido));
    });

    // las secciones, los carruseles y los avisos se pintan después de cargar, así que se vigilan los cambios
    [contentPanel, document.querySelector('.right')].filter(Boolean).forEach((zona) => {
        new MutationObserver(aplicarRecortes).observe(zona, { childList: true, subtree: true, characterData: true });
    });
    window.addEventListener('resize', aplicarRecortes);
    window.addEventListener('load', aplicarRecortes);

    navLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const sectionName = this.getAttribute('data-section') || 'inicio';

            navLinks.forEach(function (item) {
                item.classList.remove('active');
            });

            this.classList.add('active');
            window.location.hash = sectionName;
            renderSection(sectionName);
        });
    });

    // enlaces legales del pie de página y de Actividades
    document.addEventListener('click', (event) => {
        const link = event.target.closest('.legal-link');
        if (!link) return;
        event.preventDefault();
        const sectionName = link.dataset.section;
        navLinks.forEach((item) => item.classList.remove('active'));
        window.location.hash = sectionName;
        renderSection(sectionName);
        window.scrollTo(0, 0);
    });

    const seccionActual = window.location.hash.substring(1) || 'inicio';

    navLinks.forEach(function (item) {
        item.classList.remove('active');

        if (item.getAttribute('data-section') === seccionActual) {
            item.classList.add('active');
        }
    });

    const scrollGuardado = sessionStorage.getItem('scrollposition');

    loadPublicContent();
    renderSection(seccionActual);

    if (scrollGuardado !== null) {
        setTimeout(function () {
            window.scrollTo(0, parseInt(scrollGuardado, 10));
        }, 100);
    }

    window.addEventListener('beforeunload', function () {
        sessionStorage.setItem('scrollposition', window.scrollY);
    });

});