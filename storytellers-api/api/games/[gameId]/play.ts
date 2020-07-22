import { NowRequest, NowResponse } from '@vercel/node';
import authenticator = require('../../../lib/authenticator');
import * as dbManager from '../../../lib/database';
import * as notificationManager from '../../../lib/notification';
import { IGame } from '../../../model/game';
import { IPlayer } from '../../../model/player';

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

    /* By convention, the "gameId" variable will hold the gameId sent by url param.
    https://vercel.com/docs/v2/serverless-functions/introduction#path-segments */
    const {
        query: { gameId },
    } = request;

    const database = dbManager.getDatabase();

    // Retrieve game from the database
    const snapshot = await database.ref(`/games/${gameId}`).once('value');
    const game: IGame = snapshot.val();
    if (!game) {
        response.status(404).send({ message: 'Game not found.' });
        return;
    }

    if (!game.players.map((player: IPlayer) => player.user_id).includes(user.user_id)) {
        if (!game.invitations || !Object.values(game.invitations).map((entry) => entry.email).includes(user.email)) {
            response.status(401).send({ message: 'You are not allowed to play this game' });
            return;
        }
    }

    if (game.completed) {
        response.status(400).send({ message: 'This game is already finished' });
        return;
    }

    if (user.user_id !== game.currentPlayerId) {
        response.status(400).send({ message: 'It\'s not your turn to play this game' });
        return;
    }

    // Different database nodes will be updated all at once
    const updates: any = {};

    // Update current phrase data
    updates[`/game-data/${gameId}/${game.currentPhraseNumber}`] = {
        lastWords: request.body.lastWords,
        phrase: request.body.phrase,
    };

    // Update game information
    if (game.currentPhraseNumber + 1 === game.rounds * game.players.length) {
        // This was the last phrase of the game
        updates[`/games/${gameId}/currentPhraseNumber`] = null;
        updates[`/games/${gameId}/currentPlayerId`] = null;
        updates[`/games/${gameId}/firstWords`] = null;
        updates[`/games/${gameId}/completed`] = true;

        // Update database information first
        await database.ref().update(updates);

        // Send push notifications to all players
        await notificationManager.sendGameEndNotifications(game);

    } else {
        const nextPlayer: IPlayer = game.players[(game.currentPhraseNumber + 1) % game.players.length];
        updates[`/games/${gameId}/currentPlayerId`] = nextPlayer.user_id;
        updates[`/games/${gameId}/currentPhraseNumber`] = game.currentPhraseNumber + 1;
        updates[`/games/${gameId}/firstWords`] = request.body.lastWords;

        // Update database information first
        await database.ref().update(updates);

        // Send push notifications to the next player
        await notificationManager.sendNextTurnNotifications(nextPlayer, game);
    }

    response.status(200).send({});
};
