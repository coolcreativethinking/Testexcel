'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS } = require('../utils/constants');
const { supportsAPL, formatTime, sprintf, getNextPrayer } = require('../utils/helpers');
const { getPrayerTimes } = require('../services/prayerTimeService');
const { getDeviceAddress } = require('../services/locationService');

/**
 * Handles LaunchRequest - when user says "Alexa, open My Azan"
 *
 * For new users: prompts to set city
 * For returning users: announces next prayer time
 * For Routine-triggered launches: plays the Azan immediately
 */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    let sessionAttributes = attributesManager.getSessionAttributes();

    // Load persistent attributes (user settings)
    let userSettings;
    try {
      userSettings = await attributesManager.getPersistentAttributes();
    } catch (e) {
      userSettings = {};
    }

    // New user - no city set yet
    if (!userSettings.city && !userSettings.latitude) {
      // Try to get city from device address
      const address = await getDeviceAddress(handlerInput);
      if (address && address.city) {
        userSettings.city = address.city;
        userSettings.country = address.countryCode;
        attributesManager.setPersistentAttributes(userSettings);
        await attributesManager.savePersistentAttributes();
      } else {
        let speechText = STRINGS.WELCOME_NEW_USER;

        if (supportsAPL(handlerInput)) {
          responseBuilder.addDirective(buildWelcomeAPL());
        }

        return responseBuilder
          .speak(speechText)
          .reprompt('Please tell me your city. Say "set my city to" followed by your city name.')
          .getResponse();
      }
    }

    // Returning user - get prayer times and announce next prayer
    let speechText = STRINGS.WELCOME_RETURNING;

    try {
      const now = new Date();
      const result = await getPrayerTimes(userSettings, now);
      const nextPrayer = getNextPrayer(result.times, now);

      if (nextPrayer && nextPrayer.time) {
        speechText += sprintf(STRINGS.NEXT_PRAYER, nextPrayer.name, formatTime(nextPrayer.time));
      }

      speechText += 'You can say "play the Azan" or "what are today\'s prayer times".';

      // Store prayer times in session for subsequent requests
      sessionAttributes.prayerTimes = {};
      for (const [key, value] of Object.entries(result.times)) {
        if (value instanceof Date) {
          sessionAttributes.prayerTimes[key] = value.toISOString();
        } else {
          sessionAttributes.prayerTimes[key] = value;
        }
      }
      sessionAttributes.city = result.city;
      attributesManager.setSessionAttributes(sessionAttributes);

      if (supportsAPL(handlerInput)) {
        responseBuilder.addDirective(buildPrayerTimesAPL(result.times, result.city));
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      speechText += 'I had trouble getting prayer times. ' + STRINGS.REPROMPT;
    }

    return responseBuilder
      .speak(speechText)
      .reprompt(STRINGS.REPROMPT)
      .getResponse();
  },
};

/**
 * Build a simple welcome APL directive for new users.
 */
function buildWelcomeAPL() {
  return {
    type: 'Alexa.Presentation.APL.RenderDocument',
    token: 'welcomeToken',
    document: require('../apl/launchDocument.json'),
    datasources: {
      templateData: {
        type: 'object',
        properties: {
          title: 'My Azan',
          subtitle: 'Islamic Prayer Times & Azan',
          message: 'Say "set my city to London" to get started',
        },
      },
    },
  };
}

/**
 * Build a prayer times APL directive for returning users.
 */
function buildPrayerTimesAPL(times, city) {
  const prayerData = {};
  for (const [key, value] of Object.entries(times)) {
    if (value instanceof Date) {
      prayerData[key] = formatTime(value);
    } else if (typeof value === 'string' && value.includes(':')) {
      prayerData[key] = value;
    }
  }

  return {
    type: 'Alexa.Presentation.APL.RenderDocument',
    token: 'prayerTimesToken',
    document: require('../apl/prayerTimesDocument.json'),
    datasources: {
      templateData: {
        type: 'object',
        properties: {
          title: 'Prayer Times',
          city: city || 'Your City',
          prayers: prayerData,
        },
      },
    },
  };
}

module.exports = { LaunchRequestHandler };
