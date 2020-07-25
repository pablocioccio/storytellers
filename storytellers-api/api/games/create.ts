import { NowRequest, NowResponse } from '@vercel/node';
import * as EmailValidator from 'email-validator';
import authenticator = require('../../lib/authenticator');
import * as dbManager from '../../lib/database';
import * as emailManager from '../../lib/email';
import { IGame } from '../../model/game';
import { IInvitations } from '../../model/invitations';
import { IPlayer } from '../../model/player';

export default async (request: NowRequest, response: NowResponse) => {
    // Validate JWT and get current user info
    let creator: IPlayer;
    try {
        const payload = await authenticator.handler(request.headers);
        // Email, name and picture are custom claims that are obtained through Auth0 rules
        creator = {
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

    // Validate invitations
    for (const invitation of request.body.invitations) {
        if (!EmailValidator.validate(invitation)) {
            const message = `Invalid email address: ${invitation}`;
            console.error(message);
            response.status(400).json({ message });
            return;
        }
    }

    // Get database manager
    const database = dbManager.getDatabase();

    // Obtain a key for the new game
    const newGameKey = database.ref().child('games').push().key;

    if (newGameKey === null) {
        response.status(500).json({ message: 'Error creating new game' });
        return;
    }

    // Generate keys for the invitations
    const invitations: IInvitations = {};
    for (const invitation of request.body.invitations) {
        const invitationKey = database.ref().child(`games/${newGameKey}/invitations`).push().key;
        if (invitationKey === null) {
            response.status(500).json({ message: 'Error creating invitations for the new game' });
            return;
        }
        invitations[invitationKey] = { email: invitation };
    }

    // Different database nodes will be updated all at once
    const updates: any = {};
    // Obtain the current date once and use it consistently across all update transactions
    const currentDate: Date = new Date();

    // Create the game
    const game: IGame = {
        completed: false,
        creatorId: creator.user_id,
        currentPhraseNumber: 0,
        currentPlayerId: creator.user_id,
        ...request.body.description && { description: request.body.description },
        id: newGameKey,
        invitations,
        players: [creator],
        rounds: request.body.rounds,
        timestamp: currentDate,
        title: request.body.title,
    };

    // Store transaction in the updates array
    updates[`/games/${newGameKey}`] = game;

    // Create an entry for the only confirmed player so far: the creator
    updates[`/user-games/${creator.user_id}/${newGameKey}`] = {
        timestamp: currentDate,
    };

    try {
        // Send invitations and update database
        await Promise.all([
            database.ref().update(updates),
            ...Object.entries(invitations).map(([invitationKey, invitation]) => {
                return emailManager.sendEmail(
                    invitation.email,
                    `${creator.name} invited you to Storytellers!`,
                    `Hi! ${creator.name} wants you to be part of "${game.title}".\n\n` +
                    `Follow this link to see your invitation: ${process.env.frontend_url}/games/${newGameKey}/invitation/${invitationKey}`,
                );
            }),
        ]);
    } catch (error) {
        console.error(error);
        response.status(500).json({ error });
        return;
    }

    response.status(200).send({ id: newGameKey });
};
