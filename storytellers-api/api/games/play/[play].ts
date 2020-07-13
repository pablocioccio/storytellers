import { NowRequest, NowResponse } from '@vercel/node';
import authenticator = require('../../../lib/authenticator');
import * as dbManager from '../../../lib/database';
import * as notificationManager from '../../../lib/notification';
import { IGame } from '../../../model/game';
import { IPlayer } from '../../../model/player';

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

    /* By convention, the "play" variable will hold the gameId sent by url param.
    https://zeit.co/docs/v2/serverless-functions/introduction/#path-segments */
    const {
        query: { play },
    } = request;

    const database = dbManager.getDatabase();

    // Retrieve game from the database
    const snapshot = await database.ref(`/games/${play}`).once('value');
    const game: IGame = snapshot.val();
    if (!game) {
        response.status(404).send('Game not found.');
        return;
    }

    if (!game.players.map((player: IPlayer) => player.user_id).includes(userId)) {
        response.status(401).send('You are not allowed to play this game');
        return;
    }

    if (game.completed) {
        response.status(400).send('This game is already finished');
        return;
    }

    if (userId !== game.currentPlayerId) {
        response.status(400).send('It\'s not your turn to play this game');
        return;
    }

    // Different database nodes will be updated all at once
    const updates: any = {};

    // Update current phrase data
    updates[`/game-data/${game.id}/${game.currentPhraseNumber}`] = {
        lastWords: request.body.lastWords,
        phrase: request.body.phrase,
    };

    // Update game information
    if (game.currentPhraseNumber + 1 === game.rounds * game.players.length) {
        // This was the last phrase of the game
        updates[`/games/${game.id}/currentPhraseNumber`] = null;
        updates[`/games/${game.id}/currentPlayerId`] = null;
        updates[`/games/${game.id}/firstWords`] = null;
        updates[`/games/${game.id}/completed`] = true;

        // Update database information first
        await database.ref().update(updates);

        // Send push notifications to all players
        await notificationManager.sendGameEndNotifications(game);

    } else {
        const nextPlayer: IPlayer = game.players[(game.currentPhraseNumber + 1) % game.players.length];
        updates[`/games/${game.id}/currentPlayerId`] = nextPlayer.user_id;
        updates[`/games/${game.id}/currentPhraseNumber`] = game.currentPhraseNumber + 1;
        updates[`/games/${game.id}/firstWords`] = request.body.lastWords;

        // Update database information first
        await database.ref().update(updates);

        // Send push notifications to the next player
        await notificationManager.sendNextTurnNotifications(nextPlayer, game);
    }

    response.status(200).send({});
};
