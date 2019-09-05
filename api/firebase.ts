import { NowRequest, NowResponse } from '@now/node';
import * as firebaseAdmin from 'firebase-admin';
import authenticator = require('../lib/authenticator');
import userinfo = require('../lib/userinfo');

export default async (request: NowRequest, response: NowResponse) => {

    let userInfo = {};

    try {
        const payload = await authenticator.handler(request.headers);
        console.log(`User ID: ${payload.sub}`);
        userInfo = await userinfo.retrieve(request.headers);
    } catch (error) {
        console.log(error);
        response.status(401).json({ error: error.message });
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

    response.status(200).send(userInfo);
};
