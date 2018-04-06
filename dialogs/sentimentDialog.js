"use strict";
const builder_cognitiveservices = require('botbuilder-cognitiveservices');
const debug = require('debug')('bot:sentimentDialog');
let https = require ('https');
const azure = require('azure-storage');


module.exports = ({name,bot}) => {

// **********************************************
// *** Update or verify the following values. ***
// **********************************************

// Replace the accessKey string value with your valid access key.
  let accessKey = process.env.CognitiveServicesKey;

// Replace or verify the region.

// You must use the same region in your REST API call as you used to obtain your access keys.
// For example, if you obtained your access keys from the westus region, replace
// "westcentralus" in the URI below with "westus".

// NOTE: Free trial access keys are generated in the westcentralus region, so if you are using
// a free trial access key, you should not need to change this region.
  let uri = 'westcentralus.api.cognitive.microsoft.com';
  let path = '/text/analytics/v2.0/sentiment';

  bot.dialog(name,[
    function(session,result){

      debug('result: ',result);
      if(result === undefined) session.endDialog();

      let documents = { 'documents': [
          { 'id': '1', 'language': 'ru', 'text': result.response}
        ]};

      get_sentiments (documents,session);
      //session.send('Спасибо, что оценили нас!');
    }
  ]);


  const get_response_handler = (session) => {
    return function (response) {
      let body = '';
      response.on ('data', function (d) {
        body += d;
      });
      response.on ('end', function () {
        let body_ = JSON.parse (body);
        let jsonBody = JSON.stringify (body_, null, '  ');
        console.log (jsonBody);
        const full_score = body_.documents[0].score;
        const score = Number((body_.documents[0].score).toFixed(2));
        debug('score: ',score);
        if(score < 0.4){
          session.send('Оценка: ' + score + '. Сожалеем :( И приложим все усилия, чтобы изменить ваше мнение о нас к лучшему!').endDialog()
        }else if(score < 0.7){
          session.send('Оценка: ' + score + '. Благодарим за обращение! Мы стремимся постоянно повышать качество сервиса для наших клиентов. Ждем Вас снова!').endDialog()
        }else{
          session.send('Оценка: ' + score + '. Спасибо за высокую оценку нашей работы! Мы стремимся постоянно повышать качество сервиса для наших клиентов. Ждем Вас снова!').endDialog()
        }
        const tableSvc = azure.createTableService(process.env.StorageTableId,
          process.env.StorageTableKey);
        const tableName = 'CustomerFeedback';
        tableSvc.createTableIfNotExists(tableName, function(error, result, response){
          debug("Response", response);
          if(!error){
            debug("Error",error);
          }

          const estimation = {
            PartitionKey: {'_':session.message.address.channelId},
            RowKey: {'_': session.message.address.id+'.'+session.message.address.conversation.id},
            ClientId: session.message.address.user.id,
            ClientName: session.message.address.user.name,
            Score: full_score,
            Locale: session.message.textLocale,
            Text: session.message.text
          };

          tableSvc.insertEntity(tableName,estimation, {echoContent: true}, function (error, result, response) {
            debug("Response", response);
            if(!error){
              debug("Error",error);
            }
          });
        });

      });
      response.on ('error', function (e) {
        console.log ('Error: ' + e.message);
      });
    };
  }



  let get_sentiments = function (documents,session) {
    let body = JSON.stringify (documents);

    let request_params = {
      method : 'POST',
      hostname : uri,
      path : path,
      headers : {
        'Ocp-Apim-Subscription-Key' : accessKey,
      }
    };

    let req = https.request (request_params, get_response_handler(session));
    req.write (body);
    req.end ();
  }

};

