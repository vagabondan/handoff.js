"use strict";
const debug = require('debug')('bot:npsDialog');
const builder = require('botbuilder');
const azure = require('azure-storage');

module.exports = ({name,bot}) => {

  bot.dialog(name,[
    function(session,results,next){
      builder.Prompts.text(session,'Основываясь на Вашем опыте общения с МТС в сети Интернет, ' +
        'насколько вероятно, что Вы порекомендуете компанию МТС друзьям и знакомым?' +
        '\n\nПоставьте оценку от 0 до 10, где 0 – точно не порекомендую.');
    },
    function(session,results){
      if(results.response){
        session.dialogData.nps = results.response;
        if(results.response>8){
          builder.Prompts.choice(session,'Что вам больше всего понравилось при взаимодействии с МТС в социальных сетях?',
            ['Быстро ответили','Сотрудник задавал мало вопросов','Ответ был полным и понятным','Все перечисленное'],{ listStyle: builder.ListStyle.button });
        }else{
          builder.Prompts.choice(session,'Ваш вопрос был решен?',
            ['Вопрос решен','Ответ получен, но вопрос не решен'],{ listStyle: builder.ListStyle.button });
        }
      }
    },
    function(session,results){
      if(session.dialogData.nps && results.response){
        const nps = session.dialogData.nps;
        session.dialogData.responses=[];
        session.dialogData.responses.push(results.response.entity);
        const isQuestionResolved = results.response.index === 0;//'Вопрос решен'
        if(nps>8){
          session.endDialog('Спасибо за участие в опросе!');
        }else{ //nps <= 8
          if(isQuestionResolved){
            if(nps>6){
              builder.Prompts.choice(session,'Что, по вашему мнению, нам стоит улучшить?',
                ['Сократить время ответа на обращение','Повысить скорость диагностики вопроса клиента',
                  'Избегать формальных ответов','Все перечисленное'
                ],{ listStyle: builder.ListStyle.list });
            }else{// question resolved and nps <= 6
              builder.Prompts.choice(session,'С какими сложностями вы столкнулись при взаимодействии с МТС в социальных сетях?',
                [
                  'Мне пришлось очень долго ждать ответа по своему обращению',
                  'Оператор не проявил заинтересованности при решении моего вопроса',
                  'Мне предоставили формальный ответ',
                  'Все устраивает, низкая оценка была выставлена ошибочно'
                ],{ listStyle: builder.ListStyle.list });
            }
          }else{
            session.endDialog('Спасибо за участие в опросе!');
          }
        }
      }
    },
    function(session,results){
      if(results.response)
        session.dialogData.responses.push(results.response.entity);
      const tableSvc = azure.createTableService(process.env.StorageTableId, process.env.StorageTableKey);
      const tableName = 'NPSDialog';
      tableSvc.createTableIfNotExists(tableName, function(error, result, response){
        debug("Response", response);
        if(error){
          debug("Error",error);
        }

        const estimation = {
          PartitionKey: {'_':session.message.address.channelId},
          RowKey: {'_': session.message.address.id+'.'+session.message.address.conversation.id},
          ClientId: session.message.address.user.id,
          ClientName: session.message.address.user.name,
          ClientSelfName: session.userData.name,
          ClientMSISDN: session.userData.msisdn,
          NPS: session.dialogData.nps,
          Responses: session.dialogData.responses.join(),
          Locale: session.message.textLocale
        };

        tableSvc.insertEntity(tableName,estimation, {echoContent: true}, function (error, result, response) {
          debug("Response", response);
          if(error){
            debug("Error",error);
          }
          session.endDialog('Спасибо за участие в опросе!');
        });
      });
    }
  ]);



};

