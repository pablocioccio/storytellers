import * as firebaseAdmin from 'firebase-admin';

export function getDatabase() {

    const params = {
        clientEmail: '***REMOVED***',
        // tslint:disable-next-line: max-line-length
        privateKey: '***REMOVED***',
        projectId: '***REMOVED***',
    };

    /* Lambdas do not always start with a fresh context, which means
     that the Firebase App could be already initialized from a previous call */
    if (firebaseAdmin.apps.length === 0) {
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(params),
            databaseURL: 'https://***REMOVED***.firebaseio.com/',
        });
    }

    return firebaseAdmin.database();
}
