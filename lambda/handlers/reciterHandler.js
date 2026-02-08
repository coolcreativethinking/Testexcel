'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS, AZAN_RECITERS, AZAN_SPEEDS, DEFAULT_IQAMA_OFFSETS } = require('../utils/constants');
const { getSlotValue, sprintf } = require('../utils/helpers');
const { getReciterList } = require('../services/audioService');

function getLocale(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  return attrs.locale || 'en';
}

function str(handlerInput, key) {
  const locale = getLocale(handlerInput);
  return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || '';
}

/**
 * SetReciterIntent - "set reciter to Makkah" / "change muezzin to Al-Afasy"
 */
const SetReciterIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetReciterIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const reciterInput = getSlotValue(handlerInput, 'ReciterName');

    if (!reciterInput) {
      const locale = getLocale(handlerInput);
      const names = getReciterList(locale).map((r) => r.name).join(', ');
      return responseBuilder
        .speak(sprintf(str(handlerInput, 'RECITER_LIST'), names))
        .reprompt(str(handlerInput, 'REPROMPT'))
        .getResponse();
    }

    // Normalize the reciter input to a reciter ID
    const lower = reciterInput.toLowerCase();
    let matchedId = null;
    for (const [id, reciter] of Object.entries(AZAN_RECITERS)) {
      if (
        id === lower ||
        reciter.name.toLowerCase().includes(lower) ||
        reciter.origin.toLowerCase().includes(lower)
      ) {
        matchedId = id;
        break;
      }
    }

    if (!matchedId) {
      const locale = getLocale(handlerInput);
      const names = getReciterList(locale).map((r) => r.name).join(', ');
      return responseBuilder
        .speak(`I didn't find that reciter. ${sprintf(str(handlerInput, 'RECITER_LIST'), names)}`)
        .reprompt(str(handlerInput, 'REPROMPT'))
        .getResponse();
    }

    let userSettings;
    try { userSettings = await attributesManager.getPersistentAttributes(); } catch (e) { userSettings = {}; }

    userSettings.azanReciter = matchedId;
    attributesManager.setPersistentAttributes(userSettings);
    await attributesManager.savePersistentAttributes();

    const locale = getLocale(handlerInput);
    const displayName = locale === 'ar' ? AZAN_RECITERS[matchedId].nameAr :
                        locale === 'fr' ? AZAN_RECITERS[matchedId].nameFr :
                        AZAN_RECITERS[matchedId].name;

    return responseBuilder
      .speak(sprintf(str(handlerInput, 'RECITER_SET'), displayName))
      .reprompt(str(handlerInput, 'REPROMPT'))
      .getResponse();
  },
};

/**
 * SetSpeedIntent - "set azan speed to slow" / "make the azan faster"
 */
const SetSpeedIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetSpeedIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const speedInput = getSlotValue(handlerInput, 'SpeedLevel');

    if (!speedInput) {
      return responseBuilder
        .speak(str(handlerInput, 'SPEED_LIST'))
        .reprompt(str(handlerInput, 'REPROMPT'))
        .getResponse();
    }

    const lower = speedInput.toLowerCase();
    const speedMap = {
      'slow': 'slow', 'slower': 'slow',
      'normal': 'normal', 'regular': 'normal', 'default': 'normal',
      'fast': 'fast', 'faster': 'fast', 'quick': 'fast',
    };
    const matchedId = speedMap[lower] || null;

    if (!matchedId || !AZAN_SPEEDS[matchedId]) {
      return responseBuilder
        .speak(str(handlerInput, 'SPEED_LIST'))
        .reprompt(str(handlerInput, 'REPROMPT'))
        .getResponse();
    }

    let userSettings;
    try { userSettings = await attributesManager.getPersistentAttributes(); } catch (e) { userSettings = {}; }

    userSettings.azanSpeed = matchedId;
    attributesManager.setPersistentAttributes(userSettings);
    await attributesManager.savePersistentAttributes();

    const locale = getLocale(handlerInput);
    const speed = AZAN_SPEEDS[matchedId];
    const label = locale === 'ar' ? speed.labelAr : locale === 'fr' ? speed.labelFr : speed.label;

    return responseBuilder
      .speak(sprintf(str(handlerInput, 'SPEED_SET'), label))
      .reprompt(str(handlerInput, 'REPROMPT'))
      .getResponse();
  },
};

/**
 * SetIqamaIntent - "set iqama for Fajr to 20 minutes"
 */
const SetIqamaIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetIqamaIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const prayerName = getSlotValue(handlerInput, 'PrayerName');
    const minutes = getSlotValue(handlerInput, 'IqamaMinutes');

    if (!prayerName || !minutes) {
      return responseBuilder
        .speak('Please specify the prayer and minutes. For example, say "set iqama for Fajr to 20 minutes".')
        .reprompt(str(handlerInput, 'REPROMPT'))
        .getResponse();
    }

    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins < 1 || mins > 60) {
      return responseBuilder
        .speak('Iqama time should be between 1 and 60 minutes after the Azan.')
        .reprompt(str(handlerInput, 'REPROMPT'))
        .getResponse();
    }

    let userSettings;
    try { userSettings = await attributesManager.getPersistentAttributes(); } catch (e) { userSettings = {}; }

    if (!userSettings.iqamaOffsets) {
      userSettings.iqamaOffsets = { ...DEFAULT_IQAMA_OFFSETS };
    }
    userSettings.iqamaOffsets[prayerName] = mins;
    attributesManager.setPersistentAttributes(userSettings);
    await attributesManager.savePersistentAttributes();

    return responseBuilder
      .speak(sprintf(str(handlerInput, 'IQAMA_SET'), prayerName, String(mins)))
      .reprompt(str(handlerInput, 'REPROMPT'))
      .getResponse();
  },
};

module.exports = {
  SetReciterIntentHandler,
  SetSpeedIntentHandler,
  SetIqamaIntentHandler,
};
