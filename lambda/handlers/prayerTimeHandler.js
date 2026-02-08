'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS } = require('../utils/constants');
const {
  supportsAPL,
  formatTime,
  formatTimeString,
  sprintf,
  getSlotValue,
  normalizePrayerName,
  getNextPrayer,
} = require('../utils/helpers');
const { getPrayerTimes } = require('../services/prayerTimeService');

/**
 * Handles GetPrayerTimeIntent - "what time is Fajr?" or "when is the next prayer?"
 */
const GetPrayerTimeIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetPrayerTimeIntent'
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

    if (!userSettings.city && !userSettings.latitude) {
      return responseBuilder
        .speak(STRINGS.CITY_NOT_SET)
        .reprompt(STRINGS.CITY_NOT_SET)
        .getResponse();
    }

    // Check if user asked for a specific prayer or "next prayer"
    const prayerNameInput = getSlotValue(handlerInput, 'PrayerName');
    const prayerName = normalizePrayerName(prayerNameInput);
    const cityOverride = getSlotValue(handlerInput, 'CityName');

    const settings = cityOverride
      ? { ...userSettings, city: cityOverride, latitude: null, longitude: null }
      : userSettings;

    try {
      const now = new Date();
      const result = await getPrayerTimes(settings, now);
      let speechText;

      if (prayerName) {
        // User asked for a specific prayer
        const time = result.times[prayerName];
        if (time) {
          const timeStr = time instanceof Date ? formatTime(time) : formatTimeString(time);
          speechText = sprintf(STRINGS.PRAYER_TIME, prayerName, timeStr);
        } else {
          speechText = `I couldn't find the time for ${prayerName} prayer.`;
        }
      } else {
        // User asked for "next prayer"
        const next = getNextPrayer(result.times, now);
        if (next && next.time) {
          const timeStr = next.time instanceof Date ? formatTime(next.time) : formatTimeString(next.time);
          speechText = sprintf(STRINGS.NEXT_PRAYER, next.name, timeStr);
        } else {
          speechText = "All prayers for today have passed. The next prayer is tomorrow's Fajr.";
        }
      }

      return responseBuilder
        .speak(speechText)
        .reprompt(STRINGS.REPROMPT)
        .getResponse();
    } catch (error) {
      console.error('Error getting prayer time:', error);
      return responseBuilder
        .speak(STRINGS.ERROR)
        .reprompt(STRINGS.REPROMPT)
        .getResponse();
    }
  },
};

/**
 * Handles GetAllPrayerTimesIntent - "what are today's prayer times?"
 */
const GetAllPrayerTimesIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetAllPrayerTimesIntent'
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

    if (!userSettings.city && !userSettings.latitude) {
      return responseBuilder
        .speak(STRINGS.CITY_NOT_SET)
        .reprompt(STRINGS.CITY_NOT_SET)
        .getResponse();
    }

    const cityOverride = getSlotValue(handlerInput, 'CityName');
    const settings = cityOverride
      ? { ...userSettings, city: cityOverride, latitude: null, longitude: null }
      : userSettings;

    try {
      const now = new Date();
      const result = await getPrayerTimes(settings, now);
      const t = result.times;

      const fmt = (val) => (val instanceof Date ? formatTime(val) : formatTimeString(val));

      const speechText = sprintf(
        STRINGS.ALL_PRAYER_TIMES,
        result.city,
        fmt(t.Fajr),
        fmt(t.Sunrise),
        fmt(t.Dhuhr),
        fmt(t.Asr),
        fmt(t.Maghrib),
        fmt(t.Isha)
      );

      if (supportsAPL(handlerInput)) {
        const prayerData = {};
        for (const [key, value] of Object.entries(t)) {
          if (value instanceof Date || (typeof value === 'string' && value.includes(':'))) {
            prayerData[key] = fmt(value);
          }
        }

        responseBuilder.addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          token: 'prayerTimesToken',
          document: require('../apl/prayerTimesDocument.json'),
          datasources: {
            templateData: {
              type: 'object',
              properties: {
                title: 'Prayer Times',
                city: result.city,
                prayers: prayerData,
              },
            },
          },
        });
      }

      return responseBuilder
        .speak(speechText)
        .reprompt(STRINGS.REPROMPT)
        .getResponse();
    } catch (error) {
      console.error('Error getting prayer times:', error);
      return responseBuilder
        .speak(STRINGS.ERROR)
        .reprompt(STRINGS.REPROMPT)
        .getResponse();
    }
  },
};

module.exports = {
  GetPrayerTimeIntentHandler,
  GetAllPrayerTimesIntentHandler,
};
