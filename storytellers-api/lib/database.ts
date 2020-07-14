import * as firebaseAdmin from 'firebase-admin';

export function getDatabase() {

    const params = {
        clientEmail: process.env.firebase_client_email,
        privateKey: (process.env.firebase_private_key || '').replace(/\\n/g, '\n'),
        projectId: process.env.firebase_project_id,
    };

    /* Lambdas do not always start with a fresh context, which means
     that the Firebase App could be already initialized from a previous call */
    if (firebaseAdmin.apps.length === 0) {
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(params),
            databaseURL: process.env.firebase_database_url,
        });
    }

    return firebaseAdmin.database();
}
