import R from "ramda";
import math from "mathjs";

let matchHistory = new Map();
let openChats;
const COOKIE_CHANNEL = "C0146HCG2LA";
const BOT_TOKEN = "xoxb-1142578157202-1148297341394-z7YKdL2iTSRy5bx3eTXEKymZ";

class Bot {

    logger;
    app;

    constructor(logger, app) {
        this.logger = logger;
        this.app = app;
    }

    async match() {
        const userList = this.getUserList();
        const matches = this.createMatches(userList.map(user => user.id));

        const chatIds = await Promise.all(
            matches.map(match => openConversation(match))
        );

        openChats = chatIds;

        chatIds.forEach(id => sendIntroMessage(id));
    }

    remind() {
        openChats.forEach(chat => sendRemindMessage(chat));
    }

    async getUserList() {
        const channelMembersIds = await getChannelMembers(COOKIE_CHANNEL);
        const allUsers = await Promise.all(channelMembersIds.map(memberId => getUserInfo(memberId)));

        return allUsers.filter(userInfo => !userInfo.is_bot);
    }

    async sendRemindMessage(chatId) {
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

    async sendIntroMessage(channelId) {
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

    async sendFormmattedMessage(channelId, blocks) {
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

    createMatches(userIdList) {

        var shuffledUserIdList = this.shuffleArray(userIdList);
        var remainingUsersToMatch = shuffledUserIdList;
        var matchesList = new Array();

        while (remainingUsersToMatch.length !== 0) {
            var matchGroup = new Array();

            if (remainingUsersToMatch.length === 3) {
                matchGroup = remainingUsersToMatch;
                matchesList.push(matchGroup);

                remainingUsersToMatch = []; 
            } else {
                matchGroup = this.getMatch(remainingUsersToMatch)
                matchesList.push(matchGroup);
                
                remainingUsersToMatch = this.removeIdsFromList(matchGroup, remainingUsersToMatch);
            }
            this.updateHistoryMap(matchGroup);
        }

        return matchesList;
    }

    removeIdsFromList(idsToRemove, list) {
        const updatedList = list.filter((id) => {
            return !idsToRemove.includes(id);
        });

        return updatedList;
    }

    shuffleArray(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    getMatch(userIdList) {
        let firstUserId = userIdList[0];

        let userList = R.remove(0, 1, userIdList);

        let deduplicatedUserList = this.deDuplicate(firstUserId, userList);

        if (deduplicatedUserList.length === 0) {
            this.resetUserHistory(firstUserId);
            deduplicatedUserList = userList;
        }

        let secondUserId = this.getRandomUserId(deduplicatedUserList);

        return [firstUserId, secondUserId];
    }

    updateHistoryMap(matchList) {
        matchList.forEach((userId) => {
            let usersMetInThisRound = matchList.filter(id => id !== userId);

            if (matchHistory.has(userId)) {
                let usersMetBefore = matchHistory.get(userId);

                matchHistory.set(userId, usersMetBefore.concat(usersMetInThisRound));
            } else {
                matchHistory.set(userId, usersMetInThisRound);
            }
        });
    }

    resetUserHistory(userId) {
        if (matchHistory.has(userId)) {
            matchHistory.set(userId, []);
        } else {
            this.logger.error("History reset requested for userId that is not in the history. ID: " + userId)
        }
    }

    getRandomUserId(userIdList) {
        if (userIdList.length === 1) {
            return userIdList[0];
        }

        const randomIndex = math.randomInt(0, userIdList.length);

        return userIdList[randomIndex];
    }

    deDuplicate(userId, userIdList) {
        if (matchHistory.has(userId)) {
            let usersMetBefore = matchHistory.get(userId);

            return this.removeIdsFromList(usersMetBefore, userIdList);
        }

        return userIdList;
    }

    async sendMessage(channelId, text) {
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

    async openConversation(userListId) {
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

    async getUserInfo(userId) {
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

    async getChannelMembers(channelId) {
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
}

export default Bot; 