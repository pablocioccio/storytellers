import { database } from 'firebase-admin';
import * as webpush from 'web-push';
import { PushSubscription, SendResult, WebPushError } from 'web-push';
import { IGame } from '../model/game';
import { IPlayer } from '../model/player';
import * as dbManager from './database';

const vapidKeys = {
    privateKey: `${process.env.user_notifications_vapid_private_key}`,
    publicKey: `${process.env.user_notifications_vapid_public_key}`,
};

webpush.setVapidDetails(
    `mailto:${process.env.email_account}`,
    vapidKeys.publicKey,
    vapidKeys.privateKey,
);

export async function sendNextTurnNotifications(player: IPlayer, game: IGame) {
    const db = dbManager.getDatabase();
    const subscriptionsSnapshot = await db.ref(`/user-notifications/${player.user_id}`).once('value');
    const subscriptions: { [key: string]: PushSubscription } = subscriptionsSnapshot.val();
    if (!subscriptions) { return; }

    /* https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification */
    const notificationPayload = {
        notification: {
            badge: 'assets/icons/icon-72x72.png',
            body: `${player.name}, you are up next in ${game.title}`,
            data: {
                url: `/games/play/${game.id}`,
            },
            icon: 'assets/icons/icon-152x152.png',
            renotify: true,
            requireInteraction: true,
            tag: game.id,
            title: 'It\'s time to play!',
            vibrate: [75, 75, 75, 75, 75, 75, 75, 75, 150, 150, 150, 450, 75, 75, 75, 75, 75, 525],
        },
    };

    const promises: Array<Promise<SendResult>> = [];
    Object.values(subscriptions).forEach((subscription: PushSubscription) => {
        promises.push(
            webpush.sendNotification(
                subscription,
                JSON.stringify(notificationPayload),
            ),
        );
    });

    const results = await Promise.all(promises.map((p: Promise<SendResult>) => p.catch((e: any) => e)));
    for (const result of results) {
        if (result instanceof WebPushError) {
            // Delete missing or unauthorized subscriptions
            if (result.statusCode === 410 || result.statusCode === 404) {
                for (const [key, subscription] of Object.entries(subscriptions)) {
                    if (result.endpoint && subscription.endpoint && result.endpoint === subscription.endpoint) {
                        const dbSubscriptionRef = db.ref(`/user-notifications/${player.user_id}/${key}`);
                        if (dbSubscriptionRef) { await dbSubscriptionRef.remove(); }
                    }
                }
            }
        }
    }
}

export async function sendGameEndNotifications(game: IGame) {
    const db = dbManager.getDatabase();
    const subscriptionsSnapshotsPromises: Array<Promise<database.DataSnapshot>> = game.players.map(
        (player: IPlayer) => db.ref(`/user-notifications/${player.user_id}`).once('value'),
    );

    // Retrieve all references to the database in parallel
    const subscriptionsSnapshots = await Promise.all(subscriptionsSnapshotsPromises);

    // Store notifications promises and later wait for all of them to finish
    const notificationsPromises: Array<Promise<SendResult>> = [];

    for (let i = 0; i < game.players.length; i++) {
        const player = game.players[i];
        const subscriptions: { [key: string]: PushSubscription } = subscriptionsSnapshots[i].val();
        if (!subscriptions) { continue; }

        /* https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification */
        const notificationPayload = {
            notification: {
                badge: 'assets/icons/icon-72x72.png',
                body: `${player.name}, see how you and your friends fared.`,
                data: {
                    url: `/games/${game.id}`,
                },
                icon: 'assets/icons/icon-152x152.png',
                renotify: true,
                requireInteraction: true,
                tag: game.id,
                title: `${game.title} is finished!`,
                vibrate: [75, 75, 75, 75, 75, 75, 75, 75, 150, 150, 150, 450, 75, 75, 75, 75, 75, 525],
            },
        };

        Object.values(subscriptions).forEach((subscription: PushSubscription) => {
            notificationsPromises.push(
                webpush.sendNotification(
                    subscription,
                    JSON.stringify(notificationPayload),
                ),
            );
        });

        // Wait for all promises to resolve
        await Promise.all(notificationsPromises.map((p: Promise<SendResult>) => p.catch((e: any) => e)));

    }

}
