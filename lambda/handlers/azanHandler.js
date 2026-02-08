'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS } = require('../utils/constants');
const {
  supportsAPL,
  getSlotValue,
  normalizePrayerName,
  determineCurrentPrayer,
  sprintf,
} = require('../utils/helpers');
const { getPrayerTimes } = require('../services/prayerTimeService');
const { getAzanUrl, addPlayDirective } = require('../services/audioService');

/**
 * Handles PlayAzanIntent - when user says "play the Azan" or "play Fajr Azan"
 *
 * Uses AudioPlayer interface for full-duration Azan playback (~2 minutes).
 * If no specific prayer is named, determines the closest prayer based on current time.
 */
const PlayAzanIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayAzanIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;

    let userSettings;
    try {
      userSettings = await attributesManager.getPersistentAttributes();
    } catch (e) {
      userSettings = {};
    }

    // Get the prayer name from the slot (if provided)
    let prayerName = normalizePrayerName(getSlotValue(handlerInput, 'PrayerName'));

    // If no prayer specified, determine from current time
    if (!prayerName && userSettings.city) {
      try {
        const now = new Date();
        const result = await getPrayerTimes(userSettings, now);
        prayerName = determineCurrentPrayer(result.times, now);
      } catch (e) {
        prayerName = 'Dhuhr'; // fallback
      }
    } else if (!prayerName) {
      prayerName = 'Dhuhr'; // fallback when no city is set
    }

    // Get the audio URL for this prayer
    const azanUrl = getAzanUrl(prayerName, userSettings.azanSound);
    const token = `azan-${prayerName.toLowerCase()}-${Date.now()}`;

    // Speak a brief intro, then play the Azan via AudioPlayer
    const speechText = sprintf(STRINGS.PLAY_AZAN_FOR, prayerName);

    // Save playback state
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.lastPlayedPrayer = prayerName;
    sessionAttributes.lastPlayedUrl = azanUrl;
    sessionAttributes.lastPlayedToken = token;
    attributesManager.setSessionAttributes(sessionAttributes);

    // Add APL visual if device has a screen
    if (supportsAPL(handlerInput)) {
      responseBuilder.addDirective(buildAzanPlaybackAPL(prayerName));
    }

    // Use AudioPlayer for full-length playback
    addPlayDirective(responseBuilder, azanUrl, token, 0);

    return responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};

/**
 * Build APL directive for Azan playback screen.
 */
function buildAzanPlaybackAPL(prayerName) {
  return {
    type: 'Alexa.Presentation.APL.RenderDocument',
    token: 'azanPlaybackToken',
    document: require('../apl/azanPlaybackDocument.json'),
    datasources: {
      templateData: {
        type: 'object',
        properties: {
          title: `${prayerName} Azan`,
          subtitle: 'Call to Prayer',
          prayerName: prayerName,
        },
      },
    },
  };
}

module.exports = { PlayAzanIntentHandler };
