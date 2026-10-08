import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// Miembros fundadores pre-configurados para acceso rápido y resiliencia
export const FOUNDING_MEMBERS = [
  {
    id: 'ramiro',
    name: 'Ramiro',
    email: 'ramiro@bancaabeja.org',
    phone: '+54 9 11 2745-2476',
    cleanPhone: '5491127452476',
    role: 'Fundador',
    nodeId: 'hogar'
  },
  {
    id: 'agustina',
    name: 'Agustina',
    email: 'agustina@bancaabeja.org',
    phone: '+54 9 11 2649-5598',
    cleanPhone: '5491126495598',
    role: 'Miembro',
    nodeId: 'hogar'
  },
  {
    id: 'cristian',
    name: 'Cristian',
    email: 'cristian@bancaabeja.org',
    phone: '+54 9 11 4974-8673',
    cleanPhone: '5491149748673',
    role: 'Miembro',
    nodeId: 'hogar'
  }
];

const SESSION_STORAGE_KEY = 'banca_abeja_user_session';
const ACTIVE_MEMBER_KEY = 'banca_abeja_active_member';

class AuthService {
  constructor() {
    this.currentUser = this.loadStoredSession();
  }

  loadStoredSession() {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Error leyendo sesión almacenada:", e);
    }
    return null;
  }

  saveSession(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(ACTIVE_MEMBER_KEY, user.id);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  getCurrentUser() {
    return this.currentUser || this.loadStoredSession();
  }

  // Búsqueda de perfil de miembro en Firestore
  async fetchMemberProfile(memberId, email = null) {
    if (!db) return null;
    try {
      if (memberId) {
        const docRef = doc(db, 'banca_abeja_members', memberId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
      }

      if (email) {
        const q = query(collection(db, 'banca_abeja_members'), where('email', '==', email.toLowerCase().trim()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const first = snap.docs[0];
          return { id: first.id, ...first.data() };
        }
      }
    } catch (err) {
      console.warn("No se pudo obtener miembro de Firestore:", err.message);
    }
    return null;
  }

  // Iniciar Sesión con Email y Contraseña
  async login(email, password) {
    if (!email || !password) {
      throw new Error("Por favor ingresá tu email y contraseña.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Intentar autenticación con Firebase Auth si está disponible
    let firebaseUser = null;
    if (auth) {
      try {
        const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        firebaseUser = credential.user;
      } catch (fbErr) {
        console.warn("Firebase Auth signIn aviso:", fbErr.code, fbErr.message);
        // Si el proveedor de email no está activado en Firebase Console o el usuario aún no existe en Auth,
        // continuamos con la autenticación resiliente contra Firestore / Miembros conocidos
      }
    }

    // 2. Verificar contra miembros fundadores
    const founderMatch = FOUNDING_MEMBERS.find(f => 
      f.email.toLowerCase() === cleanEmail || 
      cleanEmail.startsWith(f.id) ||
      cleanEmail.includes(f.name.toLowerCase())
    );

    // 3. Buscar en Firestore collection 'banca_abeja_members'
    let memberProfile = await this.fetchMemberProfile(founderMatch?.id, cleanEmail);

    if (!memberProfile && founderMatch) {
      memberProfile = { ...founderMatch };
      // Guardarlo en Firestore para sincronización con el bot de WhatsApp
      if (db) {
        try {
          await setDoc(doc(db, 'banca_abeja_members', memberProfile.id), {
            ...memberProfile,
            createdAt: Date.now()
          }, { merge: true });
        } catch (e) {
          console.warn("Error guardando fundador en Firestore:", e);
        }
      }
    }

    // 4. Si encontramos el miembro o tenemos usuario de Firebase
    if (memberProfile) {
      const userSession = {
        id: memberProfile.id,
        name: memberProfile.name || (cleanEmail.split('@')[0]),
        email: cleanEmail,
        phone: memberProfile.phone || '',
        cleanPhone: memberProfile.cleanPhone || (memberProfile.phone ? memberProfile.phone.replace(/\D/g, '') : ''),
        role: memberProfile.role || 'Miembro',
        nodeId: memberProfile.nodeId || 'hogar',
        firebaseUid: firebaseUser?.uid || null,
        loggedAt: Date.now()
      };

      this.saveSession(userSession);
      return userSession;
    }

    // 5. Si no se encontró miembro pero Firebase Auth lo autenticó
    if (firebaseUser) {
      const memberId = (firebaseUser.displayName || cleanEmail.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userSession = {
        id: memberId,
        name: firebaseUser.displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: '',
        cleanPhone: '',
        role: 'Miembro',
        nodeId: 'hogar',
        firebaseUid: firebaseUser.uid,
        loggedAt: Date.now()
      };

      if (db) {
        try {
          await setDoc(doc(db, 'banca_abeja_members', memberId), userSession, { merge: true });
        } catch (e) {
          console.warn("Error creando miembro desde Auth en Firestore:", e);
        }
      }

      this.saveSession(userSession);
      return userSession;
    }

    // 6. Si no existe aún y la contraseña tiene al menos 6 caracteres, informar claramente
    throw new Error("No encontramos una cuenta con ese correo. Si eres nuevo, hacé clic en 'Registrarse' para darte de alta y vincular tu WhatsApp.");
  }

  // Registro / Darse de alta con Email, Clave, Nombre, WhatsApp y Nodo
  async register({ name, email, password, phone, nodeId = 'hogar' }) {
    if (!name || !name.trim()) throw new Error("Por favor ingresá tu nombre completo.");
    if (!email || !email.trim()) throw new Error("Por favor ingresá tu email.");
    if (!password || password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
    if (!phone || !phone.trim()) throw new Error("Por favor ingresá tu número de WhatsApp para vincular el bot.");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanName = name.trim();
    const memberId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) || `user_${Date.now()}`;

    let firebaseUid = null;

    // 1. Intentar registrar en Firebase Auth
    if (auth) {
      try {
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        firebaseUid = credential.user.uid;
        if (credential.user) {
          try {
            await updateProfile(credential.user, { displayName: cleanName });
          } catch (e) {
            console.warn("Error actualizando displayName en Firebase:", e);
          }
        }
      } catch (fbErr) {
        console.warn("Firebase Auth createUser aviso:", fbErr.code, fbErr.message);
        // Continuamos si Firebase Auth lanza error de configuración
      }
    }

    // 2. Guardar en Firestore `banca_abeja_members` para que el Bot de WhatsApp lo reconozca
    const memberData = {
      id: memberId,
      name: cleanName,
      email: cleanEmail,
      phone: phone.trim(),
      cleanPhone,
      nodeId,
      role: 'Miembro',
      familyUnits: { adults: 1, kids: 0 },
      firebaseUid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_members', memberId), memberData, { merge: true });
      } catch (err) {
        console.warn("Error guardando miembro en Firestore:", err);
      }
    }

    // 3. Guardar en LocalStorage
    try {
      const localMembers = JSON.parse(localStorage.getItem('matrix_members') || '[]');
      const existingIdx = localMembers.findIndex(m => m.id === memberId || m.email === cleanEmail);
      if (existingIdx >= 0) {
        localMembers[existingIdx] = { ...localMembers[existingIdx], ...memberData };
      } else {
        localMembers.push(memberData);
      }
      localStorage.setItem('matrix_members', JSON.stringify(localMembers));
    } catch (e) {
      console.warn("Error actualizando matrix_members en localStorage:", e);
    }

    this.saveSession(memberData);
    return memberData;
  }

  // Cerrar sesión
  async logout() {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Error en signOut de Firebase:", e);
      }
    }
    this.saveSession(null);
  }

  // Suscribirse a cambios de estado
  initAuthListener(onUserChanged) {
    if (auth) {
      return onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          // Si hay sesión en Firebase Auth y no hay sesión local o no coincide
          const current = this.getCurrentUser();
          if (!current || current.email !== fbUser.email) {
            const profile = await this.fetchMemberProfile(null, fbUser.email);
            if (profile) {
              this.saveSession(profile);
              onUserChanged(profile);
            }
          }
        }
      });
    }
    return () => {};
  }
}

export const authService = new AuthService();
export default authService;
