const webpush = require('web-push');

const vapidKeys = {
    "publicKey": `${process.env.user_notifications_vapid_public_key}`,
    "privateKey": `${process.env.user_notifications_vapid_private_key}`
};

webpush.setVapidDetails(
    'mailto:pncioccio@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

exports.sendNotifications = async (player, game, allSubscriptions) => {
    /* https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification */
    const notificationPayload = {
        notification: {
            tag: game.id,
            title: 'It\'s time to play!',
            body: `${player.name}, you are up next in ${game.title}`,
            badge: "assets/icons/icon-72x72.png",
            icon: "assets/icons/icon-152x152.png",
            vibrate: [75, 75, 75, 75, 75, 75, 75, 75, 150, 150, 150, 450, 75, 75, 75, 75, 75, 525],
            requireInteraction: true,
            renotify: true,
            data: {
                url: `/games/play/${game.id}`,
            }
        }
    };

    const promises = []
    allSubscriptions.forEach(subscription => {
        promises.push(
            webpush.sendNotification(
                subscription,
                JSON.stringify(notificationPayload)
            )
        )
    });

    try {
        await Promise.all(promises);
    } catch (error) {
        // TODO delete subscriptions of failed notifications
        console.log(error);
    }
}