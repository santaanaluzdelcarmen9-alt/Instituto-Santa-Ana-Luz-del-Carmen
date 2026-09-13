document.addEventListener('DOMContentLoaded', function () {
    const contentPanel = document.getElementById('content-panel');
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const pageHeader = document.querySelector('.page-header');
    let publicContent = {
        institution: {},
        notices: [],
        docentes: [],
        sections: {
            inicio: { mission: 'informacion', vision: 'informacion', values: 'informacion', manual: 'informacion' },
            conocenos: 'informacion',
            academico: 'informacion',
            instalaciones: 'informacion',
            noticias: 'informacion',
            contacto: 'informacion'
        }
    };

    const escapeHtml = (value = '') => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    async function loadPublicContent() {
        try {
            const response = await fetch('/api/public-content');
            if (!response.ok) throw new Error('No se pudo cargar el contenido público');

            publicContent = await response.json();
            const institution = publicContent.institution || {};
            const title = document.querySelector('.page-header__title');
            const badge = document.querySelector('.page-header__badge');
            const description = document.querySelector('.page-header__text');

            if (title) title.textContent = institution.name || title.textContent;
            if (badge) badge.textContent = institution.badge || badge.textContent;
            if (description) description.textContent = institution.description || description.textContent;

            document.querySelectorAll('.right .notice').forEach((notice, index) => {
                const data = publicContent.notices?.[index];
                if (!data) return;
                notice.querySelector('h4').textContent = data.title || '';
                notice.querySelector('p').textContent = data.text || '';
            });

            const sectionName = window.location.hash.substring(1) || 'inicio';
            renderSection(sectionName);
        } catch (error) {
            console.error('Error al cargar el contenido público:', error);
        }
    }

    const sections = {
        inicio: () => {
            const inicio = publicContent.sections?.inicio || {};
            return `
            <section class="cards">
                <div class="card">
                    <h3>Misión</h3>
                    <p>${escapeHtml(inicio.mission || 'informacion')}</p>
                </div>
                <div class="card">
                    <h3>Visión</h3>
                    <p>${escapeHtml(inicio.vision || 'informacion')}</p>
                </div>
                <div class="card">
                    <h3>Valores</h3>
                    <p>${escapeHtml(inicio.values || 'informacion')}</p>
                </div>
                <div class="card">
                    <h3>Manual</h3>
                    <p>${escapeHtml(inicio.manual || 'informacion')}</p>
                </div>
            </section>
        `;
        },
        conocenos: () => `
            <section class="section-card">
                <h2>Conócenos</h2>
                <p>${escapeHtml(publicContent.sections?.conocenos || 'informacion')}</p>
            </section>
        `,
        academico: () => `
            <section class="section-card">
                <h2>Académico</h2>
                <p>${escapeHtml(publicContent.sections?.academico || 'informacion')}</p>
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
                <p>${escapeHtml(publicContent.sections?.contacto || 'informacion')}</p>
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

    let docentes = [
        {
            name: 'Sebastián',
            photo: '',
            infografia: 'Docente de biología',
            info: 'Asignatura: Biología',
            profession: 'Acompañamiento y formación integral'
        },
        {
            name: 'Dagoberto',
            photo: '',
            infografia: 'Docente de matemáticas',
            info: 'Asignatura: Matemáticas',
            profession: 'Enseñanza aplicada y apoyo académico'
        }
    ];

    let noticias = [
        {
            name: "noticias" ,
            photo:'',
            infografia: 'noticias',
            info: 'noticias',
            informacion:'',

        }


    ];

    function renderGradoCard(student) {
        const photo = student.photo
            ? `<img src="${student.photo}" alt="${student.name}" />`
            : `<div class="placeholder-photo">${student.name.charAt(0)}</div>`;

        return `
            <div class="grado-card__inner">
                <div class="grado-card__photo">${photo}</div>
                <div class="grado-card__info">
                    <h3 class="grado-card__name">${student.name}</h3>
                    <p class="grado-card__text">${student.infografia}</p>
                    <p class="grado-card__text">${student.info}</p>
                    <p class="grado-card__text">${student.profession || student.dedicatoria || 'Estudiante del grado once'}</p>
                </div>
            </div>
        `;
    }

    function renderDocenteCard(docente) {
        const photo = docente.photo
            ? `<img src="fotos-docentes/${encodeURIComponent(docente.photo)}" alt="${docente.name}" />`
            : `<div class="placeholder-photo">${docente.name.charAt(0)}</div>`;

        return `
            <div class="docente-card__inner">
                <div class="docente-card__photo">${photo}</div>
                <div class="docente-card__info">
                    <h3 class="docente-card__name">${docente.name}</h3>
                    <p class="docente-card__text">${docente.infografia}</p>
                    <p class="docente-card__text">${docente.info}</p>
                    <p class="docente-card__text">${docente.profession || 'Docente institucional'}</p>
                </div>
            </div>
        `;
    }

    async function renderGaleria() {
        const container = document.getElementById('galeria-container');

        if (!container) return;

        try {
            const respuesta = await fetch('/api/galeria');

            if (!respuesta.ok) {
                throw new Error('Error al obtener las fotos de la galería');
            }

            const fotos = await respuesta.json();

            if (fotos.length === 0) {
                container.innerHTML = '<p>No hay fotos disponibles en la galería.</p>';
                return;
            }

            container.innerHTML = fotos.map((foto) => `
                <div class="galeria-item">
                    <img
                        src="fotos-galeria/${encodeURIComponent(foto)}"
                        alt="Foto del Instituto Santa Ana Luz Del Carmen"
                        loading="lazy"
                    >
                </div>
            `).join('');
        } catch (error) {
            console.error('Error al cargar la galería:', error);
            container.innerHTML = '<p>No se pudieron cargar las fotos de la galería.</p>';
        }
    }

    async function renderInstalaciones() {
        const container = document.getElementById('instalaciones-container');

        if (!container) return;

        try {
            const respuesta = await fetch('/api/instalaciones');

            if (!respuesta.ok) {
                throw new Error('Error al obtener las instalaciones');
            }

            const instalaciones = await respuesta.json();

            if (instalaciones.length === 0) {
                container.innerHTML = '<p>No hay instalaciones disponibles.</p>';
                return;
            }

            container.innerHTML = instalaciones.map((inst) => `
                <div class="instalacion-item">
                    <div class="instalacion-imagen">
                        <img
                            src="${inst.foto ? 'fotos-instalaciones/' + encodeURIComponent(inst.foto) : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%25%22 height=%22100%25%22%3E%3Crect fill=%22%23e6e6e6%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${escapeHtml(inst.nombre)}%3C/text%3E%3C/svg%3E'}"
                            alt="${escapeHtml(inst.nombre)}"
                            loading="lazy"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%25%22 height=%22100%25%22%3E%3Crect fill=%22%23e6e6e6%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${escapeHtml(inst.nombre)}%3C/text%3E%3C/svg%3E'"
                        >
                    </div>
                    <div class="instalacion-info">
                        <h3>${escapeHtml(inst.nombre)}</h3>
                        <p>${escapeHtml(inst.descripcion)}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error al cargar las instalaciones:', error);
            container.innerHTML = '<p>No se pudieron cargar las instalaciones.</p>';
        }
    }

    function initGradoOnceCarousel() {
        const container = document.getElementById('grado-card');
        const prevBtn = document.getElementById('grado-prev');
        const nextBtn = document.getElementById('grado-next');
        const dotsContainer = document.getElementById('grado-dots');

        if (!container || !prevBtn || !nextBtn || !dotsContainer || gradoOnceStudents.length === 0) return;

        let current = 0;

        function show(index) {
            current = (index + gradoOnceStudents.length) % gradoOnceStudents.length;
            container.innerHTML = renderGradoCard(gradoOnceStudents[current]);

            dotsContainer.innerHTML = '';

            gradoOnceStudents.forEach((student, i) => {
                const dot = document.createElement('button');
                dot.className = 'grado-dot' + (i === current ? ' active' : '');
                dot.setAttribute('aria-label', `Ver ${student.name}`);
                dot.addEventListener('click', () => show(i));
                dotsContainer.appendChild(dot);
            });
        }

        prevBtn.addEventListener('click', () => show(current - 1));
        nextBtn.addEventListener('click', () => show(current + 1));

        document.addEventListener('keydown', (e) => {
            if (!document.querySelector('.grado-once-section')) return;
            if (e.key === 'ArrowLeft') show(current - 1);
            if (e.key === 'ArrowRight') show(current + 1);
        });

        show(0);
    }

    async function initDocentesCarousel() {
        const container = document.getElementById('docente-card');
        const prevBtn = document.getElementById('docente-prev');
        const nextBtn = document.getElementById('docente-next');
        const dotsContainer = document.getElementById('docente-dots');

        try {
            const respuesta = await fetch('/api/public-content');

            if (!respuesta.ok) {
                throw new Error('Error al obtener el contenido público');
            }

            const contenido = await respuesta.json();
            if (Array.isArray(contenido.docentes)) docentes = contenido.docentes;
        } catch (error) {
            console.error('Error al cargar los docentes:', error);
        }

        if (!container || !prevBtn || !nextBtn || !dotsContainer || docentes.length === 0) return;

        let current = 0;

        function show(index) {
            current = (index + docentes.length) % docentes.length;
            container.innerHTML = renderDocenteCard(docentes[current]);

            dotsContainer.innerHTML = '';

            docentes.forEach((docente, i) => {
                const dot = document.createElement('button');
                dot.className = 'docente-dot' + (i === current ? ' active' : '');
                dot.setAttribute('aria-label', `Ver ${docente.name}`);
                dot.addEventListener('click', () => show(i));
                dotsContainer.appendChild(dot);
            });
        }

        prevBtn.addEventListener('click', () => show(current - 1));
        nextBtn.addEventListener('click', () => show(current + 1));

        document.addEventListener('keydown', (e) => {
            if (!document.querySelector('.docentes-section')) return;
            if (e.key === 'ArrowLeft') show(current - 1);
            if (e.key === 'ArrowRight') show(current + 1);
        });

        show(0);
    }

    async function renderNoticias() {
        const container = document.getElementById('noticias-container');
        const prevBtn = document.getElementById('noticias-prev');
        const nextBtn = document.getElementById('noticias-next');
        const dotsContainer = document.getElementById('noticias-dots');
        const controls = document.querySelector('.noticias-controls');

        if (!container || !prevBtn || !nextBtn || !dotsContainer) return;

        const showMessage = (message) => {
            container.innerHTML = `<p class="noticias-message">${message}</p>`;
            if (controls) controls.hidden = true;
        };

        try {
            const respuesta = await fetch('/api/noticias');

            if (!respuesta.ok) {
                throw new Error('Error al obtener las fotos de noticias');
            }

            const fotos = await respuesta.json();
            if (!Array.isArray(fotos)) {
                throw new Error('Formato de respuesta inválido');
            }

            if (fotos.length === 0) {
                showMessage('Aún no hay imágenes en Noticias. Agrega fotos en la carpeta fotos-noticias.');
                return;
            }

            let current = 0;
            if (controls) controls.hidden = false;

            container.innerHTML = fotos.map((foto, index) => `
                <div class="noticias-item${index === 0 ? ' active' : ''}" data-index="${index}">
                    <img src="fotos-noticias/${encodeURIComponent(foto)}" alt="Noticia ${index + 1}" loading="lazy">
                </div>
            `).join('');

            const items = [...container.querySelectorAll('.noticias-item')];
            dotsContainer.innerHTML = fotos.map((foto, index) => `
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
        } catch (error) {
            console.error('Error al cargar Noticias:', error);
            showMessage('No se pudieron cargar las imágenes de Noticias.');
        }
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
    }

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