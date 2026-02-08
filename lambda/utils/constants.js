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

// ─── MULTI-RECITER AZAN CATALOG ───
// Each reciter has audio files at multiple speeds hosted on S3/CloudFront.
// Speed variants are pre-processed with ffmpeg atempo filter.
// URL pattern: BASE_AUDIO_URL/azan/{reciterId}/{speed}/azan.mp3
const BASE_AUDIO_URL = 'https://YOUR_CLOUDFRONT_DOMAIN';

const AZAN_RECITERS = {
  makkah: {
    id: 'makkah',
    name: 'Sheikh Ali Ahmed Mullah (Makkah)',
    nameAr: 'الشيخ علي أحمد ملا (مكة)',
    nameFr: 'Cheikh Ali Ahmed Mullah (La Mecque)',
    origin: 'Masjid al-Haram, Makkah',
    style: 'Maqam Hijaz',
  },
  madinah: {
    id: 'madinah',
    name: 'Madinah Muezzin',
    nameAr: 'مؤذن المدينة المنورة',
    nameFr: 'Muezzin de Médine',
    origin: 'Masjid an-Nabawi, Madinah',
    style: 'Maqam Bayati',
  },
  alafasy: {
    id: 'alafasy',
    name: 'Mishary Rashid Al-Afasy',
    nameAr: 'مشاري راشد العفاسي',
    nameFr: 'Mishary Rashid Al-Afasy',
    origin: 'Kuwait',
    style: 'Melodic',
  },
  abdulbasit: {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdul Samad',
    nameAr: 'عبد الباسط عبد الصمد',
    nameFr: 'Abdul Basit Abdul Samad',
    origin: 'Egypt',
    style: 'Egyptian Classical',
  },
  sudais: {
    id: 'sudais',
    name: 'Abdur-Rahman As-Sudais',
    nameAr: 'عبد الرحمن السديس',
    nameFr: 'Abdur-Rahman As-Sudais',
    origin: 'Masjid al-Haram, Makkah',
    style: 'Maqam Hijaz',
  },
  alghamidi: {
    id: 'alghamidi',
    name: 'Saad Al-Ghamidi',
    nameAr: 'سعد الغامدي',
    nameFr: 'Saad Al-Ghamidi',
    origin: 'Saudi Arabia',
    style: 'Gulf',
  },
};

// Available playback speeds (pre-processed via ffmpeg atempo)
// Alexa AudioPlayer does not support runtime speed change
const AZAN_SPEEDS = {
  slow: { id: 'slow', factor: 0.75, label: 'Slow', labelAr: 'بطيء', labelFr: 'Lent' },
  normal: { id: 'normal', factor: 1.0, label: 'Normal', labelAr: 'عادي', labelFr: 'Normal' },
  fast: { id: 'fast', factor: 1.25, label: 'Slightly Fast', labelAr: 'سريع قليلاً', labelFr: 'Légèrement rapide' },
};

// Build Azan audio URL for a reciter + speed + prayer variant
function getAzanAudioUrl(reciterId, speedId, isFajr) {
  const variant = isFajr ? 'fajr' : 'regular';
  return `${BASE_AUDIO_URL}/azan/${reciterId}/${speedId}/${variant}.mp3`;
}

// ─── IQAMA CONFIGURATION ───
// Default Iqama offset in minutes after the Azan, per prayer.
// Users and mosques can customize these.
const DEFAULT_IQAMA_OFFSETS = {
  Fajr: 20,
  Dhuhr: 15,
  Asr: 10,
  Maghrib: 5,   // Maghrib Iqama is typically very short after Azan
  Isha: 15,
};

// ─── CALCULATION METHODS ───
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

