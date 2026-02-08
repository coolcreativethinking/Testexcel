'use strict';

const { geocodeCity } = require('./prayerTimeService');

/**
 * Location Service
 *
 * Handles device address retrieval and city geocoding.
 */

/**
 * Attempt to get the device address via the Alexa Device Address API.
 *
 * @param {Object} handlerInput - The Alexa handler input
 * @returns {Object|null} Address object { city, countryCode, postalCode } or null
 */
async function getDeviceAddress(handlerInput) {
  const { requestEnvelope, serviceClientFactory } = handlerInput;

  // Check consent token
  const consentToken = requestEnvelope.context.System.user.permissions
    && requestEnvelope.context.System.user.permissions.consentToken;

  if (!consentToken) {
    return null;
  }

  try {
    const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
    const deviceId = requestEnvelope.context.System.device.deviceId;
    const address = await deviceAddressServiceClient.getFullAddress(deviceId);

    if (address && (address.city || address.postalCode)) {
      return {
        city: address.city,
        countryCode: address.countryCode,
        postalCode: address.postalCode,
        stateOrRegion: address.stateOrRegion,
      };
    }
  } catch (error) {
    console.log('Device Address API error:', error.message);
  }

  return null;
}

/**
 * Resolve a city name to coordinates.
 * First tries the AlAdhan API for geocoding.
 *
 * @param {string} city
 * @param {string} country
 * @returns {Object} { latitude, longitude, timezone, city, country }
 */
async function resolveCity(city, country) {
  const geo = await geocodeCity(city, country);
  return {
    city,
    country: country || null,
    latitude: geo.latitude,
    longitude: geo.longitude,
    timezone: geo.timezone,
  };
}

module.exports = {
  getDeviceAddress,
  resolveCity,
};
