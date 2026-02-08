'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS, AZAN_RECITERS } = require('../utils/constants');
const {
  supportsAPL,
  getSlotValue,
  normalizePrayerName,
  determineCurrentPrayer,
  sprintf,
} = require('../utils/helpers');
const { getPrayerTimes } = require('../services/prayerTimeService');
const { getAzanUrl, addPlayDirective } = require('../services/audioService');
const { checkRamadan, checkEid } = require('../services/hijriCalendarService');
const { getPreAzanRecitationUrls } = require('../services/quranService');
const { EID_AUDIO } = require('../utils/constants');

function getLocale(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  return attrs.locale || 'en';
}

function str(handlerInput, key) {
  const locale = getLocale(handlerInput);
  return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || '';
}

/**
 * Handles PlayAzanIntent - when user says "play the Azan" or "play Fajr Azan"
 *
 * Uses AudioPlayer interface for full-duration Azan playback (~2 minutes).
 * If pre-Azan Quran is enabled and it's the right context, chains Quran + Azan.
 * Uses the user's selected reciter and speed.
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

    // Determine which prayer's Azan to play
    let prayerName = normalizePrayerName(getSlotValue(handlerInput, 'PrayerName'));

    if (!prayerName && userSettings.city) {
      try {
        const now = new Date();
        const result = await getPrayerTimes(userSettings, now);
        prayerName = determineCurrentPrayer(result.times, now);
      } catch (e) {
        prayerName = 'Dhuhr';
      }
    } else if (!prayerName) {
      prayerName = 'Dhuhr';
    }

    // Get the audio URL using user's reciter and speed preferences
    const azanUrl = getAzanUrl(prayerName, userSettings);
    const token = `azan-${prayerName.toLowerCase()}-${Date.now()}`;

    // Build speech
    const reciter = AZAN_RECITERS[userSettings.azanReciter || 'makkah'];
    const locale = getLocale(handlerInput);
    const reciterName = locale === 'ar' ? reciter.nameAr : locale === 'fr' ? reciter.nameFr : reciter.name;
    let speechText = sprintf(str(handlerInput, 'PLAY_AZAN_FOR'), prayerName);

    // Check if pre-Azan Quran recitation is enabled
    if (userSettings.preAzanQuranEnabled) {
      try {
        const ramadan = await checkRamadan(new Date(), locale);
        // Play Quran before Azan during Ramadan, or always if user enabled it
        const quranReciter = userSettings.preAzanQuranReciter || 'ar.alafasy';
        const quranUrls = getPreAzanRecitationUrls(quranReciter);

        if (quranUrls.length > 0) {
          // Store Azan URL to play after Quran finishes
          const sessionAttributes = attributesManager.getSessionAttributes();
          sessionAttributes.pendingAzanUrl = azanUrl;
          sessionAttributes.pendingAzanToken = token;
          sessionAttributes.quranPlaylist = quranUrls;
          sessionAttributes.quranPlaylistIndex = 0;
          sessionAttributes.lastPlayedUrl = azanUrl;
          attributesManager.setSessionAttributes(sessionAttributes);

          // Start with Quran
          const quranToken = `quran-pre-azan-${Date.now()}`;
          responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', quranUrls[0], quranToken, 0, null, {
            title: 'Quran Recitation',
            subtitle: 'Before Azan',
          });

          speechText = 'Playing Quran recitation followed by the Azan.';

          if (supportsAPL(handlerInput)) {
            responseBuilder.addDirective(buildAzanPlaybackAPL(prayerName, reciterName));
          }

          return responseBuilder
            .speak(speechText)
            .withShouldEndSession(true)
            .getResponse();
        }
      } catch (e) {
        console.log('Pre-Azan Quran error, proceeding with Azan only:', e.message);
      }
    }

    // Check if we should queue post-prayer Eid takbeer
    try {
      const eidStatus = await checkEid(new Date(), locale);
      if (eidStatus.shouldPlayPostPrayerTakbeer) {
        const sa = attributesManager.getSessionAttributes();
        sa.pendingPostPrayerTakbeer = true;
        sa.pendingPostPrayerTakbeerUrl = EID_AUDIO.takbeerPostPrayer;
        attributesManager.setSessionAttributes(sa);
      }
    } catch (e) {
      console.log('Eid check error:', e.message);
    }

    // Save playback state
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.lastPlayedPrayer = prayerName;
    sessionAttributes.lastPlayedUrl = azanUrl;
    sessionAttributes.lastPlayedToken = token;
    attributesManager.setSessionAttributes(sessionAttributes);

    if (supportsAPL(handlerInput)) {
      responseBuilder.addDirective(buildAzanPlaybackAPL(prayerName, reciterName));
    }

    addPlayDirective(responseBuilder, azanUrl, token, 0);

    return responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};

function buildAzanPlaybackAPL(prayerName, reciterName) {
  return {
    type: 'Alexa.Presentation.APL.RenderDocument',
    token: 'azanPlaybackToken',
    document: require('../apl/azanPlaybackDocument.json'),
    datasources: {
      templateData: {
        type: 'object',
        properties: {
          title: `${prayerName} Azan`,
          subtitle: reciterName || 'Call to Prayer',
          prayerName: prayerName,
        },
      },
    },
  };
}

module.exports = { PlayAzanIntentHandler };
