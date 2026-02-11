import admin from 'firebase-admin';

let app: admin.app.App | undefined;

const initializeFirebaseAdmin = () => {
    if (!admin.apps || admin.apps.length === 0) {
        try {
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;

            if (!projectId || !clientEmail || !privateKey) {
                console.error('Missing Firebase Admin credentials:', {
                    hasProjectId: !!projectId,
                    hasClientEmail: !!clientEmail,
                    hasPrivateKey: !!privateKey
                });
                throw new Error('Missing Firebase Admin credentials in environment variables');
            }

            // Handle newline characters in private key
            if (privateKey.includes('\\n')) {
                privateKey = privateKey.replace(/\\n/g, '\n');
            }

            app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            
            console.log('Firebase Admin initialized successfully');
        } catch (error) {
            console.error('Firebase Admin initialization error:', error);
            throw error;
        }
    } else {
        app = admin.apps[0] as admin.app.App;
    }
    return app;
};

export const getAdminAuth = () => {
    const firebaseApp = initializeFirebaseAdmin();
    return firebaseApp.auth();
};

export const getAdminDb = () => {
    const firebaseApp = initializeFirebaseAdmin();
    return firebaseApp.firestore();
};

// Backward compatibility
export const adminAuth = getAdminAuth();
export const adminDb = getAdminDb();
