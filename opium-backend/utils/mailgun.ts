import mailgun from 'mailgun-js';
import Config from "./config";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: EmailOptions): Promise<mailgun.messages.SendResponse> => {
  await Config.load('config.toml');
  const mg = mailgun({
    apiKey: Config.get<string>("mailgun", "api_key"),
    domain: Config.get<string>("mailgun", "domain"),
  });

  const data = {
    from: 'opium <auth@opium.bio>',
    to,
    subject,
    text,
    html,
  };

  return mg.messages().send(data);
};