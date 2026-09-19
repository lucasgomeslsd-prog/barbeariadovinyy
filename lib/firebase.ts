import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializa o Firebase Client SDK
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configurações do Firestore com experimentalForceLongPolling
// Essencial para evitar desconexões 'Could not reach Cloud Firestore backend'
// causadas pelo bloqueio de WebChannel/gRPC streaming dentro de iframes e proxies.
let firestoreInstance: Firestore;

try {
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
        },
        firebaseConfig.firestoreDatabaseId
      )
    : initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
} catch {
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const firestore = firestoreInstance;
export const auth: Auth = getAuth(app);

// Validação de conexão conforme especificação do Firebase Skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Verifique a configuração do Firebase ou conectividade de rede.');
    }
    return false;
  }
}

// Testa a conexão na inicialização
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {});
}

export default app;

