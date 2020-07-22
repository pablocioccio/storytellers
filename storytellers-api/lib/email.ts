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
