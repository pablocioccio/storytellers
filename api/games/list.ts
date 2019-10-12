import { NowRequest, NowResponse } from '@now/node';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import { IGame } from '../../model/game';

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

    const games: IGame[] = [];

    const database = dbManager.getDatabase();

    // Retrieve user games from the database
    const userGamesSnapshot = await database.ref(`/user-games/${userId}`).once('value');
    const userGames: Array<{ [key: string]: { timestamp: Date } }> = userGamesSnapshot.val();

    if (userGames) {
        const result: any[] = await Promise.all(
            Object.keys(userGames).map((key: string) => {
                return database.ref(`/games/${key}`).once('value');
            }));
        result.forEach((gameSnapshot) => games.push(gameSnapshot.val()));
    }

    response.status(200).send(games);
};
