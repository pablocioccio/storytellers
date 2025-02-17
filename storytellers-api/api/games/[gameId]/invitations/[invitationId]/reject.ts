import { NowRequest, NowResponse } from '@vercel/node';
import authenticator = require('../../../../../lib/authenticator');
import * as dbManager from '../../../../../lib/database';
import * as emailManager from '../../../../../lib/email';
import * as notificationManager from '../../../../../lib/notification';
import * as pusher from '../../../../../lib/pusher';
import { IGame } from '../../../../../model/game';
import { IPlayer } from '../../../../../model/player';

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

    const {
        query: { gameId, invitationId },
    } = request;

    const database = dbManager.getDatabase();
    const invitationSnapshot = await database.ref(`/games/${gameId}/invitations/${invitationId}`).once('value');
    const invitation: { email: string } = invitationSnapshot.val();
    if (!invitation) {
        response.status(404).send({ message: 'Invitation not found.' });
        return;
    }

    if (!emailManager.equals(invitation.email, user.email)) {
        response.status(401).send({ message: `Invitation was sent to ${invitation.email}, but the user email is ${user.email}.` });
        return;
    }

    const gameRef = database.ref(`/games/${gameId}`);
    await gameRef.transaction((game: IGame) => {
        if (game) {
            if (game.invitations) { delete game.invitations[invitationId as string]; }
        }
        return game;
    }, async (error, committed, snapshot) => {
        if (error) {
            console.error(`There was an error rejecting invitation ${invitationId} for game ${gameId}. Current user: ${JSON.stringify(user)}.`, error);
            response.status(500).send({ message: 'There was an error rejecting the invitation.' });
            return;
        } else if (!committed) {
            console.error(`Invitation ${invitationId} for game ${gameId} could not be rejected. Current user: ${JSON.stringify(user)}.`);
            response.status(500).send({ message: 'There was an error rejecting the invitation.' });
            return;
        } else {
            if (snapshot) {
                // Retrieve game state after the update operation
                const game = snapshot.val() as IGame;
                // Pusher event that will be sent to the players
                let pusherEvent = pusher.Event.GameUpdated;
                // Was it the last invitation?
                if (!game.invitations) {
                    const promises = [];
                    // Create an object to update multiple elements at once
                    const updates: { [key: string]: any } = {};
                    if (game.players.length === 1) {
                        // The only player left is the creator, so the game will be deleted
                        pusherEvent = pusher.Event.GameDeleted;
                        updates[`/games/${gameId}`] = null;
                        updates[`/user-games/${game.players[0].user_id}/${gameId}`] = null;
                        promises.push(emailManager.notifyAllInvitationsRejected(
                            game.players[0].email, game.players[0].name, game.title,
                        ));
                    } else {
                        // The game is ready to start, so we initialize the game data
                        const gameData: { [key: number]: { phrase: string, lastWords: string } } = {};
                        for (let i = 0; i < game.rounds * Object.keys(game.players).length; i++) {
                            gameData[i] = {
                                lastWords: '',
                                phrase: '',
                            };
                        }
                        updates[`/game-data/${gameId}`] = gameData;
                        // Send an email notification
                        promises.push(emailManager.notifyNextTurn(
                            game.players[0].email, game.players[0].name, game.title, gameId as string,
                        ));
                        // Send a push notification
                        promises.push(notificationManager.sendNextTurnNotifications(game.players[0], game));
                    }
                    try {
                        promises.push(database.ref().update(updates));
                        await Promise.all(promises);
                    } catch (error) {
                        console.error(
                            `Invitation ${invitationId} for game ${gameId} was rejected. However, the game could ` +
                            `not be properly initialized/removed. Current user: ${JSON.stringify(user)}.`,
                        );
                        response.status(500).send({ message: 'There was an error rejecting the invitation.' });
                        return;
                    }
                }

                try {
                    // Send pusher events to all players
                    const pusherPromises = [
                        ...game.players.map((player: IPlayer) =>
                            pusher.sendMessageByPlayerId(player.user_id, gameId as string, pusherEvent),
                        ),
                    ];
                    if (game.invitations) {
                        pusherPromises.push(
                            ...Object.values(game.invitations).map((value: { email: string }) =>
                                pusher.sendMessageByEmail(value.email, gameId as string, pusherEvent),
                            ),
                        );
                    }
                    await Promise.all(pusherPromises);
                } catch (error) {
                    console.error(
                        `Invitation ${invitationId} for game ${gameId} was rejected, but pusher notifications ` +
                        `to all players could not be sent. Current user: ${JSON.stringify(user)}.`, error,
                    );
                }

                // Return a successful response
                console.log(`Invitation ${invitationId} for game ${gameId} rejected succesfully. Current user: ${JSON.stringify(user)}.`);
                response.status(200).send({});
                return;
            } else {
                console.error(
                    `Invitation ${invitationId} for game ${gameId} was rejected, but the game state could not be retrieved.` +
                    `That means that the game might not be properly initialized. Current user: ${JSON.stringify(user)}`,
                );
                response.status(500).send({ message: 'There was an error rejecting the invitation.' });
                return;
            }
        }
    });

};
