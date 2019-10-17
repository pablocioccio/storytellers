import { NowRequest, NowResponse } from '@now/node';
import authenticator = require('../../../lib/authenticator');
import * as dbManager from '../../../lib/database';

export default async (request: NowRequest, response: NowResponse) => {
    // Validate JWT and get current user id
    let userId: string;
    try {
        const payload = await authenticator.handler(request.headers);
        userId = payload.sub;
    } catch (error) {
        console.log(error);
        response.status(401).json({ error: error.message });
        return;
    }

    let notifications: any[] = [];

    const database = dbManager.getDatabase();
    const userNotificationsSnapshot = await database.ref(`/user-notifications/${userId}`).once('value');
    const userNotifications = userNotificationsSnapshot.val();
    if (userNotifications) { notifications = Object.values(userNotifications); }

    response.status(200).send(notifications);
};
