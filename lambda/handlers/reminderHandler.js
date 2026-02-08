'use strict';

const Alexa = require('ask-sdk-core');
const { STRINGS, AZAN_PRAYERS } = require('../utils/constants');
const { formatTime, getSlotValue, normalizePrayerName } = require('../utils/helpers');
const { getPrayerTimes } = require('../services/prayerTimeService');

/**
 * Handles SetReminderIntent - "set reminders" or "remind me for Fajr"
 *
 * Creates Alexa Reminders for prayer times.
 * Reminders play a chime + spoken text (cannot play custom audio).
 * For actual Azan playback, users should set up Alexa Routines.
 */
const SetReminderIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetReminderIntent'
    );
  },

  async handle(handlerInput) {
    const { attributesManager, serviceClientFactory, responseBuilder } = handlerInput;

    // Check for reminder permission
    const { permissions } = handlerInput.requestEnvelope.context.System.user;
    if (!permissions || !permissions.consentToken) {
      return responseBuilder
        .speak(STRINGS.REMINDERS_PERMISSION)
        .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
        .getResponse();
    }

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

    // Get prayer times
    const now = new Date();
    let prayerResult;
    try {
      prayerResult = await getPrayerTimes(userSettings, now);
    } catch (error) {
      console.error('Error getting prayer times for reminders:', error);
      return responseBuilder
        .speak(STRINGS.ERROR)
        .getResponse();
    }

    // Determine which prayers to set reminders for
    const prayerInput = getSlotValue(handlerInput, 'PrayerName');
    const specificPrayer = normalizePrayerName(prayerInput);
    const prayersToRemind = specificPrayer ? [specificPrayer] : AZAN_PRAYERS;

    try {
      const reminderClient = serviceClientFactory.getReminderManagementServiceClient();

      for (const prayer of prayersToRemind) {
        const time = prayerResult.times[prayer];
        if (!time) continue;

        const prayerDate = time instanceof Date ? time : parseTimeString(time, now);
        if (!prayerDate || prayerDate <= now) continue;

        const reminderRequest = {
          trigger: {
            type: 'SCHEDULED_ABSOLUTE',
            scheduledTime: formatISO(prayerDate),
            timeZoneId: userSettings.timezone || 'UTC',
            recurrence: {
              recurrenceRules: ['FREQ=DAILY;INTERVAL=1'],
            },
          },
          alertInfo: {
            spokenInfo: {
              content: [
                {
                  locale: 'en-US',
                  text: `It is time for ${prayer} prayer. Say: Alexa, open My Azan, to hear the Azan.`,
                },
              ],
            },
          },
          pushNotification: {
            status: 'ENABLED',
          },
        };

        await reminderClient.createReminder(reminderRequest);
      }

      // Save reminder state
      userSettings.remindersEnabled = true;
      attributesManager.setPersistentAttributes(userSettings);
      await attributesManager.savePersistentAttributes();

      const speechText = specificPrayer
        ? `Reminder set for ${specificPrayer} prayer. `
        : STRINGS.REMINDERS_SET;

      return responseBuilder
        .speak(speechText + STRINGS.ROUTINE_SUGGESTION)
        .reprompt(STRINGS.REPROMPT)
        .getResponse();
    } catch (error) {
      console.error('Error creating reminders:', error);

      if (error.statusCode === 401 || error.statusCode === 403) {
        return responseBuilder
          .speak(STRINGS.REMINDERS_PERMISSION)
          .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
          .getResponse();
      }

      return responseBuilder
        .speak('I had trouble setting reminders. Please try again later.')
        .getResponse();
    }
  },
};

/**
 * Parse a "HH:MM" time string into a Date object for today.
 */
function parseTimeString(timeStr, referenceDate) {
  if (!timeStr || !timeStr.includes(':')) return null;
  const parts = timeStr.split(':');
  const date = new Date(referenceDate);
  date.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
  return date;
}

/**
 * Format a Date to ISO string without timezone suffix (Alexa Reminders format).
 */
function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

module.exports = { SetReminderIntentHandler };
