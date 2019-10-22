import { NowRequest, NowResponse } from '@now/node';
import { ManagementClient } from 'auth0';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import { IGame } from '../../model/game';
import { IPlayer } from '../../model/player';

export default async (request: NowRequest, response: NowResponse) => {
    // Validate JWT and get the creator id
    let creatorId: string;
    try {
        const payload = await authenticator.handler(request.headers);
        creatorId = payload.sub;
    } catch (error) {
        console.log(error);
        response.status(401).json({ error: error.message });
        return;
    }

    const userIds: string[] = request.body.users;

    if (!userIds.includes(creatorId)) {
        response.status(400).json({ error: 'The creator must be part of the game' });
        return;
    }

    // Retrieve full user info for each player
    const query = userIds.map((id) => `user_id:${id}`).join(' OR ');
    const managementClient: ManagementClient = new ManagementClient({
        clientId: `${process.env.authentication_mgmt_api_clientid}`,
        clientSecret: `${process.env.authentication_mgmt_api_secret}`,
        domain: `${process.env.authentication_domain}`,
    });
    const players: IPlayer[] = await managementClient.getUsers({
        fields: 'user_id,name,email,picture',
        include_fields: true,
        q: query,
        search_engine: 'v3',
    }) as IPlayer[];

    // The players array needs to be sorted according to the original userIds array
    players.sort((a: IPlayer, b: IPlayer) => {
        return userIds.indexOf(a.user_id) - userIds.indexOf(b.user_id);
    });

    const database = dbManager.getDatabase();

    // Obtain a key for the new game
    const newGameKey = database.ref().child('games').push().key;

    if (newGameKey === null) {
        response.status(500).json({ error: 'Error creating new game' });
        return;
    }

    // Different database nodes will be updated all at once
    const updates: any = {};
    // Obtain the current date once and use it consistently across all update transactions
    const currentDate: Date = new Date();

    // Create the game
    const game: IGame = {
        completed: false,
        creatorId,
        currentPhraseNumber: 0,
        currentPlayerId: players[0].user_id,
        id: newGameKey,
        players,
        rounds: request.body.rounds,
        timestamp: currentDate,
        title: request.body.title,
    };

    // Store transaction in the updates array
    updates[`/games/${newGameKey}`] = game;

    // Create an entry for each player in the 'user-games' node
    Object.values(request.body.users).forEach((user) => {
        updates[`/user-games/${user}/${newGameKey}`] = {
            timestamp: currentDate,
        };
    });

    const gameData: { [key: number]: { phrase: string, lastWords: string } } = {};
    for (let i = 0; i < game.rounds * Object.keys(game.players).length; i++) {
        gameData[i] = {
            lastWords: '',
            phrase: '',
        };
    }

    // Initialize game posts
    updates[`/game-data/${newGameKey}`] = gameData;

    // Update all nodes at once
    const res = await database.ref().update(updates);

    response.status(200).send({ id: newGameKey });
};
