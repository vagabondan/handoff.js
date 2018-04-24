"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const builder = require("botbuilder");
const dotenv = require('dotenv');
const debug = require('debug')('bot:app');

debug('Init');
dotenv.load();

const handoffLib = require("./handoff");
const commandsLib = require("./commands");

const mainDialog = require('./dialogs/mainDialog');




//=========================================================
// Bot Setup
//=========================================================
const app = express();
// Setup Express Server
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});
// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

const inMemoryStorage = new builder.MemoryBotStorage();
const mainDialogName = 'Main Dialog';
const bot = new builder.UniversalBot(connector, [
  function (session) {
    session.beginDialog(mainDialogName);
  }
]).set('storage',inMemoryStorage);

app.post('/api/messages', connector.listen());
// Create endpoint for agent / call center
app.use('/webchat', express.static('public'));
// replace this function with custom login/verification for agents
const isAgent = (session) => {
  debug('User',session.message.user);
  return session.message.user.name === undefined ? false : session.message.user.name.startsWith("Agent");
  }
const handoff = new handoffLib.Handoff(bot, isAgent);
mainDialog({name:mainDialogName,bot,isAgent,handoff});
//========================================================
// Bot Middleware
//========================================================
bot.use(commandsLib.commandsMiddleware(handoff), handoff.routingMiddleware());
