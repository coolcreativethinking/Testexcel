'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS, CALCULATION_METHODS } = require('../utils/constants');
const { sprintf, getSlotValue, normalizeMethodName } = require('../utils/helpers');
const { resolveCity } = require('../services/locationService');

/**
 * Handles SetCityIntent - "set my city to London"
 *
 * Geocodes the city to lat/lng and saves to persistent storage.
 */
const SetCityIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetCityIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const cityName = getSlotValue(handlerInput, 'CityName');

    if (!cityName) {
      return responseBuilder
        .speak('I didn\'t catch the city name. Please say "set my city to" followed by your city.')
        .reprompt('Which city are you in?')
        .getResponse();
    }

    try {
      // Geocode the city
      const location = await resolveCity(cityName);

      // Save to persistent attributes
      let userSettings;
      try {
        userSettings = await attributesManager.getPersistentAttributes();
      } catch (e) {
        userSettings = {};
      }

      userSettings.city = location.city;
      userSettings.country = location.country;
      userSettings.latitude = location.latitude;
      userSettings.longitude = location.longitude;
      userSettings.timezone = location.timezone;

      // Preserve existing method or set default
      if (!userSettings.calculationMethod) {
        userSettings.calculationMethod = 'ISNA';
      }

      attributesManager.setPersistentAttributes(userSettings);
      await attributesManager.savePersistentAttributes();

      let speechText = sprintf(STRINGS.CITY_SET, cityName);
      speechText += 'You can now say "play the Azan" or "what are today\'s prayer times".';

      // Suggest setting up routines
      speechText += ' ' + STRINGS.ROUTINE_SUGGESTION;

      return responseBuilder
        .speak(speechText)
        .reprompt(STRINGS.REPROMPT)
        .getResponse();
    } catch (error) {
      console.error('Error setting city:', error);
      return responseBuilder
        .speak(`I couldn't find the city "${cityName}". Please try a different city name.`)
        .reprompt('Which city are you in?')
        .getResponse();
    }
  },
};

/**
 * Handles SetMethodIntent - "set calculation method to ISNA"
 */
const SetMethodIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetMethodIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const methodInput = getSlotValue(handlerInput, 'MethodName');

    const methodKey = normalizeMethodName(methodInput);

    if (!methodKey || !CALCULATION_METHODS[methodKey]) {
      const available = Object.values(CALCULATION_METHODS)
        .map((m) => m.label)
        .join(', ');
      return responseBuilder
        .speak(`I didn't recognize that method. Available methods are: ${available}.`)
        .reprompt('Which calculation method would you like to use?')
        .getResponse();
    }

    let userSettings;
    try {
      userSettings = await attributesManager.getPersistentAttributes();
    } catch (e) {
      userSettings = {};
    }

    userSettings.calculationMethod = methodKey;
    attributesManager.setPersistentAttributes(userSettings);
    await attributesManager.savePersistentAttributes();

    const methodLabel = CALCULATION_METHODS[methodKey].label;
    const speechText = sprintf(STRINGS.METHOD_SET, methodLabel);

    return responseBuilder
      .speak(speechText + STRINGS.REPROMPT)
      .reprompt(STRINGS.REPROMPT)
      .getResponse();
  },
};

module.exports = {
  SetCityIntentHandler,
  SetMethodIntentHandler,
};
