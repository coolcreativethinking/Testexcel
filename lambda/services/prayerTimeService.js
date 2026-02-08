'use strict';

const adhan = require('adhan');
const axios = require('axios');
const { CALCULATION_METHODS, ALADHAN_API_BASE } = require('../utils/constants');

/**
 * Prayer Time Service
 *
 * Uses the `adhan` npm package for local calculation (primary, no network dependency)
 * and the AlAdhan REST API as a fallback / for geocoding city names.
 */

/**
 * Get the adhan.js CalculationParameters for a given method key.
 */
function getCalculationParams(methodKey) {
  const method = CALCULATION_METHODS[methodKey] || CALCULATION_METHODS.ISNA;
  const adhanMethodName = method.adhanMethod;

  // Map method name to adhan.CalculationMethod
  const methodMap = {
    MuslimWorldLeague: adhan.CalculationMethod.MuslimWorldLeague,
    NorthAmerica: adhan.CalculationMethod.NorthAmerica,
    Egyptian: adhan.CalculationMethod.Egyptian,
    UmmAlQura: adhan.CalculationMethod.UmmAlQura,
    Karachi: adhan.CalculationMethod.Karachi,
    Tehran: adhan.CalculationMethod.Tehran,
    Kuwait: adhan.CalculationMethod.Kuwait,
    Qatar: adhan.CalculationMethod.Qatar,
    Singapore: adhan.CalculationMethod.Singapore,
    Turkey: adhan.CalculationMethod.Turkey,
    Dubai: adhan.CalculationMethod.Dubai,
    MoonsightingCommittee: adhan.CalculationMethod.MoonsightingCommittee,
  };

  const calcMethod = methodMap[adhanMethodName];
  if (calcMethod) {
    return calcMethod();
  }

  // Default fallback
  return adhan.CalculationMethod.NorthAmerica();
}

/**
 * Calculate prayer times locally using adhan.js.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {Date} date - The date for which to calculate
 * @param {string} methodKey - Key from CALCULATION_METHODS (e.g., 'ISNA')
 * @returns {Object} Prayer times with Date objects
 */
function calculatePrayerTimes(latitude, longitude, date, methodKey) {
  const coordinates = new adhan.Coordinates(latitude, longitude);
  const params = getCalculationParams(methodKey || 'ISNA');
  const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

  return {
    Fajr: prayerTimes.fajr,
    Sunrise: prayerTimes.sunrise,
    Dhuhr: prayerTimes.dhuhr,
    Asr: prayerTimes.asr,
    Maghrib: prayerTimes.maghrib,
    Isha: prayerTimes.isha,
    currentPrayer: prayerTimes.currentPrayer(),
    nextPrayer: prayerTimes.nextPrayer(),
  };
}

/**
 * Get the Qibla direction from a location.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {number} Qibla direction in degrees from North
 */
function getQiblaDirection(latitude, longitude) {
  const coordinates = new adhan.Coordinates(latitude, longitude);
  return adhan.Qibla(coordinates);
}

/**
 * Fetch prayer times from the AlAdhan REST API by city name.
 * Used when we only have a city name (no lat/lng yet).
 *
 * @param {string} city
 * @param {string} country
 * @param {number} method - AlAdhan method number
 * @param {Date} date
 * @returns {Object} Prayer times and location metadata
 */
async function fetchPrayerTimesByCity(city, country, method, date) {
  const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const url = `${ALADHAN_API_BASE}/timingsByCity/${dateStr}`;

  const params = {
    city: city,
    country: country || '',
    method: method || 2,
  };

  const response = await axios.get(url, { params, timeout: 5000 });
  const data = response.data;

  if (data.code !== 200 || !data.data) {
    throw new Error(`AlAdhan API error: ${data.status || 'unknown'}`);
  }

  const timings = data.data.timings;
  const meta = data.data.meta;

  return {
    timings: {
      Fajr: timings.Fajr,
      Sunrise: timings.Sunrise,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
    },
    meta: {
      latitude: parseFloat(meta.latitude),
      longitude: parseFloat(meta.longitude),
      timezone: meta.timezone,
      method: meta.method,
    },
  };
}

/**
 * Geocode a city name to latitude/longitude using AlAdhan's API.
 * We call the API once to get coordinates, then use adhan.js locally.
 *
 * @param {string} city
 * @param {string} country
 * @returns {Object} { latitude, longitude, timezone }
 */
async function geocodeCity(city, country) {
  const now = new Date();
  const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
  const url = `${ALADHAN_API_BASE}/timingsByCity/${dateStr}`;

  const params = {
    city: city,
    country: country || '',
    method: 2,
  };

  const response = await axios.get(url, { params, timeout: 5000 });
  const data = response.data;

  if (data.code !== 200 || !data.data) {
    throw new Error(`Could not find location for city: ${city}`);
  }

  const meta = data.data.meta;

  return {
    latitude: parseFloat(meta.latitude),
    longitude: parseFloat(meta.longitude),
    timezone: meta.timezone,
  };
}

/**
 * Get prayer times using the best available method.
 * If lat/lng is available, uses local calculation (faster, no network).
 * Otherwise, falls back to the AlAdhan API.
 *
 * @param {Object} userSettings - User's saved settings
 * @param {Date} date - The date for which to calculate
 * @returns {Object} { times, city }
 */
async function getPrayerTimes(userSettings, date) {
  const { latitude, longitude, city, country, calculationMethod } = userSettings;

  // If we have coordinates, calculate locally (fast, no API call)
  if (latitude && longitude) {
    const times = calculatePrayerTimes(latitude, longitude, date, calculationMethod);
    return { times, city: city || 'your location' };
  }

  // Otherwise, use AlAdhan API with city name
  if (city) {
    const methodConfig = CALCULATION_METHODS[calculationMethod] || CALCULATION_METHODS.ISNA;
    const result = await fetchPrayerTimesByCity(city, country, methodConfig.id, date);
    return {
      times: result.timings,
      city,
      meta: result.meta,
    };
  }

  throw new Error('No location configured. Please set your city.');
}

module.exports = {
  calculatePrayerTimes,
  getQiblaDirection,
  fetchPrayerTimesByCity,
  geocodeCity,
  getPrayerTimes,
  getCalculationParams,
};
