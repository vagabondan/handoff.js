"use strict";
const debug = require('debug')('bot:cardsDialog');
const builder = require('botbuilder');
const {calendar} = require('./adaptiveCards');
const {inputs} = require('./inputCards');


module.exports = ({name,bot}) => {

  bot.dialog(name,[
    function(session,results,next){
      session.send(calendar(builder,session));
      //session.send(inputs(builder,session));
      next();
    },
    function(session,results,next){
      //session.send(calendar(builder,session));
      session.send(inputs(builder,session));
      next();
    },
    function(session,results, next){

      session.endDialog();
    }
  ]);



};

