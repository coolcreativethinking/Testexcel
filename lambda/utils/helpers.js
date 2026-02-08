'use strict';

const Alexa = require('ask-sdk-core');

/**
 * Check if the device supports APL (has a screen).
 */
function supportsAPL(handlerInput) {
  const interfaces = ((handlerInput.requestEnvelope.context.System || {}).device || {}).supportedInterfaces || {};
  return !!interfaces['Alexa.Presentation.APL'];
}

/**
 * Check if the device supports AudioPlayer.
 */
function supportsAudioPlayer(handlerInput) {
  const interfaces = ((handlerInput.requestEnvelope.context.System || {}).device || {}).supportedInterfaces || {};
  return !!interfaces['AudioPlayer'];
}

/**
 * Get the current AudioPlayer state from the request context.
 */
function getAudioPlayerState(handlerInput) {
  const context = handlerInput.requestEnvelope.context;
  return context.AudioPlayer || { playerActivity: 'IDLE', offsetInMilliseconds: 0 };
}

/**
 * Format a Date object to a human-readable time string (e.g., "5:30 AM").
 */
function formatTime(date) {
  if (!date || !(date instanceof Date)) return 'unknown';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Format a 24h time string "HH:MM" to "H:MM AM/PM".
 */
function formatTimeString(timeStr) {
  if (!timeStr) return 'unknown';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Replace %s placeholders in a string with provided arguments.
 */
function sprintf(template, ...args) {
  let i = 0;
  return template.replace(/%s/g, () => args[i++] || '');
}

/**
 * Get the slot value from an intent, handling synonyms.
 */
function getSlotValue(handlerInput, slotName) {
  const intent = handlerInput.requestEnvelope.request.intent;
  if (!intent || !intent.slots || !intent.slots[slotName]) return null;

  const slot = intent.slots[slotName];

  // Check for resolved values (entity resolution)
  if (slot.resolutions && slot.resolutions.resolutionsPerAuthority) {
    for (const resolution of slot.resolutions.resolutionsPerAuthority) {
      if (resolution.status && resolution.status.code === 'ER_SUCCESS_MATCH') {
        return resolution.values[0].value.name;
      }
    }
  }

  return slot.value || null;
}

/**
 * Normalize a prayer name from various user inputs.
 */
function normalizePrayerName(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  const mappings = {
    'fajr': 'Fajr', 'dawn': 'Fajr', 'morning': 'Fajr', 'subh': 'Fajr',
    'dhuhr': 'Dhuhr', 'zuhr': 'Dhuhr', 'noon': 'Dhuhr', 'midday': 'Dhuhr',
    'asr': 'Asr', 'afternoon': 'Asr',
    'maghrib': 'Maghrib', 'sunset': 'Maghrib', 'evening': 'Maghrib',
    'isha': 'Isha', 'night': 'Isha',
    'sunrise': 'Sunrise', 'shuruq': 'Sunrise',
  };
  return mappings[lower] || null;
}

/**
 * Normalize a calculation method name from user input.
 */
function normalizeMethodName(input) {
  if (!input) return null;
  const lower = input.toLowerCase().replace(/[^a-z]/g, '');
  const mappings = {
    'isna': 'ISNA',
    'mwl': 'MWL', 'muslimworldleague': 'MWL',
    'egyptian': 'EGYPTIAN', 'egypt': 'EGYPTIAN',
    'ummalqura': 'UMM_AL_QURA', 'makkah': 'UMM_AL_QURA', 'mecca': 'UMM_AL_QURA',
    'karachi': 'KARACHI',
    'tehran': 'TEHRAN',
    'jafari': 'JAFARI', 'shia': 'JAFARI',
    'kuwait': 'KUWAIT',
    'qatar': 'QATAR',
    'singapore': 'SINGAPORE',
    'turkey': 'TURKEY', 'diyanet': 'TURKEY',
    'dubai': 'DUBAI',
  };
  return mappings[lower] || null;
}

/**
 * Determine which prayer's Azan to play based on current time and prayer times.
 * If invoked via a Routine, play the Azan for the prayer closest to now.
 */
function determineCurrentPrayer(prayerTimes, now) {
  if (!prayerTimes || !now) return 'Dhuhr'; // fallback

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  let closestPrayer = 'Dhuhr';
  let closestDiff = Infinity;

  for (const prayer of prayers) {
    const time = prayerTimes[prayer.toLowerCase()] || prayerTimes[prayer];
    if (!time) continue;

    const prayerDate = time instanceof Date ? time : new Date(time);
    const diff = Math.abs(now.getTime() - prayerDate.getTime());

    if (diff < closestDiff) {
      closestDiff = diff;
      closestPrayer = prayer;
    }
  }

  return closestPrayer;
}

/**
 * Find the next upcoming prayer.
 */
function getNextPrayer(prayerTimes, now) {
  if (!prayerTimes || !now) return null;

  const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  for (const prayer of prayers) {
    const time = prayerTimes[prayer.toLowerCase()] || prayerTimes[prayer];
    if (!time) continue;

    const prayerDate = time instanceof Date ? time : new Date(time);
    if (prayerDate > now) {
      return { name: prayer, time: prayerDate };
    }
  }

  // All prayers have passed; next is tomorrow's Fajr
  return { name: 'Fajr', time: null };
}

module.exports = {
  supportsAPL,
  supportsAudioPlayer,
  getAudioPlayerState,
  formatTime,
  formatTimeString,
  sprintf,
  getSlotValue,
  normalizePrayerName,
  normalizeMethodName,
  determineCurrentPrayer,
  getNextPrayer,
};
