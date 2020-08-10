import { NowRequest, NowResponse } from '@vercel/node';
import authenticator = require('../../../lib/authenticator');
import * as dbManager from '../../../lib/database';
import * as emailManager from '../../../lib/email';
import * as notificationManager from '../../../lib/notification';
import * as pusher from '../../../lib/pusher';
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
        response.status(401).send({ message: 'You are not allowed to play this game' });
        return;
    }

    if (game.invitations) {
        response.status(401).send({ message: 'This game has pending invitations' });
        return;
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

        try {
            await Promise.all([
                // Update database
                database.ref().update(updates),
                // Send web push notifications to all players (except the current one)
                notificationManager.sendGameEndNotifications(game, user.user_id),
                // Send an email to all players (except the current one)
                ...game.players
                    .filter((player: IPlayer) => player.user_id !== user.user_id)
                    .map((player: IPlayer) =>
                        emailManager.sendEmail(
                            player.email,
                            `${game.title.toUpperCase()} is finished!`,
                            `Hi ${player.name}! The game "${game.title}" has just finished.\n\n` +
                            `Follow this link to see how you and your friends fared: ${process.env.frontend_url}/games/${gameId}.`,
                        ),
                    ),
                // Send pusher events to all players (except the current one)
                ...game.players
                    .filter((player: IPlayer) => player.user_id !== user.user_id)
                    .map((player: IPlayer) =>
                        pusher.sendMessageByPlayerId(
                            player.user_id, gameId as string, pusher.Event.GameUpdated,
                        ),
                    ),
            ]);
        } catch (error) {
            console.error(error);
            response.status(500).json({ error });
            return;
        }

    } else {
        const nextPlayer: IPlayer = game.players[(game.currentPhraseNumber + 1) % game.players.length];
        updates[`/games/${gameId}/currentPlayerId`] = nextPlayer.user_id;
        updates[`/games/${gameId}/currentPhraseNumber`] = game.currentPhraseNumber + 1;
        updates[`/games/${gameId}/firstWords`] = request.body.lastWords;

        try {
            await Promise.all([
                // Update database
                database.ref().update(updates),
                // Send web push notification to the next player
                notificationManager.sendNextTurnNotifications(nextPlayer, game),
                // Send an email to the next player
                emailManager.sendEmail(
                    nextPlayer.email,
                    `It's your turn in ${game.title.toUpperCase()}`,
                    `Hi ${nextPlayer.name}. You are up next in "${game.title}".\n\n` +
                    `Follow this link to play: ${process.env.frontend_url}/games/${gameId}/play.`,
                ),
                // Send pusher events to all players (except the current one)
                ...game.players
                    .filter((player: IPlayer) => player.user_id !== user.user_id)
                    .map((player: IPlayer) =>
                        pusher.sendMessageByPlayerId(
                            player.user_id, gameId as string, pusher.Event.GameUpdated,
                        ),
                    ),
            ]);
        } catch (error) {
            console.error(error);
            response.status(500).json({ error });
            return;
        }

    }

    response.status(200).send({});
};
