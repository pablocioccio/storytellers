import { NowRequest, NowResponse } from '@vercel/node';
import authenticator = require('../../../lib/authenticator');
import * as dbManager from '../../../lib/database';

export default async (request: NowRequest, response: NowResponse) => {
    // Validate JWT and get the user id
    let userId: string;
    try {
        const payload = await authenticator.handler(request.headers);
        userId = payload.sub;
    } catch (error) {
        console.log(error);
        response.status(401).json({ error: error.message });
        return;
    }

    const database = dbManager.getDatabase();
    const userNotificationsListRef = database.ref(`/user-notifications/${userId}`);
    const newNotificationRef = userNotificationsListRef.push();
    const res = await newNotificationRef.set(request.body);
    response.status(200).send(res);
};
