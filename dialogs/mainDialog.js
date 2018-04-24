"use strict";
const builder = require('botbuilder');
const qnaDialog = require('./qnaDialog');
const witDialog = require('./witDialog');
const npsDialog = require('./npsDialog');
const cardsDialog = require('./cardsDialog');
const sentimentDialog = require('./sentimentDialog');
const debug = require('debug')('bot:mainDialog');

const mainDialog = ({name,bot, isAgent, handoff}) => {
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


  // Add first run dialog
  bot.dialog('firstRun', [
    function (session) {
      // Update version number and start Prompts
      // - The version number needs to be updated first to prevent re-triggering
      //   the dialog.
      session.userData.version = 1.0;
      builder.Prompts.text(session, "Здравствуйте!.. Как мы можем к Вам обращаться?");
    },
    function (session, results) {
      // We'll save the users name and send them an initial greeting. All
      // future messages from the user will be routed to the root dialog.
      if(results.response){
        session.userData.name = results.response;
      }else{
        session.userData.name = "Уважаемый посетитель";
      }
      builder.Prompts.text(session, session.userData.name + ", сообщите Ваш номер телефона:");
    },
    function (session, results) {
      if(results.response){
        session.userData.msisdn = results.response;
      }else{
        session.userData.msisdn = "unknown";
      }
      session.replaceDialog('ProblemOrFeedback');
    }
  ]).triggerAction({
    onFindAction: function (context, callback) {
      // Trigger dialog if the users version field is less than 1.0
      // - When triggered we return a score of 1.1 to ensure the dialog is always triggered.
      var ver = context.userData.version || 0;
      var score = ver < 1.0 ? 1.1: 0.0;
      callback(null, score);
    },
    onInterrupted: function (session, dialogId, dialogArgs, next) {
      // Prevent dialog from being interrupted.
      session.send("Sorry... We need some information from you first.");
    }
  });


  const npsDialogName = 'npsDialog';
  npsDialog({name:npsDialogName,bot});

  const cardsDialogName = 'cardsDialog';
  cardsDialog({name:cardsDialogName,bot});

// Choose problem or feedback
  bot.dialog('ProblemOrFeedback', [
    function (session) {
      builder.Prompts.choice(session, session.userData.name + ", Вы всегда можете набрать '?' для вызова помощи.\n\nМожем предложить Вам:",
        ["Позвать оператора", "Оставить отзыв","Задать вопрос","Обучить бота","Адаптивные карточки"],
        { listStyle: builder.ListStyle.button }
        );
    },
    function (session, results, next) {
      session.dialogData.reason = results.response.entity;
      debug('Problem or feedback reason:',session.dialogData.reason);

      if(session.dialogData.reason.indexOf('отзыв') > -1)
        session.beginDialog('Отзыв');
      else if(session.dialogData.reason.indexOf('вопрос') > -1)
        session.beginDialog('Проблема');
      else if(session.dialogData.reason.indexOf('оператора') > -1){
        handoff.connectToOperator(session, next)
      }else if(session.dialogData.reason.indexOf('карточки') > -1){
        session.beginDialog(cardsDialogName);
      }else
        session.beginDialog('WIT');
    },
    function(session,results,next){
      session.endDialog('Счастливо!');
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
  ]);


  bot.dialog('commandHelper', function (session) {
      session.endDialog('reset/stop/end/bye/пока и др. - сброс диалогов, возврат в главное меню\n\n? - вызов данной подсказки');
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



/*
  const witDialogName = 'WIT';
  witDialog({name:witDialogName,bot});
  bot.dialog('Обучение', [
    function (session) {
      debug('Обучение:задайте вопрос',session.message);
      builder.Prompts.text(session,'Задайте вопрос...');
    },
    function(session, results){
      debug('Обучение:инициация WIT',results);
      session.beginDialog(witDialogName,results);
    },
    function(session, results){
      debug('Обучение:установка петли',results);
      session.replaceDialog('Обучение');
    }
  ]);
*/
  // The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
  bot.dialog('resetDialog', function (session, args, next) {
    session.replaceDialog(name);
  }).triggerAction({
      matches: /^\/?(reset|спасибо|хватит|назад|меню|пока|в начало|end|stop|thanks|thanx|bye)$/i
    });
};

module.exports = mainDialog;
