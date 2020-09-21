import { NowRequest, NowResponse } from '@vercel/node';
import * as dbManager from '../../../lib/database';

export default async (request: NowRequest, response: NowResponse) => {
    const { query: { id } } = request;
    const database = dbManager.getDatabase();
    const existingSubscriptionRef = await database.ref(`email-notifications/subscriptions/${id}`).once('value');
    if (!existingSubscriptionRef.val()) {
        response.status(400).send({ message: 'Subscription not found' });
        return;
    }

    const updates: any = {};
    const email = existingSubscriptionRef.val() as string;
    const existingBlocklistEntryRef = await database
        .ref('email-notifications/blocklist')
        .orderByValue()
        .equalTo(email)
        .once('value');

    // Remove subscription
    updates[`email-notifications/subscriptions/${id}`] = null;
    // Add an entry to the blocklist if it's not already there for some reason
    if (!existingBlocklistEntryRef.val()) {
        const newBlocklistEntryKey = database.ref().child('email-notifications/blocklist').push().key;
        if (newBlocklistEntryKey === null) {
            response.status(500).json({ message: 'Error unsubscribing from email notifications' });
            return;
        }
        updates[`email-notifications/blocklist/${newBlocklistEntryKey}`] = email;
    }

    try {
        await database.ref().update(updates);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error unsubscribing from email notifications' });
        return;
    }

    response.status(200).send({});
};
