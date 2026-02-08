'use strict';

const Alexa = require('ask-sdk-core');
const { S3PersistenceAdapter } = require('ask-sdk-s3-persistence-adapter');

// Handlers
const { LaunchRequestHandler } = require('./handlers/launchHandler');
const { PlayAzanIntentHandler } = require('./handlers/azanHandler');
const { GetPrayerTimeIntentHandler, GetAllPrayerTimesIntentHandler } = require('./handlers/prayerTimeHandler');
const { SetCityIntentHandler, SetMethodIntentHandler } = require('./handlers/settingsHandler');
const { SetReminderIntentHandler } = require('./handlers/reminderHandler');
const { SetReciterIntentHandler, SetSpeedIntentHandler, SetIqamaIntentHandler } = require('./handlers/reciterHandler');
const {
  SetTaraweehIntentHandler,
  PlayQuranIntentHandler,
  GetRamadanInfoIntentHandler,
  TogglePreAzanQuranIntentHandler,
} = require('./handlers/ramadanHandler');
const { PlayEidTakbeerIntentHandler, GetEidInfoIntentHandler } = require('./handlers/eidHandler');
const { PlayKhutbahIntentHandler } = require('./handlers/khutbahHandler');
const {
  PlaybackStartedHandler,
  PlaybackFinishedHandler,
  PlaybackStoppedHandler,
  PlaybackNearlyFinishedHandler,
  PlaybackFailedHandler,
  PauseIntentHandler,
  ResumeIntentHandler,
  StopIntentHandler,
  PlaybackControllerPauseHandler,
  PlaybackControllerPlayHandler,
} = require('./handlers/audioPlayerHandler');
const {
  HelpIntentHandler,
  FallbackIntentHandler,
  NavigateHomeIntentHandler,
  SessionEndedRequestHandler,
  ErrorHandler,
} = require('./handlers/builtInHandler');

const persistenceAdapter = new S3PersistenceAdapter({
  bucketName: process.env.S3_PERSISTENCE_BUCKET || 'alexa-azan-skill-data',
});

/**
 * Request interceptor: load persistent attributes into session on every request.
 */
const LoadPersistentAttributesInterceptor = {
  async process(handlerInput) {
    if (handlerInput.requestEnvelope.session) {
      const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      const merged = { ...persistentAttributes, ...sessionAttributes };
      handlerInput.attributesManager.setSessionAttributes(merged);
    }
  },
};

/**
 * Response interceptor: save persistent attributes after every response.
 */
const SavePersistentAttributesInterceptor = {
  async process(handlerInput) {
    if (handlerInput.requestEnvelope.session) {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      // All user settings that should persist across sessions
      const persistKeys = [
        'city', 'country', 'latitude', 'longitude', 'timezone',
        'calculationMethod', 'locale',
        // Reciter & audio
        'azanReciter', 'azanSpeed',
        // Iqama
        'iqamaOffsets',
        // Ramadan & Quran
        'preAzanQuranEnabled', 'preAzanQuranReciter',
        'ramadanRecitalsEnabled', 'taraweehTime',
        // Reminders
        'remindersEnabled',
        // Playback state
        'lastPlayedUrl', 'playbackOffset', 'playbackToken',
      ];

      const toPersist = {};
      for (const key of persistKeys) {
        if (sessionAttributes[key] !== undefined) {
          toPersist[key] = sessionAttributes[key];
        }
      }

      if (Object.keys(toPersist).length > 0) {
        const existing = await handlerInput.attributesManager.getPersistentAttributes();
        handlerInput.attributesManager.setPersistentAttributes({ ...existing, ...toPersist });
        await handlerInput.attributesManager.savePersistentAttributes();
      }
    }
  },
};

/**
 * Skill builder.
 *
 * Handler order matters: the SDK selects the FIRST handler whose canHandle returns true.
 * AudioPlayer event handlers must come before generic intent handlers.
 */
const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    // Launch
    LaunchRequestHandler,

    // Custom intents - Azan & Prayer
    PlayAzanIntentHandler,
    GetPrayerTimeIntentHandler,
    GetAllPrayerTimesIntentHandler,

    // Settings
    SetCityIntentHandler,
    SetMethodIntentHandler,
    SetReciterIntentHandler,
    SetSpeedIntentHandler,
    SetIqamaIntentHandler,

    // Ramadan & Quran
    SetTaraweehIntentHandler,
    PlayQuranIntentHandler,
    GetRamadanInfoIntentHandler,
    TogglePreAzanQuranIntentHandler,

    // Eid
    PlayEidTakbeerIntentHandler,
    GetEidInfoIntentHandler,

    // Friday Khutbah
    PlayKhutbahIntentHandler,

    // Reminders
    SetReminderIntentHandler,

    // AudioPlayer events
    PlaybackStartedHandler,
    PlaybackFinishedHandler,
    PlaybackStoppedHandler,
    PlaybackNearlyFinishedHandler,
    PlaybackFailedHandler,

    // Playback controller (hardware/touch buttons)
    PlaybackControllerPauseHandler,
    PlaybackControllerPlayHandler,

    // Audio control intents
    PauseIntentHandler,
    ResumeIntentHandler,
    StopIntentHandler,

    // Built-in intents
    HelpIntentHandler,
    FallbackIntentHandler,
    NavigateHomeIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LoadPersistentAttributesInterceptor)
  .addResponseInterceptors(SavePersistentAttributesInterceptor)
  .withPersistenceAdapter(persistenceAdapter)
  .withApiClient(new Alexa.DefaultApiClient());

exports.handler = skillBuilder.lambda();
