export function sendMessage(playerId: string, gameId: string, message: Event): Promise<void> {
    const Pusher = require('pusher');
    /* Modify prototype to add support for async trigger */
    Pusher.prototype.triggerAsync = async function(
        channel: string | string[], event: string, data: any, socketId?: string) {
        return new Promise((resolve, reject) => {
            this.trigger(channel, event, data, socketId, (error: any, req: any, res: any) => {
                if (error) {
                    reject(error);
                }
                resolve({ req, res });
            });
        });
    };

    const {
        pusher_app_id: appId,
        pusher_app_key: key,
        pusher_app_secret: secret,
        pusher_app_cluster: cluster,
    } = process.env as { [key: string]: string };

    const pusher = new Pusher({
        appId,
        cluster,
        key,
        secret,
    });

    /* Use the playerId as the channel name, and the gameId as the event name */
    return pusher.triggerAsync(playerId.replace('|', ''), gameId, message);
}

export enum Event {
    GameUpdated = 'GAME_UPDATED',
    GameDeleted = 'GAME_DELETED',
}
