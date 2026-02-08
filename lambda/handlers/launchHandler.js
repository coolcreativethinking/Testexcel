'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS, DEFAULT_IQAMA_OFFSETS, AZAN_PRAYERS } = require('../utils/constants');
const { supportsAPL, formatTime, sprintf, getNextPrayer } = require('../utils/helpers');
const { getPrayerTimes } = require('../services/prayerTimeService');
const { getDeviceAddress } = require('../services/locationService');
const { checkRamadan, calculateImsakTime, getHijriDate } = require('../services/hijriCalendarService');

function getLocale(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  return attrs.locale || 'en';
}

function str(handlerInput, key) {
  const locale = getLocale(handlerInput);
  return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || '';
}

/**
 * Handles LaunchRequest - when user says "Alexa, open My Azan"
 *
 * Hijri/Ramadan aware. Shows Iqama times. Displays Fajr end time (Sunrise).
 */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    let sessionAttributes = attributesManager.getSessionAttributes();

    let userSettings;
    try {
      userSettings = await attributesManager.getPersistentAttributes();
    } catch (e) {
      userSettings = {};
    }

    // Set locale in session
    sessionAttributes.locale = userSettings.locale || 'en';
    attributesManager.setSessionAttributes(sessionAttributes);

    // New user - no city set yet
    if (!userSettings.city && !userSettings.latitude) {
      const address = await getDeviceAddress(handlerInput);
      if (address && address.city) {
        userSettings.city = address.city;
        userSettings.country = address.countryCode;
        attributesManager.setPersistentAttributes(userSettings);
        await attributesManager.savePersistentAttributes();
      } else {
        if (supportsAPL(handlerInput)) {
          responseBuilder.addDirective(buildWelcomeAPL());
        }
        return responseBuilder
          .speak(str(handlerInput, 'WELCOME_NEW_USER'))
          .reprompt('Please tell me your city. Say "set my city to" followed by your city name.')
          .getResponse();
      }
    }

    // Returning user
    const locale = getLocale(handlerInput);
    let speechParts = [str(handlerInput, 'WELCOME_RETURNING')];
    const now = new Date();

    // Get Hijri date and Ramadan status
    let hijriDate = null;
    let isRamadan = false;
    try {
      hijriDate = await getHijriDate(now, locale);
      isRamadan = hijriDate.isRamadan;
      speechParts.push(sprintf(str(handlerInput, 'HIJRI_DATE'), String(hijriDate.day), hijriDate.monthName, String(hijriDate.year)));
      if (isRamadan) {
        speechParts.push(str(handlerInput, 'RAMADAN_GREETING'));
      }
    } catch (e) {
      console.log('Hijri date fetch failed:', e.message);
    }

    try {
      const result = await getPrayerTimes(userSettings, now);
      const t = result.times;
      const nextPrayer = getNextPrayer(t, now);

      if (nextPrayer && nextPrayer.time) {
        const nextTimeStr = nextPrayer.time instanceof Date ? formatTime(nextPrayer.time) : nextPrayer.time;
        speechParts.push(sprintf(str(handlerInput, 'NEXT_PRAYER'), nextPrayer.name, nextTimeStr));

        // Announce Iqama time for next prayer
        const iqamaOffsets = userSettings.iqamaOffsets || DEFAULT_IQAMA_OFFSETS;
        if (nextPrayer.time instanceof Date && iqamaOffsets[nextPrayer.name]) {
          const iqamaTime = new Date(nextPrayer.time.getTime() + iqamaOffsets[nextPrayer.name] * 60000);
          speechParts.push(sprintf(str(handlerInput, 'NEXT_PRAYER_IQAMA'), formatTime(iqamaTime)));
        }
      }

      // Fajr end time = Sunrise
      if (t.Sunrise) {
        const sunriseStr = t.Sunrise instanceof Date ? formatTime(t.Sunrise) : t.Sunrise;
        speechParts.push(sprintf(str(handlerInput, 'FAJR_ENDS'), sunriseStr));
      }

      // Ramadan-specific: Iftar and Suhoor info
      if (isRamadan) {
        if (t.Maghrib) {
          const maghribStr = t.Maghrib instanceof Date ? formatTime(t.Maghrib) : t.Maghrib;
          speechParts.push(sprintf(str(handlerInput, 'RAMADAN_IFTAR'), maghribStr));
        }
        if (t.Fajr && t.Fajr instanceof Date) {
          const imsak = calculateImsakTime(t.Fajr, 10);
          speechParts.push(sprintf(str(handlerInput, 'RAMADAN_SUHOOR_ENDS'), formatTime(imsak)));
        }
        if (userSettings.taraweehTime) {
          speechParts.push(`Taraweeh at ${userSettings.taraweehTime}. `);
        }
      }

      // Store prayer times in session
      sessionAttributes.prayerTimes = {};
      for (const [key, value] of Object.entries(t)) {
        if (value instanceof Date) {
          sessionAttributes.prayerTimes[key] = value.toISOString();
        } else if (typeof value === 'string') {
          sessionAttributes.prayerTimes[key] = value;
        }
      }
      sessionAttributes.city = result.city;
      attributesManager.setSessionAttributes(sessionAttributes);

      // APL display with Iqama times
      if (supportsAPL(handlerInput)) {
        const iqamaOffsets = userSettings.iqamaOffsets || DEFAULT_IQAMA_OFFSETS;
        responseBuilder.addDirective(
          buildPrayerTimesAPL(t, result.city, iqamaOffsets, hijriDate, isRamadan, userSettings.taraweehTime)
        );
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      speechParts.push('I had trouble getting prayer times. ');
    }

    return responseBuilder
      .speak(speechParts.join(''))
      .reprompt(str(handlerInput, 'REPROMPT'))
      .getResponse();
  },
};

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

function buildPrayerTimesAPL(times, city, iqamaOffsets, hijriDate, isRamadan, taraweehTime) {
  const prayerData = {};
  const iqamaData = {};

  for (const [key, value] of Object.entries(times)) {
    if (value instanceof Date) {
      prayerData[key] = formatTime(value);
      // Calculate Iqama time
      if (iqamaOffsets[key]) {
        const iqamaTime = new Date(value.getTime() + iqamaOffsets[key] * 60000);
        iqamaData[key] = formatTime(iqamaTime);
      }
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
          iqama: iqamaData,
          hijriDate: hijriDate ? `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year}` : '',
          isRamadan: isRamadan || false,
          taraweehTime: taraweehTime || '',
        },
      },
    },
  };
}

module.exports = { LaunchRequestHandler };
