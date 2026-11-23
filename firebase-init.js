// ==========================
// CONEXIÓN CON FIREBASE
// ==========================
// Esta configuración no es secreta: Firebase la necesita en el navegador para saber a qué proyecto conectarse.
// Lo que protege los datos son las reglas de firestore.rules.
firebase.initializeApp({
    apiKey: 'AIzaSyAjNUQJacUKH7vRjneA8LJgHz4147n4hXk',
    authDomain: 'santa-ana-web-e9f0f.firebaseapp.com',
    projectId: 'santa-ana-web-e9f0f',
    storageBucket: 'santa-ana-web-e9f0f.firebasestorage.app',
    messagingSenderId: '882178360018',
    appId: '1:882178360018:web:ad3d95b02ddd3047ff230b'
});

const db = firebase.firestore();
db.settings({ ignoreUndefinedProperties: true });
const auth = firebase.auth();
auth.languageCode = 'es';

// todo lo que se edita en el panel (textos, avisos, docentes, fotos, datos legales...) vive en este documento
const contenidoDoc = db.collection('sitio').doc('contenido');

function entrarConGoogle() {
    const proveedor = new firebase.auth.GoogleAuthProvider();
    proveedor.setCustomParameters({ prompt: 'select_account' });
    return auth.signInWithPopup(proveedor);
}

// ==========================
// PLANTILLAS DEL CONTENIDO
// ==========================
// Lo que se ve mientras las directivas no hayan escrito nada en esa parte del panel.
// Las listas aparecen así en el panel, listas para llenar; todo se cambia desde admin.html.
const plantillas = {
    cifras: [
        { numero: '[00]', texto: 'Años de historia' },
        { numero: '[00]', texto: 'Estudiantes' },
        { numero: '[00]', texto: 'Docentes' },
        { numero: '[00]', texto: 'Promociones' }
    ],
    personal: [
        { id: 'persona-1', order: 1, name: '[Nombre completo]', cargo: 'Rector(a)', descripcion: '[Una frase sobre su labor o su formación]', photo: '' },
        { id: 'persona-2', order: 2, name: '[Nombre completo]', cargo: 'Coordinador(a) académico', descripcion: '[Una frase sobre su labor o su formación]', photo: '' },
        { id: 'persona-3', order: 3, name: '[Nombre completo]', cargo: 'Coordinador(a) de convivencia', descripcion: '[Una frase sobre su labor o su formación]', photo: '' },
        { id: 'persona-4', order: 4, name: '[Nombre completo]', cargo: 'Orientador(a) escolar', descripcion: '[Una frase sobre su labor o su formación]', photo: '' },
        { id: 'persona-5', order: 5, name: '[Nombre completo]', cargo: 'Secretaría académica', descripcion: '[Una frase sobre su labor o su formación]', photo: '' },
        { id: 'persona-6', order: 6, name: '[Nombre completo]', cargo: 'Tesorería', descripcion: '[Una frase sobre su labor o su formación]', photo: '' }
    ],
    infoColegio: [
        { id: 'info-1', icono: 'bi-hourglass-split', titulo: 'Nuestra historia', texto: '[Cuándo y cómo se fundó el colegio, y quién lo fundó.]' },
        { id: 'info-2', icono: 'bi-clock', titulo: 'Jornada y horarios', texto: '[Jornada (mañana, tarde, única) y horario de entrada y salida.]' },
        { id: 'info-3', icono: 'bi-mortarboard', titulo: 'Niveles que ofrecemos', texto: '[Por ejemplo: preescolar, básica primaria, básica secundaria y media.]' },
        { id: 'info-4', icono: 'bi-clipboard-check', titulo: 'Admisiones', texto: '[Pasos y documentos para matricular a un estudiante, y fechas de inscripción.]' },
        { id: 'info-5', icono: 'bi-person-badge', titulo: 'Uniformes', texto: '[Cómo es el uniforme de diario y el de educación física, y dónde se consigue.]' },
        { id: 'info-6', icono: 'bi-award', titulo: 'Reconocimientos', texto: '[Premios, resultados en las pruebas Saber u otros logros del colegio.]' }
    ]
};

// Íconos que se pueden elegir en el panel para las tarjetas de "Sobre el colegio"
const iconosInfo = {
    'bi-hourglass-split': 'Reloj de arena (historia)',
    'bi-clock': 'Reloj (horarios)',
    'bi-mortarboard': 'Birrete (niveles)',
    'bi-clipboard-check': 'Lista (admisiones)',
    'bi-person-badge': 'Carné (uniformes)',
    'bi-award': 'Medalla (reconocimientos)',
    'bi-book': 'Libro',
    'bi-calendar-event': 'Calendario',
    'bi-people': 'Personas',
    'bi-heart': 'Corazón',
    'bi-trophy': 'Trofeo',
    'bi-geo-alt': 'Ubicación',
    'bi-telephone': 'Teléfono',
    'bi-bus-front': 'Transporte',
    'bi-cup-hot': 'Restaurante escolar',
    'bi-info-circle': 'Información'
};

// Solo deja pasar enlaces web (https://...). Para WhatsApp también acepta un número de celular.
function enlaceSeguro(valor, esWhatsapp = false) {
    const texto = String(valor || '').trim();
    if (/^https?:\/\//i.test(texto)) return texto;
    if (esWhatsapp) {
        const digitos = texto.replace(/\D/g, '');
        if (digitos.length >= 10) return `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}`;
    }
    return '';
}

// Las fotos pueden ser una dirección completa (Cloudinary) o el nombre de un archivo viejo dentro de su carpeta
function fotoUrl(valor, carpeta) {
    const foto = String(valor || '').trim();
    if (!foto) return '';
    if (/^https:\/\//i.test(foto) || foto.includes('/')) return foto;
    return `${carpeta}/${encodeURIComponent(foto)}`;
}
