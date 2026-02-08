'use strict';

const axios = require('axios');
const {
  QURAN_API_BASE,
  QURAN_CDN_BASE,
  EVERYAYAH_BASE,
  QURAN_RECITERS,
} = require('../utils/constants');

/**
 * Quran Service
 *
 * Provides Quran audio URLs and verse data via the AlQuran Cloud API
 * and EveryAyah.com CDN. Used for pre-Azan Quran recitation feature.
 */

/**
 * Get the audio URL for a specific Quran verse.
 * Uses CDN for direct MP3 access (no API call needed).
 *
 * @param {number} surah - Surah number (1-114)
 * @param {number} ayah - Ayah number within the surah
 * @param {string} reciterEdition - AlQuran Cloud edition ID (e.g., 'ar.alafasy')
 * @returns {string} HTTPS URL to the MP3 file
 */
function getAyahAudioUrl(surah, ayah, reciterEdition) {
  const edition = reciterEdition || 'ar.alafasy';

  // Calculate the global ayah number for the CDN
  // CDN URL pattern: https://cdn.islamic.network/quran/audio/128/{edition}/{globalAyahNumber}.mp3
  // We'll use the API approach which accepts surah:ayah format
  return `${QURAN_API_BASE}/ayah/${surah}:${ayah}/${edition}`;
}

/**
 * Get the direct CDN audio URL for a verse using EveryAyah.
 * This returns a predictable URL with no API call required.
 *
 * @param {number} surah - Surah number (1-114)
 * @param {number} ayah - Ayah number within the surah
 * @param {string} reciterEdition - AlQuran Cloud edition ID
 * @returns {string} Direct MP3 URL
 */
function getEveryAyahUrl(surah, ayah, reciterEdition) {
  const reciter = QURAN_RECITERS[reciterEdition || 'ar.alafasy'];
  const folder = reciter ? reciter.everyayahFolder : 'Alafasy_128kbps';
  const surahStr = String(surah).padStart(3, '0');
  const ayahStr = String(ayah).padStart(3, '0');
  return `${EVERYAYAH_BASE}/${folder}/${surahStr}${ayahStr}.mp3`;
}

/**
 * Fetch verse audio and text data from AlQuran Cloud API.
 *
 * @param {number} surah
 * @param {number} ayah
 * @param {string} reciterEdition
 * @returns {Object} { audioUrl, audioSecondary, text, surahName, ayahNumber }
 */
async function fetchAyahData(surah, ayah, reciterEdition) {
  const edition = reciterEdition || 'ar.alafasy';
  const url = `${QURAN_API_BASE}/ayah/${surah}:${ayah}/${edition}`;

  const response = await axios.get(url, { timeout: 5000 });
  const data = response.data;

  if (data.code !== 200 || !data.data) {
    throw new Error(`Quran API error for ${surah}:${ayah}`);
  }

  const ayahData = data.data;
  return {
    audioUrl: ayahData.audio,
    audioSecondary: ayahData.audioSecondary || [],
    text: ayahData.text,
    surahName: ayahData.surah ? ayahData.surah.englishName : `Surah ${surah}`,
    surahNameAr: ayahData.surah ? ayahData.surah.name : '',
    ayahNumber: ayahData.numberInSurah,
    edition: ayahData.edition,
  };
}

/**
 * Get a set of random short verses suitable for pre-Azan recitation.
 * Returns URLs for a few verses from commonly recited short surahs.
 *
 * Short surahs commonly recited: Al-Fatiha (1), Al-Ikhlas (112),
 * Al-Falaq (113), An-Nas (114), Al-Kawthar (108), Al-Asr (103)
 *
 * @param {string} reciterEdition
 * @returns {Array<string>} Array of audio URLs
 */
function getPreAzanRecitationUrls(reciterEdition) {
  const shortSurahs = [
    { surah: 1, ayahs: [1, 2, 3, 4, 5, 6, 7] },        // Al-Fatiha
    { surah: 112, ayahs: [1, 2, 3, 4] },                  // Al-Ikhlas
    { surah: 113, ayahs: [1, 2, 3, 4, 5] },               // Al-Falaq
    { surah: 114, ayahs: [1, 2, 3, 4, 5, 6] },            // An-Nas
  ];

  // Pick a random short surah for this recitation session
  const selected = shortSurahs[Math.floor(Math.random() * shortSurahs.length)];
  return selected.ayahs.map((ayah) => getEveryAyahUrl(selected.surah, ayah, reciterEdition));
}

/**
 * Get a specific surah's audio (full surah, single file).
 * Uses the CDN's surah-level audio endpoint.
 *
 * @param {number} surahNumber - 1-114
 * @param {string} reciterEdition
 * @returns {string} URL to the full surah MP3
 */
function getSurahAudioUrl(surahNumber, reciterEdition) {
  const edition = reciterEdition || 'ar.alafasy';
  return `https://cdn.islamic.network/quran/audio-surah/128/${edition}/${surahNumber}.mp3`;
}

/**
 * Get list of available Quran reciters.
 *
 * @returns {Array} Array of { id, name }
 */
function getAvailableReciters() {
  return Object.entries(QURAN_RECITERS).map(([id, info]) => ({
    id,
    name: info.name,
  }));
}

module.exports = {
  getAyahAudioUrl,
  getEveryAyahUrl,
  fetchAyahData,
  getPreAzanRecitationUrls,
  getSurahAudioUrl,
  getAvailableReciters,
};
