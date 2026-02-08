'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS } = require('../utils/constants');
const { sprintf, formatTime, getSlotValue } = require('../utils/helpers');
const { checkRamadan, calculateImsakTime, getHijriDate } = require('../services/hijriCalendarService');
const { getPrayerTimes } = require('../services/prayerTimeService');
const { getRamadanRecitals } = require('../services/audioService');
const { getPreAzanRecitationUrls, getSurahAudioUrl } = require('../services/quranService');

function getLocale(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  return attrs.locale || 'en';
}

function str(handlerInput, key) {
  const locale = getLocale(handlerInput);
  return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || '';
}

/**
 * SetTaraweehIntent - "set Taraweeh time to 11 PM"
 * Mosque-specific Taraweeh / late night Ramadan prayer time.
 */
const SetTaraweehIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetTaraweehIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const timeSlot = getSlotValue(handlerInput, 'TaraweehTime');

    if (!timeSlot) {
      return responseBuilder
        .speak('Please specify the Taraweeh time. For example, say "set Taraweeh time to 11 PM" or "set Taraweeh to 1 AM".')
        .reprompt(str(handlerInput, 'REPROMPT'))
        .getResponse();
    }

    let userSettings;
    try { userSettings = await attributesManager.getPersistentAttributes(); } catch (e) { userSettings = {}; }

    userSettings.taraweehTime = timeSlot;
    attributesManager.setPersistentAttributes(userSettings);
    await attributesManager.savePersistentAttributes();

    return responseBuilder
      .speak(sprintf(str(handlerInput, 'TARAWEEH_SET'), timeSlot))
      .reprompt(str(handlerInput, 'REPROMPT'))
      .getResponse();
  },
};

/**
 * PlayQuranIntent - "read Quran before the Azan" / "play Surah Al-Fatiha"
 * Plays Quran recitation via the AudioPlayer.
 */
const PlayQuranIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayQuranIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;

    let userSettings;
    try { userSettings = await attributesManager.getPersistentAttributes(); } catch (e) { userSettings = {}; }

    const surahSlot = getSlotValue(handlerInput, 'SurahNumber');
    const reciter = userSettings.preAzanQuranReciter || 'ar.alafasy';

    let audioUrl;
    let speechText;

    if (surahSlot) {
      const surahNum = parseInt(surahSlot, 10);
      if (surahNum >= 1 && surahNum <= 114) {
        audioUrl = getSurahAudioUrl(surahNum, reciter);
        speechText = sprintf(str(handlerInput, 'QURAN_PLAYING'), String(surahNum), 'all');
      } else {
        return responseBuilder
          .speak('Surah number must be between 1 and 114.')
          .reprompt(str(handlerInput, 'REPROMPT'))
          .getResponse();
      }
    } else {
      // Play a short random surah for pre-Azan recitation
      const urls = getPreAzanRecitationUrls(reciter);
      audioUrl = urls[0];
      speechText = 'Playing Quran recitation.';

      // Store the playlist for chaining
      const sessionAttributes = attributesManager.getSessionAttributes();
      sessionAttributes.quranPlaylist = urls;
      sessionAttributes.quranPlaylistIndex = 0;
      attributesManager.setSessionAttributes(sessionAttributes);
    }

    const token = `quran-${Date.now()}`;
    responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', audioUrl, token, 0, null, {
      title: 'Quran Recitation',
      subtitle: 'Pre-Azan',
    });

    return responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};

/**
 * GetRamadanInfoIntent - "what day of Ramadan is it?" / "Ramadan information"
 * Provides Hijri date, Ramadan day, Iftar/Suhoor times, and Taraweeh info.
 */
const GetRamadanInfoIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetRamadanInfoIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const locale = getLocale(handlerInput);

    let userSettings;
    try { userSettings = await attributesManager.getPersistentAttributes(); } catch (e) { userSettings = {}; }

    const now = new Date();
    let speechParts = [];

    try {
      const hijriDate = await getHijriDate(now, locale);
      speechParts.push(sprintf(str(handlerInput, 'HIJRI_DATE'), String(hijriDate.day), hijriDate.monthName, String(hijriDate.year)));

      if (hijriDate.isRamadan) {
        speechParts.push(str(handlerInput, 'RAMADAN_GREETING'));
        speechParts.push(`Day ${hijriDate.day} of Ramadan. `);

        if (userSettings.city || userSettings.latitude) {
          const prayerResult = await getPrayerTimes(userSettings, now);
          const t = prayerResult.times;

          // Iftar = Maghrib
          const maghribTime = t.Maghrib instanceof Date ? formatTime(t.Maghrib) : t.Maghrib;
          speechParts.push(sprintf(str(handlerInput, 'RAMADAN_IFTAR'), maghribTime));

          // Imsak = ~10 min before Fajr
          if (t.Fajr) {
            const fajrDate = t.Fajr instanceof Date ? t.Fajr : null;
            if (fajrDate) {
              const imsak = calculateImsakTime(fajrDate, 10);
              speechParts.push(sprintf(str(handlerInput, 'RAMADAN_SUHOOR_ENDS'), formatTime(imsak)));
            }
          }

          if (userSettings.taraweehTime) {
            speechParts.push(`Taraweeh at your mosque is at ${userSettings.taraweehTime}. `);
          }

          // Ramadan recitals available for this country
          const country = userSettings.country || '';
          const preMaghrib = getRamadanRecitals('preMaghrib', country, locale);
          const preFajr = getRamadanRecitals('preFajr', country, locale);
          if (preMaghrib.length > 0 || preFajr.length > 0) {
            speechParts.push('Special Ramadan recitals are available. ');
          }
        }
      } else {
        if (hijriDate.holidays && hijriDate.holidays.length > 0) {
          speechParts.push(`Today's occasion: ${hijriDate.holidays.join(', ')}. `);
        }
      }
    } catch (error) {
      console.error('Error getting Ramadan info:', error);
      speechParts.push(str(handlerInput, 'ERROR'));
    }

    return responseBuilder
      .speak(speechParts.join(''))
      .reprompt(str(handlerInput, 'REPROMPT'))
      .getResponse();
  },
};

/**
 * TogglePreAzanQuranIntent - "enable Quran before Azan" / "disable pre-Azan Quran"
 */
const TogglePreAzanQuranIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'TogglePreAzanQuranIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const toggle = getSlotValue(handlerInput, 'ToggleState');

    let userSettings;
    try { userSettings = await attributesManager.getPersistentAttributes(); } catch (e) { userSettings = {}; }

    const enable = !toggle || ['on', 'enable', 'yes', 'true'].includes((toggle || '').toLowerCase());

    userSettings.preAzanQuranEnabled = enable;
    attributesManager.setPersistentAttributes(userSettings);
    await attributesManager.savePersistentAttributes();

    const status = enable ? 'enabled' : 'disabled';
    return responseBuilder
      .speak(`Pre-Azan Quran recitation has been ${status}. `)
      .reprompt(str(handlerInput, 'REPROMPT'))
      .getResponse();
  },
};

module.exports = {
  SetTaraweehIntentHandler,
  PlayQuranIntentHandler,
  GetRamadanInfoIntentHandler,
  TogglePreAzanQuranIntentHandler,
};
