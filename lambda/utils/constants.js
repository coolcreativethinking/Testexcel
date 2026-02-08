'use strict';

// Prayer names and their display labels
const PRAYERS = {
  FAJR: 'Fajr',
  SUNRISE: 'Sunrise',
  DHUHR: 'Dhuhr',
  ASR: 'Asr',
  MAGHRIB: 'Maghrib',
  ISHA: 'Isha',
};

// Prayer names in order (for iteration)
const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Prayers that have Azan (Sunrise does not)
const AZAN_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Azan audio files hosted on S3/CloudFront
// Replace these URLs with your actual hosted audio files
const AZAN_AUDIO = {
  default: 'https://YOUR_CLOUDFRONT_DOMAIN/azan/default.mp3',
  makkah: 'https://YOUR_CLOUDFRONT_DOMAIN/azan/makkah.mp3',
  madinah: 'https://YOUR_CLOUDFRONT_DOMAIN/azan/madinah.mp3',
  // Fajr has a distinct Azan in many traditions
  fajr: 'https://YOUR_CLOUDFRONT_DOMAIN/azan/fajr.mp3',
};

// Calculation method mappings
// Maps user-friendly names to AlAdhan API method numbers and adhan.js method names
const CALCULATION_METHODS = {
  MWL: { id: 3, label: 'Muslim World League', adhanMethod: 'MuslimWorldLeague', region: 'Europe, Far East' },
  ISNA: { id: 2, label: 'Islamic Society of North America', adhanMethod: 'NorthAmerica', region: 'North America' },
  EGYPTIAN: { id: 5, label: 'Egyptian General Authority', adhanMethod: 'Egyptian', region: 'Africa, Syria, Lebanon' },
  UMM_AL_QURA: { id: 4, label: 'Umm Al-Qura University, Makkah', adhanMethod: 'UmmAlQura', region: 'Saudi Arabia' },
  KARACHI: { id: 1, label: 'University of Islamic Sciences, Karachi', adhanMethod: 'Karachi', region: 'Pakistan, India, Bangladesh' },
  TEHRAN: { id: 7, label: 'Institute of Geophysics, Tehran', adhanMethod: 'Tehran', region: 'Iran' },
  JAFARI: { id: 0, label: 'Shia Ithna-Ashari (Jafari)', adhanMethod: 'Tehran', region: 'Shia communities' },
  KUWAIT: { id: 9, label: 'Kuwait', adhanMethod: 'Kuwait', region: 'Kuwait' },
  QATAR: { id: 10, label: 'Qatar', adhanMethod: 'Qatar', region: 'Qatar' },
  SINGAPORE: { id: 11, label: 'Singapore', adhanMethod: 'Singapore', region: 'Singapore' },
  TURKEY: { id: 13, label: 'Diyanet, Turkey', adhanMethod: 'Turkey', region: 'Turkey' },
  DUBAI: { id: 16, label: 'Dubai', adhanMethod: 'Dubai', region: 'UAE' },
};

// Default settings for new users
const DEFAULT_SETTINGS = {
  city: null,
  country: null,
  calculationMethod: 'ISNA',
  latitude: null,
  longitude: null,
  timezone: null,
  azanSound: 'default',
  remindersEnabled: false,
};

// AlAdhan API base URL
const ALADHAN_API_BASE = 'https://api.aladhan.com/v1';

// Skill strings (English)
const STRINGS = {
  WELCOME: 'Welcome to My Azan, your Islamic prayer companion. ',
  WELCOME_NEW_USER: 'Welcome to My Azan. To get started, please tell me your city. For example, say "set my city to London".',
  WELCOME_RETURNING: 'Welcome back to My Azan. ',
  NEXT_PRAYER: 'The next prayer is %s at %s. ',
  PLAY_AZAN: 'Playing the Azan.',
  PLAY_AZAN_FOR: 'Playing the %s Azan.',
  PRAYER_TIME: '%s prayer is at %s.',
  ALL_PRAYER_TIMES: "Today's prayer times for %s: Fajr at %s, Sunrise at %s, Dhuhr at %s, Asr at %s, Maghrib at %s, and Isha at %s.",
  CITY_SET: 'Your city has been set to %s. ',
  METHOD_SET: 'Calculation method set to %s. ',
  CITY_NOT_SET: 'Please set your city first. Say "set my city to" followed by your city name.',
  HELP: 'You can say: play the Azan, what time is Fajr, what are today\'s prayer times, set my city to London, or set calculation method to ISNA. What would you like to do?',
  GOODBYE: 'May peace be upon you. Assalamu Alaikum.',
  ERROR: 'Sorry, I had trouble with that. Please try again.',
  REMINDERS_SET: 'Prayer reminders have been set for all five daily prayers.',
  REMINDERS_PERMISSION: 'To set reminders, please grant reminder permissions in the Alexa app.',
  LOCATION_PERMISSION: 'To use your device location, please grant address permissions in the Alexa app.',
  ROUTINE_SUGGESTION: 'For automatic Azan at prayer times, create Alexa Routines in the Alexa app. Set a time trigger for each prayer and select this skill as the action.',
  FALLBACK: "I didn't understand that. You can say play the Azan, get prayer times, or say help for more options.",
  REPROMPT: 'What would you like to do? Say help for options.',
};

// APL constants
const APL_DOCUMENT_VERSION = '2024.2';

module.exports = {
  PRAYERS,
  PRAYER_ORDER,
  AZAN_PRAYERS,
  AZAN_AUDIO,
  CALCULATION_METHODS,
  DEFAULT_SETTINGS,
  ALADHAN_API_BASE,
  STRINGS,
  APL_DOCUMENT_VERSION,
};
