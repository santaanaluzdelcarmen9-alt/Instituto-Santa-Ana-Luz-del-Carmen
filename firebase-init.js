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

// Las fotos pueden ser una dirección completa (Cloudinary) o el nombre de un archivo viejo dentro de su carpeta
function fotoUrl(valor, carpeta) {
    const foto = String(valor || '').trim();
    if (!foto) return '';
    if (/^https:\/\//i.test(foto) || foto.includes('/')) return foto;
    return `${carpeta}/${encodeURIComponent(foto)}`;
}
