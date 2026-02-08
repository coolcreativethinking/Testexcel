'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS, BASE_AUDIO_URL, KHUTBAH_SOURCES } = require('../utils/constants');
const { supportsAPL, getSlotValue, sprintf } = require('../utils/helpers');
const { addPlayDirective } = require('../services/audioService');
const { isFriday } = require('../services/hijriCalendarService');

function getLocale(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  return attrs.locale || 'en';
}

function str(handlerInput, key) {
  const locale = getLocale(handlerInput);
  return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || '';
}

/**
 * PlayKhutbahIntent - "play Friday khutbah" / "listen to khutbah from Makkah"
 * Plays a Friday sermon broadcast or saved recording.
 */
const PlayKhutbahIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayKhutbahIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const locale = getLocale(handlerInput);
    const now = new Date();

    const sourceSlot = getSlotValue(handlerInput, 'KhutbahSource');

    // Resolve the khutbah source
    let sourceId = 'makkah'; // default
    if (sourceSlot) {
      const normalized = sourceSlot.toLowerCase().replace(/[^a-z]/g, '');
      if (normalized.includes('egypt') || normalized.includes('cairo') || normalized.includes('azhar')) {
        sourceId = 'egypt';
      } else if (normalized.includes('uae') || normalized.includes('dubai') || normalized.includes('emirates')) {
        sourceId = 'uae';
      } else if (normalized.includes('madinah') || normalized.includes('medina')) {
        sourceId = 'madinah';
      }
    }

    const source = KHUTBAH_SOURCES[sourceId] || KHUTBAH_SOURCES.makkah;
    const sourceName = locale === 'ar' ? source.nameAr : locale === 'fr' ? source.nameFr : source.name;

    // Check if it's Friday for live broadcast
    const friday = isFriday(now);
    let audioUrl;
    let speechText;

    if (friday && source.liveStreamUrl) {
      audioUrl = source.liveStreamUrl;
      speechText = sprintf(str(handlerInput, 'KHUTBAH_LIVE'), sourceName);
    } else {
      // Play latest saved khutbah
      audioUrl = source.latestRecordingUrl;
      speechText = sprintf(str(handlerInput, 'KHUTBAH_SAVED'), sourceName);
    }

    const token = `khutbah-${sourceId}-${Date.now()}`;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.lastPlayedUrl = audioUrl;
    sessionAttributes.lastPlayedToken = token;
    attributesManager.setSessionAttributes(sessionAttributes);

    if (supportsAPL(handlerInput)) {
      responseBuilder.addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'khutbahToken',
        document: require('../apl/azanPlaybackDocument.json'),
        datasources: {
          templateData: {
            type: 'object',
            properties: {
              title: 'Friday Khutbah',
              subtitle: sourceName,
              prayerName: 'Jummah',
            },
          },
        },
      });
    }

    addPlayDirective(responseBuilder, audioUrl, token, 0, 'REPLACE_ALL', {
      title: 'Friday Khutbah',
      subtitle: sourceName,
    });

    return responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};

module.exports = {
  PlayKhutbahIntentHandler,
};
