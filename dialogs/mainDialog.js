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
  ])
  // Once triggered, will start the 'showDinnerCart' dialog.
  // Then, the waterfall will resumed from the step that was interrupted.
    .beginDialogAction('showHelpAction', 'commandHelper', {
      matches: /^\/?\?$/i
    });

// Choose problem or feedback
  bot.dialog('ProblemOrFeedback', [
    function (session) {
      builder.Prompts.choice(session, "Вы всегда можете набрать '?' для вызова помощи.\n\nМожем предложить Вам:", ["Оставить отзыв","Задать вопрос"], { listStyle: builder.ListStyle.button });
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
      debug('Проблема:задайте вопрос',session.message);
      builder.Prompts.text(session,'Задайте вопрос...');
    },
    function(session, results){
      debug('Проблема:инициация QnA',results);
      session.beginDialog(qnaDialogName,results)
    },
    function(session, results){
      debug('Проблема:установка петли',results)
      session.replaceDialog('Проблема');
    }
  ])


  bot.dialog('commandHelper', function (session) {
      session.endDialog('reset/stop/end/bye/пока и др. - сброс диалогов, возврат в гланое меню\n\n? - вызов данной подсказки');
    }
  );

  const sentimentDialogName = 'sentimentDialog';
  sentimentDialog({name:sentimentDialogName,bot});
  bot.dialog('Отзыв', [
    function (session) {
      builder.Prompts.text(session, "Каково Ваше мнение о нас?");
    },
    function(session, result){
      session.beginDialog(sentimentDialogName,result)
    },
    function (session, results) {
      session.replaceDialog('Отзыв');
    }
  ]);

  // The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
  bot.dialog('resetDialog', function (session, args, next) {
    session.replaceDialog(name);
  }).triggerAction({
      matches: /^\/?(reset|спасибо|хватит|назад|меню|пока|в начало|end|stop|thanks|thanx|bye)$/i
    });
};

module.exports = mainDialog;
