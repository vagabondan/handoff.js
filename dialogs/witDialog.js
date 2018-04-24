"use strict";
const { WitRecognizer } = require('botbuilder-wit');
const { IntentDialog } = require('botbuilder');

const recognizer = new WitRecognizer(process.env.WitAccessToken);
const intents = new IntentDialog({recognizers: [recognizer]});
const { EntityRecognizer } = require('botbuilder');


module.exports = ({name,bot}) => {

  /**
   * Необходимые данные для идентификации причины обращения:
   * Business Directions:
   *  Topic
   *
   */

  bot.recognizer(recognizer);

  // Answer acquisition related questions like "how many companies has microsoft bought?"
  bot.dialog('acquisitionsDialog', function (session, args) {
    // Any entities recognized by LUIS will be passed in via the args.
    var entities = args.intent.entities;

    // Call common answer dialog
    session.beginDialog('answerDialog', {
      company: builder.EntityRecognizer.findEntity(entities, 'CompanyName'),
      field: 'acquisitions',
      template: 'answerAcquisitions'
    });
  }).triggerAction({ matches: 'Acquisitions' });


  intents.matches('intent.name', (session, args) => {
    const location = EntityRecognizer.findEntity(args.entities, 'location');
  });
  intents.onDefault(session => {

  });

  bot.dialog(name, intents);

  // Common answer dialog. It expects the following args:
// {
//      field: string;
//      template: string;
//      company?: IEntity;
// }
  bot.dialog('answerDialog', [
    function askCompany(session, args, next) {
      // Save args passed to dialogData which remembers them for just this answer.
      session.dialogData.args = args;

      // Validate company passed in
      var company, isValid;
      if (args.company) {
        company = args.company.entity.toLowerCase();
        isValid = companyData.hasOwnProperty(company);
      } else if (session.privateConversationData.company) {
        // Use valid company selected in previous turn
        company = session.privateConversationData.company;
        isValid = true;
      }

      // Prompt the user to pick a company if they didn't specify a valid one.
      if (!isValid) {
        // Lets see if the user just asked for a company we don't know about.
        var txt = args.company ? session.gettext('companyUnknown', { company: args.company }) : 'companyMissing';

        // Prompt the user to pick a company from the list. This will use the
        // keys of the companyData map for the choices.
        builder.Prompts.choice(session, txt, companyData);
      } else {
        // Great! pass the company to the next step in the waterfall which will answer the question.
        // * This will match the format of the response returned from Prompts.choice().
        next({ response: { entity: company } });
      }
    },
    function answerQuestion(session, results) {
      // Get args we saved away
      var args = session.dialogData.args;

      // Remember company for future turns with the user
      var company = session.privateConversationData.company = results.response.entity;

      // Reply to user with answer
      var answer = { company: company, value: companyData[company][args.field] };
      session.endDialog(args.template, answer);
    }
  ]).cancelAction('cancelAnswer', "cancelMessage", { matches: /^cancel/i });


// Alternatively, you can add a global recognizer to the bot
/*
  bot.recognizer(new WitRecognizer('Wit.ai_access_token'));
  bot.dialog('/doSomething', session => {...}).triggerAction({
    matches: 'intent.name'
  });
*/
};

