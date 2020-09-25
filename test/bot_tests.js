import test from 'ava';
import Bot from '../src/bot.js';

const bot = new Bot();

const userList = ["ID001", "ID002", "ID003", "ID004", "ID005", "ID006", "ID007", "ID008", "ID009", "ID010", "ID011", "ID012", "ID013"]

test('should create matches', t => {

    t.log("running tests...");

    const userIdList = userList.slice(0, 4)

    const matches = bot.createMatches(userIdList);

    t.true(matches.length === 2);
});


test('should create matches for uneven number', t => {

    t.log("running tests...");

    const userIdList = userList.slice(0, 5)

    const matches = bot.createMatches(userIdList);

    t.true(matches.length === 2);
});


test('should return three matches', t => {

    t.log("running tests...");

    const userIdList = userList.slice(0, 6)

    const matches = bot.createMatches(userIdList);

    t.true(matches.length === 3);
});


test('should return three matches when uneven', t => {

    t.log("running tests...");

    const userIdList = userList.slice(0, 7)

    const matches = bot.createMatches(userIdList);

    t.true(matches.length === 3);
});

test('should return six matches when even', t => {

    t.log("running tests...");

    const userIdList = userList.slice(0, 12)

    const matches = bot.createMatches(userIdList);

    t.true(matches.length === 6);
});

test('should return six matches when uneven', t => {

    t.log("running tests...");

    const userIdList = userList;

    const matches = bot.createMatches(userIdList);

    t.true(matches.length === 6);
});

test('hundred rounds test', t => {

    t.log("running tests...");

    const userIdList = userList;

    const rounds = 100;

    let happyRounds = 0;

    for (let i = 0; i < rounds; i++) {
        const matches = bot.createMatches(userIdList);
        t.true(matches.length === 6);

        happyRounds++; 
    }

    t.true(happyRounds === 100);
});

test('thousand rounds test', t => {

    t.log("running tests...");

    const userIdList = userList;

    const rounds = 1000;

    let happyRounds = 0;

    for (let i = 0; i < rounds; i++) {
        const matches = bot.createMatches(userIdList);
        t.true(matches.length === 6);

        happyRounds++; 
    }

    t.true(happyRounds === 1000);
});


test('thousand rounds test when even', t => {

    t.log("running tests...");

    const userIdList = userList.slice(0, 12);

    const rounds = 1000;

    let happyRounds = 0;

    for (let i = 0; i < rounds; i++) {
        const matches = bot.createMatches(userIdList);
        t.true(matches.length === 6);

        happyRounds++; 
    }

    t.true(happyRounds === 1000);
});


