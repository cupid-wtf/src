import mailgun from 'mailgun-js';

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY as string,
  domain: process.env.MAILGUN_DOMAIN as string,
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = ({ to, subject, text, html }: EmailOptions): Promise<mailgun.messages.SendResponse> => {
  const data = {
    from: 'opium <auth@opium.bio>',
    to,
    subject,
    text,
    html,
  };

  return mg.messages().send(data);
};