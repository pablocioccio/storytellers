import { NowRequest, NowResponse } from '@now/node';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import { IGame } from '../../model/game';

export default async (request: NowRequest, response: NowResponse) => {
    // Validate JWT and get current user id
    let userId = '';
    try {
        const payload = await authenticator.handler(request.headers);
        userId = payload.sub;
    } catch (error) {
        console.log(error);
        response.status(401).json({ error: error.message });
        return;
    }

    /* By convention, the "games" variable will hold the gameId sent by url param.
    https://zeit.co/docs/v2/serverless-functions/introduction/#path-segments */
    const {
        query: { games },
    } = request;

    const database = dbManager.getDatabase();

    // Retrieve game from the database
    const snapshot = await database.ref(`/games/${games}`).once('value');
    const game: IGame = snapshot.val();
    if (!game) {
        response.status(404).send('Game not found.');
        return;
    }

    if (!(game.players as string[]).includes(userId)) {
        response.status(401).send('You are not allowed to view this game');
        return;
    }

    response.status(200).send(game);
};
