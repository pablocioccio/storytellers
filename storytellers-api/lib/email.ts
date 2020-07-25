import * as nodemailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';

export function sendEmail(recipient: string, subject: string, message: string) {
    const emailAccount = process.env.email_account;
    const emailPassword = process.env.email_password;

    const mailTransport = nodemailer.createTransport({
        auth: {
            pass: emailPassword,
            user: emailAccount,
        },
        service: 'gmail',
    });

    const mailOptions: Mail.Options = {
        from: `Storytellers <${emailAccount}>`,
        subject,
        text: message,
        to: recipient,
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
