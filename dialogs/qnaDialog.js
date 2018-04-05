"use strict";
const builder_cognitiveservices = require('botbuilder-cognitiveservices');
const debug = require('debug')('bot:qnaDialog');


module.exports = ({name,bot}) => {

  const recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,
    subscriptionKey: process.env.QnASubscriptionKey
  });

  const basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'К сожалению, информация по вашему запросу не найдена. Попробуйте перефразировать.',
    qnaThreshold: 0.3}
  );

  basicQnAMakerDialog.respondFromQnAMakerResult = function(session, qnaMakerResult){
    debug('response: ',qnaMakerResult);
    debug('session.message object:',session.message);
    // Save the question
    const question = session.message.text;
    session.conversationData.userQuestion = question;

    session.send(qnaMakerResult.answers[0].answer).endDialog();
  }

  bot.dialog(name, basicQnAMakerDialog);

};

