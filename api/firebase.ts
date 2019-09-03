import { NowRequest, NowResponse } from '@now/node';
import * as firebaseAdmin from 'firebase-admin';
import authenticator = require('../lib/authenticator');

export default async (request: NowRequest, response: NowResponse) => {

    console.log(request.headers);

    try {
        const payload = await authenticator.handler(request.headers);
    } catch (error) {
        response.status(401).json({error: error.message});
        return;
    }

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

    response.status(200).send({ Authorized: true });
};
