const { App } = require('@slack/bolt');

require('dotenv').config();

const BOT_TOKEN = "xoxb-1142578157202-1148297341394-7hRXRjqKPlxQIpMVNA0yd8L8";
const COOKIE_CHANNEL = "C0146HCG2LA";
var userList;
var openChats;

var matchHistoryMap = new Map();

// Initializes your app with your bot token and signing secret
const app = new App({
    token: BOT_TOKEN,
    signingSecret: "292acb173b37d8d07f9e393ad72b0efc"
});

app.message('match', async ({ message, say }) => {
    const matches = getMatches(userList.map(user => user.id));
    const chatIds = await Promise.all(matches.map(match => openConversation(match)));

    openChats = chatIds;

    chatIds.forEach(id => sendIntroMessage(id));
});

app.message('remind', async ({ message, say }) => {
    sendReminders();
});

app.action('yes_button', async ({ ack, say }) => {
    console.log("got yes!...")
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

function sendReminders() {
    openChats.forEach(chat => sendRemindMessage(chat));
}

async function sendRemindMessage(chatId) {
    const blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":wave: cookie here! Have you had a chance to meet yet?"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "action_id": "yes_button",
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Yes, we did :smile:"
                    },
                    "style": "primary",
                    "value": "yes"
                },
                {
                    "action_id": "scheduled_button",
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "It's scheduled :clock3:"
                    },
                    "style": "primary",
                    "value": "scheduled"
                },
                {
                    "action_id": "no_button",
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Not yet!"
                    },
                    "style": "danger",
                    "value": "no"
                }
            ]
        }
    ];
    await sendFormmattedMessage(chatId, blocks);
}

function setMatchHistory(key, value) {
    if (matchHistoryMap.has(key)) {
        const updatedValue = matchHistoryMap.get(key).concat([value]);
        matchHistoryMap.set(key, updatedValue)
    } else {
        matchHistoryMap.set(key, [value])
    }
}

function updateMatchHistory(partyOneId, partyTwoId) {
    setMatchHistory(partyOneId, partyTwoId);
    setMatchHistory(partyTwoId, partyOneId);
}

function getMatches(userListIds) {

    var matchTuples = [];
    while (userListIds.length > 0) {
        const partyOneIndex = Math.floor(Math.random() * userListIds.length);
        const partyOneId = userListIds[partyOneIndex];
        userListIds.splice(partyOneIndex, 1);

        let filteredList = matchHistoryMap.has(partyOneId)
            ? userListIds.filter(userId => !matchHistoryMap.get(partyOneId).includes(userId))
            : userListIds;

        if (filteredList.length < 1) {
            matchHistoryMap.set(matchHistoryMap.get(partyOneId), []);
            filteredList = userListIds;
        }

        const partyTwoIndex = Math.floor(Math.random() * filteredList.length);
        const partyTwoId = filteredList[partyTwoIndex];

        userListIds = userListIds.filter(user => user != partyTwoId);

        matchTuples.push([partyOneId, partyTwoId])

        updateMatchHistory(partyOneId, partyTwoId);
    }
    return matchTuples;
}

async function sendIntroMessage(channelId) {
    const members = await getChannelMembers(channelId);
    const userData = await Promise.all(members.map(member => getUserInfo(member)));
    const userNames = userData
        .filter(userInfo => !userInfo.is_bot)
        .map(user => "<@" + user.id + ">")

    const message = ":raised_hands: Hey there "
        + userNames.join(", ")
        + " - time for " + "<#" + COOKIE_CHANNEL + ">"
        + " catch up! Grab a :cookie: and have a chat :upside_down_face:";

    sendMessage(channelId, message)
}

async function sendFormmattedMessage(channelId, blocks) {
    try {
        await app.client.chat.postMessage({
            token: BOT_TOKEN,
            channel: channelId,
            blocks: blocks
        });
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

async function sendMessage(channelId, text) {
    try {
        await app.client.chat.postMessage({
            token: BOT_TOKEN,
            channel: channelId,
            text: text
        });
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

async function openConversation(userListId) {
    try {
        const response = await app.client.conversations.open({
            token: BOT_TOKEN,
            users: userListId.join(',')
        });

        return response.channel.id;
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

async function getUserInfo(userId) {
    try {
        const response = await app.client.users.info({
            token: BOT_TOKEN,
            user: userId
        });

        return response.user;
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

async function getChannelMembers(channelId) {
    try {
        const response = await app.client.conversations.members({
            token: BOT_TOKEN,
            channel: channelId
        });

        return response.members;
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');

    const channelMembersIds = await getChannelMembers(COOKIE_CHANNEL);
    const allUsers = await Promise.all(channelMembersIds.map(memberId => getUserInfo(memberId)));
    const usersListNoBots = allUsers.filter(userInfo => !userInfo.is_bot);

    userList = usersListNoBots;
})();
