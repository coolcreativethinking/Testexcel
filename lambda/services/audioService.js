'use strict';

const { AZAN_AUDIO } = require('../utils/constants');

/**
 * Audio Service
 *
 * Manages Azan audio URLs and AudioPlayer directive construction.
 */

/**
 * Get the Azan audio URL for a specific prayer.
 * Fajr has a distinct Azan in many traditions.
 *
 * @param {string} prayerName - e.g., 'Fajr', 'Dhuhr'
 * @param {string} azanPreference - User's preferred Azan sound (e.g., 'default', 'makkah')
 * @returns {string} The HTTPS URL to the audio file
 */
function getAzanUrl(prayerName, azanPreference) {
  // Fajr has its own distinct Azan
  if (prayerName === 'Fajr' && AZAN_AUDIO.fajr) {
    return AZAN_AUDIO.fajr;
  }

  // Check user preference
  if (azanPreference && AZAN_AUDIO[azanPreference]) {
    return AZAN_AUDIO[azanPreference];
  }

  return AZAN_AUDIO.default;
}

/**
 * Build an AudioPlayer.Play directive for the response builder.
 *
 * @param {Object} responseBuilder - The Alexa response builder
 * @param {string} url - Audio file URL
 * @param {string} token - Unique token for this playback session
 * @param {number} offsetInMilliseconds - Start offset (0 for beginning)
 * @param {string} playBehavior - 'REPLACE_ALL', 'ENQUEUE', or 'REPLACE_ENQUEUED'
 * @returns {Object} The response builder (for chaining)
 */
function addPlayDirective(responseBuilder, url, token, offsetInMilliseconds, playBehavior) {
  return responseBuilder.addAudioPlayerPlayDirective(
    playBehavior || 'REPLACE_ALL',
    url,
    token || 'azan-token-' + Date.now(),
    offsetInMilliseconds || 0,
    null, // expectedPreviousToken
    {
      title: 'Azan - Call to Prayer',
      subtitle: 'My Azan',
      art: {
        contentDescription: 'Islamic geometric pattern',
        sources: [
          {
            url: 'https://YOUR_CLOUDFRONT_DOMAIN/assets/azan-art-512.png',
            size: 'LARGE',
            widthPixels: 512,
            heightPixels: 512,
          },
        ],
      },
      backgroundImage: {
        contentDescription: 'Mosque background',
        sources: [
          {
            url: 'https://YOUR_CLOUDFRONT_DOMAIN/assets/mosque-bg-1200.png',
            size: 'X_LARGE',
            widthPixels: 1200,
            heightPixels: 800,
          },
        ],
      },
    }
  );
}

/**
 * Build an AudioPlayer.Stop directive.
 */
function addStopDirective(responseBuilder) {
  return responseBuilder.addAudioPlayerStopDirective();
}

/**
 * Build an AudioPlayer.ClearQueue directive.
 */
function addClearQueueDirective(responseBuilder, clearBehavior) {
  return responseBuilder.addAudioPlayerClearQueueDirective(
    clearBehavior || 'CLEAR_ALL'
  );
}

module.exports = {
  getAzanUrl,
  addPlayDirective,
  addStopDirective,
  addClearQueueDirective,
};
