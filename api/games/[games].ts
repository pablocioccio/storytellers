import { NowRequest, NowResponse } from '@now/node';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import { IGame } from '../../model/game';
import { IGameData } from '../../model/game-data';
import { IPlayer } from '../../model/player';

/**
 * Retrieve game by id, only if the player is part of the game.
 */
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

    /* By convention, the "games" variable will hold the gameId sent by url param.
    https://zeit.co/docs/v2/serverless-functions/introduction/#path-segments */
    const {
        query: { games },
    } = request;

    const database = dbManager.getDatabase();

    // Retrieve game from the database
    const gameSnapshot = await database.ref(`/games/${games}`).once('value');
    const game: IGame = gameSnapshot.val();
    if (!game) {
        response.status(404).send('Game not found.');
        return;
    }

    if (!game.players.map((player: IPlayer) => player.user_id).includes(userId)) {
        response.status(401).send('You are not allowed to view this game');
        return;
    }

    /* If the game is completed, return game data. */
    if (game.completed) {
        const gameDataSnapshot = await database.ref(`/game-data/${games}`).once('value');
        const gameData: IGameData[] = gameDataSnapshot.val();
        if (!gameData) {
            response.status(404).send('Game data not found.');
            return;
        }
        game.gameData = gameData;
    }

    response.status(200).send(game);
};
