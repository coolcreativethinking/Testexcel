'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS } = require('../utils/constants');

/**
 * HelpIntent - user says "Alexa, help"
 */
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STRINGS.HELP)
      .reprompt(STRINGS.REPROMPT)
      .getResponse();
  },
};

/**
 * FallbackIntent - catches unrecognized utterances
 */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STRINGS.FALLBACK)
      .reprompt(STRINGS.REPROMPT)
      .getResponse();
  },
};

/**
 * NavigateHomeIntent - required for screen devices
 */
const NavigateHomeIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NavigateHomeIntent'
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STRINGS.WELCOME_RETURNING + STRINGS.REPROMPT)
      .reprompt(STRINGS.REPROMPT)
      .getResponse();
  },
};

/**
 * SessionEndedRequest - cleanup when session ends
 */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    const reason = handlerInput.requestEnvelope.request.reason;
    if (reason === 'ERROR') {
      const error = handlerInput.requestEnvelope.request.error;
      console.error('Session ended with error:', JSON.stringify(error));
    }
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * Global error handler - catches any unhandled errors
 */
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Unhandled error:', error.message);
    console.error('Error stack:', error.stack);

    return handlerInput.responseBuilder
      .speak(STRINGS.ERROR)
      .reprompt(STRINGS.REPROMPT)
      .getResponse();
  },
};

module.exports = {
  HelpIntentHandler,
  FallbackIntentHandler,
  NavigateHomeIntentHandler,
  SessionEndedRequestHandler,
  ErrorHandler,
};
