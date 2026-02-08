'use strict';

const { AZAN_RECITERS, AZAN_SPEEDS, getAzanAudioUrl, RAMADAN_RECITALS } = require('../utils/constants');

/**
 * Audio Service
 *
 * Manages Azan audio URLs, reciter selection, speed variants,
 * Ramadan recitals, and AudioPlayer directive construction.
 */

/**
 * Get the Azan audio URL based on user preferences.
 *
 * @param {string} prayerName - e.g., 'Fajr', 'Dhuhr'
 * @param {Object} userSettings - User's saved settings
 * @returns {string} The HTTPS URL to the audio file
 */
function getAzanUrl(prayerName, userSettings) {
  const reciterId = (userSettings && userSettings.azanReciter) || 'makkah';
  const speedId = (userSettings && userSettings.azanSpeed) || 'normal';
  const isFajr = prayerName === 'Fajr';
  return getAzanAudioUrl(reciterId, speedId, isFajr);
}

/**
 * Get list of available Azan reciters for display/speech.
 *
 * @param {string} locale - 'en', 'ar', or 'fr'
 * @returns {Array<Object>} Array of { id, name }
 */
function getReciterList(locale) {
  return Object.values(AZAN_RECITERS).map((r) => ({
    id: r.id,
    name: locale === 'ar' ? r.nameAr : locale === 'fr' ? r.nameFr : r.name,
    origin: r.origin,
  }));
}

/**
 * Get list of available speeds for display/speech.
 *
 * @param {string} locale
 * @returns {Array<Object>}
 */
function getSpeedList(locale) {
  return Object.values(AZAN_SPEEDS).map((s) => ({
    id: s.id,
    label: locale === 'ar' ? s.labelAr : locale === 'fr' ? s.labelFr : s.label,
    factor: s.factor,
  }));
}

/**
 * Get Ramadan recitals applicable for a country and prayer.
 *
 * @param {string} timing - 'preMaghrib' or 'preFajr'
 * @param {string} countryCode - ISO country code (e.g., 'EG', 'TR')
 * @param {string} locale
 * @returns {Array<Object>} Applicable recitals
 */
function getRamadanRecitals(timing, countryCode, locale) {
  const recitals = RAMADAN_RECITALS[timing];
  if (!recitals) return [];

  return Object.values(recitals)
    .filter((r) => r.countries.includes('all') || r.countries.includes(countryCode))
    .map((r) => ({
      id: r.id,
      label: locale === 'ar' ? r.labelAr : locale === 'fr' ? r.labelFr : r.label,
      audioUrl: r.audioUrl,
      dynamic: r.dynamic || false,
    }));
}

/**
 * Build an AudioPlayer.Play directive for the response builder.
 */
function addPlayDirective(responseBuilder, url, token, offsetInMilliseconds, playBehavior, metadata) {
  const defaultMetadata = {
    title: 'Azan - Call to Prayer',
    subtitle: 'My Azan',
    art: {
      contentDescription: 'Islamic geometric pattern',
      sources: [{ url: 'https://YOUR_CLOUDFRONT_DOMAIN/assets/azan-art-512.png', size: 'LARGE', widthPixels: 512, heightPixels: 512 }],
    },
    backgroundImage: {
      contentDescription: 'Mosque background',
      sources: [{ url: 'https://YOUR_CLOUDFRONT_DOMAIN/assets/mosque-bg-1200.png', size: 'X_LARGE', widthPixels: 1200, heightPixels: 800 }],
    },
  };

  return responseBuilder.addAudioPlayerPlayDirective(
    playBehavior || 'REPLACE_ALL',
    url,
    token || 'azan-token-' + Date.now(),
    offsetInMilliseconds || 0,
    null,
    metadata || defaultMetadata
  );
}

/**
 * Build an AudioPlayer.Play directive that enqueues audio (for chaining Quran + Azan).
 */
function addEnqueueDirective(responseBuilder, url, token, expectedPreviousToken) {
  return responseBuilder.addAudioPlayerPlayDirective(
    'ENQUEUE',
    url,
    token,
    0,
    expectedPreviousToken,
    { title: 'Quran Recitation', subtitle: 'Pre-Azan' }
  );
}

function addStopDirective(responseBuilder) {
  return responseBuilder.addAudioPlayerStopDirective();
}

function addClearQueueDirective(responseBuilder, clearBehavior) {
  return responseBuilder.addAudioPlayerClearQueueDirective(clearBehavior || 'CLEAR_ALL');
}

module.exports = {
  getAzanUrl,
  getReciterList,
  getSpeedList,
  getRamadanRecitals,
  addPlayDirective,
  addEnqueueDirective,
  addStopDirective,
  addClearQueueDirective,
};
