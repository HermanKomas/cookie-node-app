import Bot from './bot.js';
import App from '@slack/bolt';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      //
      // - Write all logs with level `error` and below to `error.log`
      // - Write all logs with level `info` and below to `combined.log`
      //
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
});

const BOT_TOKEN = "xoxb-1142578157202-1148297341394-z7YKdL2iTSRy5bx3eTXEKymZ";

const app = new App.App ({
    token: BOT_TOKEN,
    signingSecret: "292acb173b37d8d07f9e393ad72b0efc"
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
}

const bot = new Bot(logger, app);

app.message('match', async ({ message, say }) => {
    logger.info("got a match")
    await bot.match();
});

app.message('remind', async ({ message, say }) => {
    bot.remind();
});

app.shortcut('yes_button', async ({ ack, say }) => {
    await ack();
    await say('lovely :smile:');
});

app.action('scheduled_button', async ({ ack, say }) => {
    await ack();
    await say('gotcha :thumbsup_all:');
});

app.action('no_button', async ({ ack, say }) => {
    await ack();
    await say('No worries, I will check in later :wave:');
});


export default app;