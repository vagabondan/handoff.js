"use strict";
const builder = require('botbuilder');
const qnaDialog = require('./qnaDialog');
const sentimentDialog = require('./sentimentDialog');
const debug = require('debug')('bot:mainDialog');

const mainDialog = ({name,bot, isAgent}) => {
  bot.dialog(name,[
    function(session){
      isAgent(session) ?
        session.endDialog():
        session.beginDialog('ProblemOrFeedback');
    }
  ]);

// Choose problem or feedback
  bot.dialog('ProblemOrFeedback', [
    function (session) {
      builder.Prompts.choice(session, "Желаете ли вы...", ["оставить отзыв","обратиться в поддержку"], { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
      //session.dialogData.reason = builder.EntityRecognizer.resolveTime([results.response]);
      session.dialogData.reason = results.response.entity;
      debug('Problem or feedback reason:',session.dialogData.reason);

      if(session.dialogData.reason.indexOf('отзыв') > -1)
        session.beginDialog('Отзыв')
      else
        session.beginDialog('Проблема');
    }
  ]);

  const qnaDialogName = 'QNADialog';
  qnaDialog({name:qnaDialogName,bot});
  bot.dialog('Проблема', [
    function (session) {
      builder.Prompts.text(session, "Опишите суть обращения");
    },
    function(session, result){
      session.beginDialog(qnaDialogName,result)
    },
    function (session, results) {
      session.endDialogWithResult(results);
    }
  ]);

  const sentimentDialogName = 'sentimentDialog';
  sentimentDialog({name:sentimentDialogName,bot});
  bot.dialog('Отзыв', [
    function (session) {
      builder.Prompts.text(session, "Напишите, пожалуйста, ваше впечатление о нас");
    },
    function(session, result){
      session.beginDialog(sentimentDialogName,result)
    },
    function (session, results) {
      session.endDialogWithResult(results);
    }
  ]);


};

module.exports = mainDialog;