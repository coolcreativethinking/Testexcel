'use strict';

const axios = require('axios');
const { ALADHAN_API_BASE, HIJRI_MONTHS } = require('../utils/constants');

/**
 * Hijri Calendar Service
 *
 * Converts dates between Gregorian and Hijri calendars using the AlAdhan API.
 * Detects Ramadan and provides Hijri date information.
 */

/**
 * Convert a Gregorian date to Hijri.
 *
 * @param {Date} date - Gregorian date
 * @returns {Object} { day, month, monthName, year, isRamadan, holidays }
 */
async function gregorianToHijri(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  const url = `${ALADHAN_API_BASE}/gToH?date=${dd}-${mm}-${yyyy}`;
  const response = await axios.get(url, { timeout: 5000 });
  const data = response.data;

  if (data.code !== 200 || !data.data) {
    throw new Error('Failed to convert date to Hijri');
  }

  const hijri = data.data.hijri;
  return {
    day: parseInt(hijri.day, 10),
    month: hijri.month.number,
    monthNameAr: hijri.month.ar,
    monthNameEn: hijri.month.en,
    year: parseInt(hijri.year, 10),
    isRamadan: hijri.month.number === 9,
    holidays: hijri.holidays || [],
    weekdayAr: hijri.weekday.ar,
    weekdayEn: hijri.weekday.en,
  };
}

/**
 * Get Hijri date formatted for display.
 *
 * @param {Date} date - Gregorian date
 * @param {string} locale - 'en', 'ar', or 'fr'
 * @returns {Object} { formatted, day, monthName, year, isRamadan }
 */
async function getHijriDate(date, locale) {
  const hijri = await gregorianToHijri(date);
  const months = HIJRI_MONTHS[locale] || HIJRI_MONTHS.en;
  const monthName = months[hijri.month - 1] || hijri.monthNameEn;

  return {
    formatted: `${hijri.day} ${monthName} ${hijri.year}`,
    day: hijri.day,
    monthName,
    monthNumber: hijri.month,
    year: hijri.year,
    isRamadan: hijri.isRamadan,
    holidays: hijri.holidays,
  };
}

/**
 * Get the full Ramadan calendar for a given Hijri year.
 * Returns all days of Ramadan with their Gregorian equivalents.
 *
 * @param {number} hijriYear - Hijri year (e.g., 1447)
 * @returns {Array} Array of { hijriDay, gregorianDate }
 */
async function getRamadanCalendar(hijriYear) {
  const url = `${ALADHAN_API_BASE}/hToGCalendar/9/${hijriYear}`;
  const response = await axios.get(url, { timeout: 5000 });
  const data = response.data;

  if (data.code !== 200 || !data.data) {
    throw new Error('Failed to get Ramadan calendar');
  }

  return data.data.map((entry) => ({
    hijriDay: parseInt(entry.hijri.day, 10),
    gregorianDate: entry.gregorian.date, // "DD-MM-YYYY"
    gregorianDay: entry.gregorian.weekday.en,
  }));
}

/**
 * Check if today is Ramadan and return context.
 *
 * @param {Date} date
 * @param {string} locale
 * @returns {Object} { isRamadan, hijriDate, dayOfRamadan }
 */
async function checkRamadan(date, locale) {
  try {
    const hijriDate = await getHijriDate(date, locale);
    return {
      isRamadan: hijriDate.isRamadan,
      hijriDate,
      dayOfRamadan: hijriDate.isRamadan ? hijriDate.day : null,
    };
  } catch (error) {
    console.error('Error checking Ramadan:', error.message);
    return { isRamadan: false, hijriDate: null, dayOfRamadan: null };
  }
}

/**
 * Calculate Imsak time (precautionary stop-eating time before Fajr).
 * Typically 10-15 minutes before Fajr.
 *
 * @param {Date} fajrTime - Fajr prayer time
 * @param {number} offsetMinutes - Minutes before Fajr (default 10)
 * @returns {Date} Imsak time
 */
function calculateImsakTime(fajrTime, offsetMinutes) {
  const offset = offsetMinutes || 10;
  const imsak = new Date(fajrTime.getTime());
  imsak.setMinutes(imsak.getMinutes() - offset);
  return imsak;
}

module.exports = {
  gregorianToHijri,
  getHijriDate,
  getRamadanCalendar,
  checkRamadan,
  calculateImsakTime,
};