// ─── DEFAULT USER SETTINGS ───
const DEFAULT_SETTINGS = {
  city: null,
  country: null,
  calculationMethod: 'ISNA',
  latitude: null,
  longitude: null,
  timezone: null,
  locale: 'en',
  // Reciter & speed
  azanReciter: 'makkah',
  azanSpeed: 'normal',
  // Iqama offsets (minutes after Azan) per prayer
  iqamaOffsets: { ...DEFAULT_IQAMA_OFFSETS },
  // Ramadan settings
  preAzanQuranEnabled: false,
  preAzanQuranReciter: 'ar.alafasy',
  ramadanRecitalsEnabled: true,
  taraweehTime: null, // mosque-specific, e.g. "22:00" or "01:00"
  // Reminders
  remindersEnabled: false,
};

// ─── API ENDPOINTS ───
const ALADHAN_API_BASE = 'https://api.aladhan.com/v1';
const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
const QURAN_CDN_BASE = 'https://cdn.islamic.network/quran/audio/128';
const EVERYAYAH_BASE = 'https://everyayah.com/data';

// ─── QURAN RECITER CATALOG ───
const QURAN_RECITERS = {
  'ar.alafasy': { name: 'Mishary Rashid Al-Afasy', everyayahFolder: 'Alafasy_128kbps' },
  'ar.abdulbasitmurattal': { name: 'Abdul Basit (Murattal)', everyayahFolder: 'Abdul_Basit_Murattal_192kbps' },
  'ar.abdurrahmaansudais': { name: 'Abdur-Rahman As-Sudais', everyayahFolder: 'Abdurrahmaan_As-Sudais_192kbps' },
  'ar.husary': { name: 'Mahmoud Khalil Al-Husary', everyayahFolder: 'Husary_128kbps' },
  'ar.minshawi': { name: 'Mohammed Siddiq Al-Minshawi', everyayahFolder: 'Minshawy_Murattal_128kbps' },
};

// ─── RAMADAN RECITALS BY COUNTRY ───
// Configurable pre-Azan audio content during Ramadan.
// Users can select from these or add custom ones.
const RAMADAN_RECITALS = {
  preMaghrib: {
    iftarDua: {
      id: 'iftar_dua',
      label: 'Iftar Dua',
      labelAr: 'دعاء الإفطار',
      labelFr: "Dou'a de l'Iftar",
      audioUrl: `${BASE_AUDIO_URL}/ramadan/iftar_dua.mp3`,
      countries: ['all'],
    },
    quranRecitation: {
      id: 'pre_maghrib_quran',
      label: 'Quran Recitation before Iftar',
      labelAr: 'تلاوة قرآنية قبل الإفطار',
      labelFr: 'Récitation du Coran avant Iftar',
      dynamic: true, // fetched from Quran API
      countries: ['EG', 'SY', 'LB', 'JO'],
    },
  },
  preFajr: {
    suhoorReminder: {
      id: 'suhoor_reminder',
      label: 'Suhoor Reminder',
      labelAr: 'تذكير بالسحور',
      labelFr: 'Rappel du Souhour',
      audioUrl: `${BASE_AUDIO_URL}/ramadan/suhoor_reminder.mp3`,
      countries: ['all'],
    },
    imsakAlert: {
      id: 'imsak_alert',
      label: 'Imsak Alert',
      labelAr: 'تنبيه الإمساك',
      labelFr: "Alerte de l'Imsak",
      audioUrl: `${BASE_AUDIO_URL}/ramadan/imsak_alert.mp3`,
      countries: ['all'],
    },
    mesaharati: {
      id: 'mesaharati',
      label: 'Mesaharati (Traditional Drummer)',
      labelAr: 'المسحراتي',
      labelFr: 'Mesaharati (Tambour traditionnel)',
      audioUrl: `${BASE_AUDIO_URL}/ramadan/mesaharati.mp3`,
      countries: ['EG', 'SY', 'PS', 'JO', 'LB'],
    },
    davulcu: {
      id: 'davulcu',
      label: 'Ramazan Davulcusu (Turkish Drummer)',
      labelAr: 'طبال رمضان التركي',
      labelFr: 'Davulcu de Ramadan (Tambour turc)',
      audioUrl: `${BASE_AUDIO_URL}/ramadan/davulcu.mp3`,
      countries: ['TR'],
    },
  },
};

