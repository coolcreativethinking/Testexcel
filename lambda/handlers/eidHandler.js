'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS, BASE_AUDIO_URL } = require('../utils/constants');
const { supportsAPL, getSlotValue, sprintf } = require('../utils/helpers');
const { checkEid } = require('../services/hijriCalendarService');
const { addPlayDirective } = require('../services/audioService');

function getLocale(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  return attrs.locale || 'en';
}

function str(handlerInput, key) {
  const locale = getLocale(handlerInput);
  return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || '';
}

// Eid Takbeer audio URLs (hosted on CloudFront)
const EID_TAKBEER_URL = `${BASE_AUDIO_URL}/eid/takbeer_loop.mp3`;
const EID_TAKBEER_SHORT_URL = `${BASE_AUDIO_URL}/eid/takbeer_short.mp3`;

/**
 * PlayEidTakbeerIntent - "play Eid takbeer" / "start Eid recitation"
 * Plays looping takbeer audio (30-60 minutes) before Eid prayer.
 */
const PlayEidTakbeerIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayEidTakbeerIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const locale = getLocale(handlerInput);
    const now = new Date();

    const eidStatus = await checkEid(now, locale);

    const token = `eid-takbeer-${Date.now()}`;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.lastPlayedUrl = EID_TAKBEER_URL;
    sessionAttributes.lastPlayedToken = token;
    sessionAttributes.eidTakbeerLooping = true;
    attributesManager.setSessionAttributes(sessionAttributes);

    let speechText;
    if (eidStatus.isEid) {
      const eidName = eidStatus.eidType === 'fitr'
        ? str(handlerInput, 'EID_FITR_NAME')
        : str(handlerInput, 'EID_ADHA_NAME');
      speechText = sprintf(str(handlerInput, 'EID_TAKBEER_PLAYING'), eidName);
    } else {
      speechText = str(handlerInput, 'EID_TAKBEER_PLAYING_GENERAL');
    }

    if (supportsAPL(handlerInput)) {
      responseBuilder.addDirective(buildEidAPL(eidStatus, locale));
    }

    addPlayDirective(responseBuilder, EID_TAKBEER_URL, token, 0, 'REPLACE_ALL', {
      title: 'Eid Takbeer',
      subtitle: 'Allahu Akbar',
    });

    return responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};

/**
 * GetEidInfoIntent - "is it Eid?" / "Eid information"
 * Provides Eid status, day number, and relevant info.
 */
const GetEidInfoIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetEidInfoIntent'
    );
  },

  async handle(handlerInput) {
    const { responseBuilder } = handlerInput;
    const locale = getLocale(handlerInput);
    const now = new Date();

    const eidStatus = await checkEid(now, locale);
    let speechParts = [];

    if (eidStatus.hijriDate) {
      speechParts.push(sprintf(str(handlerInput, 'HIJRI_DATE'),
        String(eidStatus.hijriDate.day), eidStatus.hijriDate.monthName, String(eidStatus.hijriDate.year)));
    }

    if (eidStatus.isEid) {
      const eidName = eidStatus.eidType === 'fitr'
        ? str(handlerInput, 'EID_FITR_NAME')
        : str(handlerInput, 'EID_ADHA_NAME');
      speechParts.push(sprintf(str(handlerInput, 'EID_GREETING'), eidName));
      speechParts.push(sprintf(str(handlerInput, 'EID_DAY'), String(eidStatus.eidDay)));

      if (eidStatus.shouldPlayPreEidTakbeer) {
        speechParts.push(str(handlerInput, 'EID_TAKBEER_REMINDER'));
      }
      if (eidStatus.shouldPlayPostPrayerTakbeer) {
        speechParts.push(str(handlerInput, 'EID_POST_PRAYER_TAKBEER'));
      }
    } else {
      speechParts.push(str(handlerInput, 'EID_NOT_TODAY'));
    }

    return responseBuilder
      .speak(speechParts.join(''))
      .reprompt(str(handlerInput, 'REPROMPT'))
      .getResponse();
  },
};

/**
 * Build APL document for Eid display.
 */
function buildEidAPL(eidStatus, locale) {
  const eidName = eidStatus.eidType === 'fitr' ? 'Eid Al-Fitr' : 'Eid Al-Adha';
  return {
    type: 'Alexa.Presentation.APL.RenderDocument',
    token: 'eidToken',
    document: require('../apl/azanPlaybackDocument.json'),
    datasources: {
      templateData: {
        type: 'object',
        properties: {
          title: `${eidName} Mubarak`,
          subtitle: 'Takbeer',
          prayerName: 'Eid',
        },
      },
    },
  };
}

module.exports = {
  PlayEidTakbeerIntentHandler,
  GetEidInfoIntentHandler,
};
