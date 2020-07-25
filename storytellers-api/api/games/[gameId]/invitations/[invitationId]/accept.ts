import { NowRequest, NowResponse } from '@vercel/node';
import authenticator = require('../../../../../lib/authenticator');
import * as dbManager from '../../../../../lib/database';
import * as emailManager from '../../../../../lib/email';
import * as notificationManager from '../../../../../lib/notification';
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

    if (invitation.email !== user.email) {
        response.status(401).send({ message: `Invitation was sent to ${invitation.email}, but the user email is ${user.email}.` });
        return;
    }

    const gameRef = database.ref(`/games/${gameId}`);
    await gameRef.transaction((game: IGame) => {
        if (game) {
            // Delete current invitation and add player to the list
            if (game.invitations) { delete game.invitations[invitationId as string]; }
            game.players.push(user);
        }
        return game;
    }, async (error, committed, snapshot) => {
        if (error) {
            console.error(`There was an error accepting invitation ${invitationId} for game ${gameId}. Current user: ${JSON.stringify(user)}.`, error);
            response.status(500).send({ message: 'There was an error accepting the invitation.' });
            return;
        } else if (!committed) {
            console.error(`Invitation ${invitationId} for game ${gameId} could not be accepted. Current user: ${JSON.stringify(user)}.`);
            response.status(500).send({ message: 'There was an error accepting the invitation.' });
            return;
        } else {
            if (snapshot) {
                // Retrieve game state after the update operation
                const game = snapshot.val() as IGame;
                // Create an object to update multiple elements at once
                const updates: { [key: string]: any } = {
                    [`/user-games/${user.user_id}/${gameId}`]: { timestamp: new Date() },
                };
                // Prepare an email in case the game starts
                let email: { recipient: string, subject: string, message: string } | null = null;
                // If it was the last invitation, then initialize game data
                if (!game.invitations) {
                    const gameData: { [key: number]: { phrase: string, lastWords: string } } = {};
                    for (let i = 0; i < game.rounds * Object.keys(game.players).length; i++) {
                        gameData[i] = {
                            lastWords: '',
                            phrase: '',
                        };
                    }
                    updates[`/game-data/${gameId}`] = gameData;
                    email = {
                        message: `Hi ${game.players[0].name}. You are up next in "${game.title}".\n\n` +
                            `Follow this link to play: ${process.env.frontend_url}/games/${gameId}/play.`,
                        recipient: game.players[0].email,
                        subject: `It's your turn in ${game.title.toUpperCase()}`,
                    };
                }

                try {
                    // Perform the database update
                    const promises = [database.ref().update(updates)];
                    if (email) {
                        // Send email and push notification to the creator
                        promises.push(notificationManager.sendNextTurnNotifications(game.players[0], game));
                        promises.push(emailManager.sendEmail(
                            game.players[0].email,
                            `It's your turn in ${game.title.toUpperCase()}`,
                            `Hi ${game.players[0].name}. You are up next in "${game.title}".\n\n` +
                            `Follow this link to play: ${process.env.frontend_url}/games/${gameId}/play.`,
                        ));
                    }
                    await Promise.all(promises);
                } catch (error) {
                    console.error(
                        `Invitation ${invitationId} for game ${gameId} was accepted, but the there ` +
                        `was a problem initializing the game. Current user: ${JSON.stringify(user)}.`, error,
                    );
                    response.status(500).send({ message: 'There was an error accepting the invitation.' });
                    return;
                }

                // Return a successful response
                console.log(`Invitation ${invitationId} for game ${gameId} accepted succesfully. Current user: ${JSON.stringify(user)}.`);
                response.status(200).send({});
                return;
            } else {
                console.error(
                    `Invitation ${invitationId} for game ${gameId} was accepted, but the game state could not be retrieved.` +
                    `That means that the game will not be properly initialized. Current user: ${JSON.stringify(user)}.`,
                );
                response.status(500).send({ message: 'There was an error accepting the invitation.' });
                return;
            }
        }
    });

};
