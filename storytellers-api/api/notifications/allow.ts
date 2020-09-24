import { NowRequest, NowResponse } from '@vercel/node';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import * as emailManager from '../../lib/email';
import { IPlayer } from '../../model/player';

export default async (request: NowRequest, response: NowResponse) => {
    // Validate JWT and get current user info
    let user: IPlayer;
    try {
        const payload = await authenticator.handler(request.headers);
        // Email, name and picture are custom claims that are obtained through Auth0 rules
        user = {
            email: payload['https://storytellers-api.vercel.app/email'],
            name: payload['https://storytellers-api.vercel.app/name'],
            picture: payload['https://storytellers-api.vercel.app/picture'],
            user_id: payload.sub,
        };
    } catch (error) {
        console.error(error);
        response.status(401).json({ message: error.message });
        return;
    }

    const database = dbManager.getDatabase();
    const results = await database.ref('email-notifications/blocklist')
        .orderByValue()
        .equalTo(emailManager.normalizeAddress(user.email))
        .once('value');

    if (results.val()) {
        const updates: any = {};
        Object.keys(results.val()).forEach((key: string) => {
            updates[`email-notifications/blocklist/${key}`] = null;
        });
        try {
            await database.ref().update(updates);
        } catch (error) {
            console.error(error);
            response.status(500).json({ error });
            return;
        }
    }

    response.status(200).send({});
};
