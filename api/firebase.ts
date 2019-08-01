import { NowRequest, NowResponse } from '@now/node';
import * as firebaseAdmin from 'firebase-admin';

export default async (request: NowRequest, response: NowResponse) => {

    const params = {
        clientEmail: '***REMOVED***',
        // tslint:disable-next-line: max-line-length
        privateKey: '***REMOVED***',
        projectId: '***REMOVED***',
    };

    /* Apparently lambdas do not always start with a fresh context, which means
     that the Firebase App could be already initialized from a previous call */
    if (firebaseAdmin.apps.length === 0) {
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(params),
            databaseURL: 'https://***REMOVED***.firebaseio.com/',
        });
    }

    const database = firebaseAdmin.database();

    const res = await database.ref('users/12345').set({
        email: 'test@test.com',
        username: 'Test',
    });

    response.status(200).send('Congrats!');
};
