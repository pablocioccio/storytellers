import { NowRequest, NowResponse } from '@now/node';
import { AppMetadata, ManagementClient, User, UserMetadata } from 'auth0';
import authenticator = require('../../../lib/authenticator');
import * as dbManager from '../../../lib/database';
import { IGame } from '../../../model/game';
import { IPlayer } from '../../../model/player';

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

    if (!(game.players as string[]).includes(userId)) {
        response.status(401).send('You are not allowed to play this game');
        return;
    }

    if (game.completed) {
        response.status(400).send('This game is already finished');
        return;
    }

    const players: string[] = game.players as string[];
    const currentPlayerIndex: number = game.currentPhraseNumber % players.length;
    if (userId !== players[currentPlayerIndex]) {
        response.status(400).send('It\'s not your turn to play this game');
        return;
    }

    // Different database nodes will be updated all at once
    const updates: any = {};

    if (game.currentPhraseNumber === game.rounds * players.length - 1) {
        // This was the last phrase of the game
        updates[`/games/${game.id}/currentPhraseNumber`] = null;
        updates[`/games/${game.id}/currentPlayer`] = null;
        updates[`/games/${game.id}/firstWords`] = null;
        updates[`/games/${game.id}/completed`] = true;
    } else {
        // Retrieve the next player info
        const managementClient: ManagementClient = new ManagementClient({
            clientId: `${process.env.authentication_mgmt_api_clientid}`,
            clientSecret: `${process.env.authentication_mgmt_api_secret}`,
            domain: `${process.env.authentication_domain}`,
        });
        const nextPlayerIndex = (game.currentPhraseNumber + 1) % players.length;
        const users: Array<User<AppMetadata, UserMetadata>> = await managementClient.getUsers({
            fields: 'user_id,name,email,picture',
            include_fields: true,
            q: `user_id:${game.players[nextPlayerIndex]}`,
            search_engine: 'v3',
        });

        // Update game data
        updates[`/games/${game.id}/currentPlayer`] = users[0] as IPlayer;
        updates[`/games/${game.id}/currentPhraseNumber`] = game.currentPhraseNumber + 1;
        updates[`/games/${game.id}/firstWords`] = request.body.lastWords;
    }

    updates[`/game-data/${game.id}/${game.currentPhraseNumber}`] = {
        lastWords: request.body.lastWords,
        phrase: request.body.phrase,
    };

    // Update all nodes at once
    const res = await database.ref().update(updates);

    response.status(200).send(res);
};
