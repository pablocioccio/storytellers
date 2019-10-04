import { NowRequest, NowResponse } from '@now/node';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import { IGame } from '../../model/game';

export default async (request: NowRequest, response: NowResponse) => {
    let userId = '';
    try {
        const payload = await authenticator.handler(request.headers);
        userId = payload.sub;
    } catch (error) {
        console.log(error);
        response.status(401).json({ error: error.message });
        return;
    }

    const database = dbManager.getDatabase();

    // Get a key for a new game
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
        creator: userId,
        currentPhraseNumber: 0,
        firstWords: '',
        id: newGameKey,
        players: request.body.users,
        rounds: request.body.rounds,
        timestamp: currentDate,
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

    response.status(200).send(res);
};
