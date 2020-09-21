import * as nodemailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import * as dbManager from './database';

// tslint:disable-next-line: max-line-length
export async function sendInvitation(email: string, creator: string, gameTitle: string, gameKey: string, invitationKey: string) {
    // Prepare and send the email
    const mailTransport = getMailTransport();
    const message = `Hi! ${creator} wants you to be part of "${gameTitle}".\n\n` +
        `Follow this link to see your invitation: ${process.env.frontend_url}/games/${gameKey}/invitation/${invitationKey}.\n\n` +
        `Don't want to receive emails from Storytellers? Click here: ${process.env.frontend_url}/notifications/${await getUnsubscribeKey(email)}/block`;
    const mailOptions: Mail.Options = {
        from: `Storytellers <${process.env.email_account}>`,
        subject: `${creator} invited you to Storytellers!`,
        text: message,
        to: email,
    };
    return mailTransport.sendMail(mailOptions);
}

export async function notifyNextTurn(email: string, nextPlayer: string, gameTitle: string, gameKey: string) {
    // Check if the address is in the blocklist
    const blocklisted = await checkBlocklist([email]);
    if (blocklisted.length) { return; }
    // Prepare and send the email
    const mailTransport = getMailTransport();
    const message = `Hi ${nextPlayer}. You are up next in "${gameTitle}".\n\n` +
        `Follow this link to play: ${process.env.frontend_url}/games/${gameKey}/play.\n\n` +
        `Don't want to receive emails from Storytellers? Click here: ${process.env.frontend_url}/notifications/${await getUnsubscribeKey(email)}/block`;
    const mailOptions: Mail.Options = {
        from: `Storytellers <${process.env.email_account}>`,
        subject: `It's your turn in ${gameTitle.toUpperCase()}`,
        text: message,
        to: email,
    };
    return mailTransport.sendMail(mailOptions);
}

export async function notifyAllInvitationsRejected(email: string, creator: string, gameTitle: string) {
    // Check if the address is in the blocklist
    const blocklisted = await checkBlocklist([email]);
    if (blocklisted.length) { return; }
    // Prepare and send the email
    const mailTransport = getMailTransport();
    const message = `Hi ${creator}. Since all invitations to "${gameTitle}" were rejected, the game will be deleted.\n\n` +
        `Don't want to receive emails from Storytellers? Click here: ${process.env.frontend_url}/notifications/${await getUnsubscribeKey(email)}/block`;
    const mailOptions: Mail.Options = {
        from: `Storytellers <${process.env.email_account}>`,
        subject: `All invitations to ${gameTitle.toUpperCase()} were rejected`,
        text: message,
        to: email,
    };
    return mailTransport.sendMail(mailOptions);
}

export async function notifyGameFinished(email: string, player: string, gameTitle: string, gameKey: string) {
    // Check if the address is in the blocklist
    const blocklisted = await checkBlocklist([email]);
    if (blocklisted.length) { return; }
    // Prepare and send the email
    const mailTransport = getMailTransport();
    const message = `Hi ${player}! The game "${gameTitle}" has just finished.\n\n` +
        `Follow this link to see how you and your friends fared: ${process.env.frontend_url}/games/${gameKey}.\n\n` +
        `Don't want to receive emails from Storytellers? Click here: ${process.env.frontend_url}/notifications/${await getUnsubscribeKey(email)}/block`;
    const mailOptions: Mail.Options = {
        from: `Storytellers <${process.env.email_account}>`,
        subject: `${gameTitle.toUpperCase()} is finished!`,
        text: message,
        to: email,
    };
    return mailTransport.sendMail(mailOptions);
}

/**
 * Check if two email addresses are equal, taking into
 *  account that gmail ignores dots in the username.
 * @param email1
 * @param email2
 */
export function equals(email1: string, email2: string) {
    return email1 === email2 ||
        (email1.split('@')[1] === 'gmail.com' && email2.split('@')[1] === 'gmail.com' &&
            email1.split('@')[0].replace(/\./g, '') === email2.split('@')[0].replace(/\./g, ''));
}

/**
 * Remove dots from Gmail email addresses
 */
export function normalizeAddress(email: string) {
    if (email.split('@')[1] === 'gmail.com') {
        return `${email.split('@')[0].replace(/\./g, '')}@gmail.com`;
    }
    return email;
}

/**
 * Check for a list of emails on the blocklist
 * @param emails List of emails to be checked
 * @return An array with those emails that are part of the blocklist
 */
export async function checkBlocklist(emails: string[]): Promise<string[]> {
    const blocklisted: string[] = [];
    const database = dbManager.getDatabase();
    const results = await Promise.all(emails.map((email: string) => {
        return database.ref('email-notifications/blocklist')
            .orderByValue()
            .equalTo(normalizeAddress(email))
            .once('value');
    }));

    results.forEach((result) => {
        if (result.val()) {
            blocklisted.push(Object.values(result.val() as string)[0]);
        }
    });

    return blocklisted;
}

function getMailTransport(): Mail {
    const emailAccount = process.env.email_account;
    const emailPassword = process.env.email_password;
    return nodemailer.createTransport({
        auth: {
            pass: emailPassword,
            user: emailAccount,
        },
        service: 'gmail',
    });
}

async function getUnsubscribeKey(email: string): Promise<string> {
    const normalizedEmail = normalizeAddress(email);
    const database = dbManager.getDatabase();
    const existingSubscriptionRef = await database
        .ref('email-notifications/subscriptions')
        .orderByValue()
        .equalTo(normalizedEmail)
        .limitToFirst(1)
        .once('value');

    if (existingSubscriptionRef.val()) {
        return Object.keys(existingSubscriptionRef.val())[0] as string;
    }

    const newSubscriptionRef = database.ref().child('email-notifications/subscriptions').push();
    if (newSubscriptionRef.key === null) { throw new Error('Error generating unsubscribe key'); }
    await newSubscriptionRef.set(normalizedEmail);
    return newSubscriptionRef.key;
}
