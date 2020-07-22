import { NowRequest, NowResponse } from '@vercel/node';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import { IGame } from '../../model/game';
import { IGameData } from '../../model/game-data';
import { IPlayer } from '../../model/player';

/**
 * Retrieve game by id, but only if the player is part of the game.
 */
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

    /* By convention, the "id" variable will hold the gameId sent by url param.
    https://vercel.com/docs/v2/serverless-functions/introduction#path-segments */
    const {
        query: { gameId },
    } = request;

    const database = dbManager.getDatabase();

    // Retrieve game from the database
    const gameSnapshot = await database.ref(`/games/${gameId}`).once('value');
    const game: IGame = gameSnapshot.val();
    if (!game) {
        response.status(404).send({ message: 'Game not found.' });
        return;
    }

    if (!game.players.map((player: IPlayer) => player.user_id).includes(user.user_id)) {
        if (!game.invitations || !Object.values(game.invitations).map((entry) => entry.email).includes(user.email)) {
            response.status(401).send({ message: 'You are not allowed to view this game' });
            return;
        }
    }

    /* If the game is completed, return game data. */
    if (game.completed) {
        const gameDataSnapshot = await database.ref(`/game-data/${gameId}`).once('value');
        const gameData: IGameData[] = gameDataSnapshot.val();
        if (!gameData) {
            response.status(404).send({ message: 'Game data not found.' });
            return;
        }
        game.gameData = gameData;
    }

    response.status(200).send(game);
};