// ─── MULTI-LANGUAGE STRINGS ───
const STRINGS = {
  en: {
    WELCOME: 'Welcome to My Azan, your Islamic prayer companion. ',
    WELCOME_NEW_USER: 'Welcome to My Azan. To get started, please tell me your city. For example, say "set my city to London".',
    WELCOME_RETURNING: 'Welcome back to My Azan. ',
    NEXT_PRAYER: 'The next prayer is %s at %s. ',
    NEXT_PRAYER_IQAMA: 'Iqama is at %s. ',
    PLAY_AZAN: 'Playing the Azan.',
    PLAY_AZAN_FOR: 'Playing the %s Azan.',
    PRAYER_TIME: '%s prayer is at %s.',
    PRAYER_TIME_IQAMA: 'Iqama for %s is at %s.',
    ALL_PRAYER_TIMES: "Today's prayer times for %s: Fajr at %s, Sunrise at %s, Dhuhr at %s, Asr at %s, Maghrib at %s, and Isha at %s.",
    FAJR_ENDS: 'Fajr prayer ends at Sunrise, %s. ',
    CITY_SET: 'Your city has been set to %s. ',
    METHOD_SET: 'Calculation method set to %s. ',
    RECITER_SET: 'Azan reciter set to %s. ',
    SPEED_SET: 'Azan speed set to %s. ',
    IQAMA_SET: 'Iqama for %s set to %s minutes after Azan. ',
    CITY_NOT_SET: 'Please set your city first. Say "set my city to" followed by your city name.',
    HELP: 'You can say: play the Azan, what time is Fajr, what are today\'s prayer times, set my city, change reciter, set Azan speed, set iqama time, or read Quran before Azan. What would you like to do?',
    GOODBYE: 'May peace be upon you. Assalamu Alaikum.',
    ERROR: 'Sorry, I had trouble with that. Please try again.',
    REMINDERS_SET: 'Prayer reminders have been set for all five daily prayers.',
    REMINDERS_PERMISSION: 'To set reminders, please grant reminder permissions in the Alexa app.',
    LOCATION_PERMISSION: 'To use your device location, please grant address permissions in the Alexa app.',
    ROUTINE_SUGGESTION: 'For automatic Azan at prayer times, create Alexa Routines in the Alexa app.',
    FALLBACK: "I didn't understand that. Say help for a list of commands.",
    REPROMPT: 'What would you like to do? Say help for options.',
    RAMADAN_GREETING: 'Ramadan Mubarak! ',
    RAMADAN_IFTAR: 'Iftar is at Maghrib, %s. ',
    RAMADAN_SUHOOR_ENDS: 'Suhoor ends at Imsak, approximately %s. ',
    TARAWEEH_SET: 'Taraweeh prayer time set to %s. ',
    QURAN_PLAYING: 'Playing Quran recitation, Surah %s, verses %s. ',
    RECITER_LIST: 'Available reciters: %s. Say "set reciter to" followed by the name.',
    SPEED_LIST: 'Available speeds: slow, normal, and slightly fast. Say "set speed to" followed by your choice.',
    HIJRI_DATE: 'Today is %s %s, %s Hijri. ',
  },
  ar: {
    WELCOME: 'مرحباً بك في أذاني، رفيقك للصلاة. ',
    WELCOME_NEW_USER: 'مرحباً بك في أذاني. للبدء، أخبرني بمدينتك. مثلاً قل "اضبط مدينتي على القاهرة".',
    WELCOME_RETURNING: 'مرحباً بك مجدداً في أذاني. ',
    NEXT_PRAYER: 'الصلاة التالية هي %s في الساعة %s. ',
    NEXT_PRAYER_IQAMA: 'الإقامة في الساعة %s. ',
    PLAY_AZAN: 'جاري تشغيل الأذان.',
    PLAY_AZAN_FOR: 'جاري تشغيل أذان %s.',
    PRAYER_TIME: 'صلاة %s في الساعة %s.',
    PRAYER_TIME_IQAMA: 'إقامة صلاة %s في الساعة %s.',
    ALL_PRAYER_TIMES: 'مواقيت الصلاة اليوم في %s: الفجر %s، الشروق %s، الظهر %s، العصر %s، المغرب %s، والعشاء %s.',
    FAJR_ENDS: 'ينتهي وقت صلاة الفجر عند الشروق، %s. ',
    CITY_SET: 'تم ضبط مدينتك على %s. ',
    METHOD_SET: 'تم ضبط طريقة الحساب على %s. ',
    RECITER_SET: 'تم ضبط المؤذن على %s. ',
    SPEED_SET: 'تم ضبط سرعة الأذان على %s. ',
    IQAMA_SET: 'تم ضبط إقامة %s على %s دقيقة بعد الأذان. ',
    CITY_NOT_SET: 'الرجاء ضبط مدينتك أولاً. قل "اضبط مدينتي على" متبوعاً باسم مدينتك.',
    HELP: 'يمكنك قول: شغّل الأذان، ما وقت الفجر، ما مواقيت الصلاة اليوم، اضبط مدينتي، غيّر المؤذن، اضبط سرعة الأذان، أو اقرأ قرآن قبل الأذان.',
    GOODBYE: 'السلام عليكم ورحمة الله وبركاته.',
    ERROR: 'عذراً، حدث خطأ. الرجاء المحاولة مرة أخرى.',
    REMINDERS_SET: 'تم ضبط تذكيرات الصلاة لجميع الصلوات الخمس.',
    REMINDERS_PERMISSION: 'لضبط التذكيرات، يرجى منح أذونات التذكير في تطبيق أليكسا.',
    LOCATION_PERMISSION: 'لاستخدام موقعك، يرجى منح أذونات العنوان في تطبيق أليكسا.',
    ROUTINE_SUGGESTION: 'للأذان التلقائي، أنشئ روتيناً في تطبيق أليكسا.',
    FALLBACK: 'لم أفهم. قل مساعدة لقائمة الأوامر.',
    REPROMPT: 'ماذا تريد أن تفعل؟ قل مساعدة للخيارات.',
    RAMADAN_GREETING: 'رمضان مبارك! ',
    RAMADAN_IFTAR: 'الإفطار عند المغرب، %s. ',
    RAMADAN_SUHOOR_ENDS: 'ينتهي السحور عند الإمساك، حوالي %s. ',
    TARAWEEH_SET: 'تم ضبط وقت صلاة التراويح على %s. ',
    QURAN_PLAYING: 'جاري تشغيل تلاوة القرآن، سورة %s، الآيات %s. ',
    RECITER_LIST: 'المؤذنون المتاحون: %s. قل "اضبط المؤذن على" متبوعاً بالاسم.',
    SPEED_LIST: 'السرعات المتاحة: بطيء، عادي، وسريع قليلاً.',
    HIJRI_DATE: 'اليوم %s %s، %s هجري. ',
  },
  fr: {
    WELCOME: 'Bienvenue sur Mon Adhan, votre compagnon de prière islamique. ',
    WELCOME_NEW_USER: 'Bienvenue sur Mon Adhan. Pour commencer, dites-moi votre ville. Par exemple, dites "définir ma ville sur Paris".',
    WELCOME_RETURNING: 'Bienvenue à nouveau sur Mon Adhan. ',
    NEXT_PRAYER: 'La prochaine prière est %s à %s. ',
    NEXT_PRAYER_IQAMA: "L'Iqama est à %s. ",
    PLAY_AZAN: "Lecture de l'Adhan.",
    PLAY_AZAN_FOR: "Lecture de l'Adhan de %s.",
    PRAYER_TIME: 'La prière de %s est à %s.',
    PRAYER_TIME_IQAMA: "L'Iqama de %s est à %s.",
    ALL_PRAYER_TIMES: "Horaires de prière aujourd'hui pour %s: Fajr à %s, Lever du soleil à %s, Dhuhr à %s, Asr à %s, Maghrib à %s, et Isha à %s.",
    FAJR_ENDS: 'La prière de Fajr se termine au lever du soleil, %s. ',
    CITY_SET: 'Votre ville a été définie sur %s. ',
    METHOD_SET: 'Méthode de calcul définie sur %s. ',
    RECITER_SET: 'Le muezzin a été défini sur %s. ',
    SPEED_SET: "La vitesse de l'Adhan a été définie sur %s. ",
    IQAMA_SET: "L'Iqama de %s est définie à %s minutes après l'Adhan. ",
    CITY_NOT_SET: "Veuillez d'abord définir votre ville. Dites \"définir ma ville sur\" suivi du nom de votre ville.",
    HELP: "Vous pouvez dire: jouer l'Adhan, quelle heure est Fajr, quels sont les horaires de prière, définir ma ville, changer le muezzin, régler la vitesse de l'Adhan, ou lire le Coran avant l'Adhan.",
    GOODBYE: 'Que la paix soit sur vous. Assalamou Alaikoum.',
    ERROR: "Désolé, j'ai eu un problème. Veuillez réessayer.",
    REMINDERS_SET: 'Les rappels de prière ont été définis pour les cinq prières quotidiennes.',
    REMINDERS_PERMISSION: "Pour définir des rappels, veuillez accorder les autorisations dans l'application Alexa.",
    LOCATION_PERMISSION: "Pour utiliser votre localisation, veuillez accorder les autorisations d'adresse dans l'application Alexa.",
    ROUTINE_SUGGESTION: "Pour l'Adhan automatique, créez des Routines Alexa dans l'application Alexa.",
    FALLBACK: "Je n'ai pas compris. Dites aide pour la liste des commandes.",
    REPROMPT: 'Que souhaitez-vous faire? Dites aide pour les options.',
    RAMADAN_GREETING: 'Ramadan Moubarak! ',
    RAMADAN_IFTAR: "L'Iftar est au Maghrib, %s. ",
    RAMADAN_SUHOOR_ENDS: "Le Souhour se termine à l'Imsak, environ %s. ",
    TARAWEEH_SET: 'Heure de Tarawih définie à %s. ',
    QURAN_PLAYING: 'Lecture du Coran, Sourate %s, versets %s. ',
    RECITER_LIST: 'Muezzins disponibles: %s. Dites "définir le muezzin sur" suivi du nom.',
    SPEED_LIST: "Vitesses disponibles: lent, normal, et légèrement rapide.",
    HIJRI_DATE: "Aujourd'hui est le %s %s, %s de l'Hégire. ",
  },
};

// Hijri month names in all supported languages
const HIJRI_MONTHS = {
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani',
       'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'],
  ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
       'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
  fr: ['Mouharram', 'Safar', "Rabi' al-Awwal", "Rabi' ath-Thani", 'Joumada al-Oula', 'Joumada ath-Thania',
       'Rajab', 'Chaabane', 'Ramadan', 'Chawwal', 'Dhou al-Qida', 'Dhou al-Hijja'],
};

// APL constants
const APL_DOCUMENT_VERSION = '2024.2';

module.exports = {
  PRAYERS,
  PRAYER_ORDER,
  AZAN_PRAYERS,
  BASE_AUDIO_URL,
  AZAN_RECITERS,
  AZAN_SPEEDS,
  getAzanAudioUrl,
  DEFAULT_IQAMA_OFFSETS,
  CALCULATION_METHODS,
  DEFAULT_SETTINGS,
  ALADHAN_API_BASE,
  QURAN_API_BASE,
  QURAN_CDN_BASE,
  EVERYAYAH_BASE,
  QURAN_RECITERS,
  RAMADAN_RECITALS,
  STRINGS,
  HIJRI_MONTHS,
  APL_DOCUMENT_VERSION,
};
