import { NowRequest, NowResponse } from '@now/node';
import { AppMetadata, ManagementClient, User, UserMetadata } from 'auth0';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import { IGame } from '../../model/game';
import { IPlayer } from '../../model/player';

/**
 * Retrieve game by id, only if the player is part of the game.
 */
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

    /* If the game is completed, return full user info instead of just the ids */
    if (game.completed) {
        const managementClient: ManagementClient = new ManagementClient({
            clientId: `${process.env.authentication_mgmt_api_clientid}`,
            clientSecret: `${process.env.authentication_mgmt_api_secret}`,
            domain: `${process.env.authentication_domain}`,
        });

        const query = (game.players as string[]).map((id) => `user_id:${id}`).join(' OR ');

        const users: Array<User<AppMetadata, UserMetadata>> = await managementClient.getUsers({
            fields: 'user_id,name,email,picture',
            include_fields: true,
            q: query,
            search_engine: 'v3',
        });

        // The fields we require from the Auth0 API, match those of the IPlayer interface.
        game.players = users as IPlayer[];
    }

    response.status(200).send(game);
};
