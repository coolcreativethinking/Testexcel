'use strict';

const Alexa = require('ask-sdk-core');
const { S3PersistenceAdapter } = require('ask-sdk-s3-persistence-adapter');

// Handlers
const { LaunchRequestHandler } = require('./handlers/launchHandler');
const { PlayAzanIntentHandler } = require('./handlers/azanHandler');
const { GetPrayerTimeIntentHandler, GetAllPrayerTimesIntentHandler } = require('./handlers/prayerTimeHandler');
const { SetCityIntentHandler, SetMethodIntentHandler } = require('./handlers/settingsHandler');
const { SetReminderIntentHandler } = require('./handlers/reminderHandler');
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

/**
 * Persistence adapter using S3.
 *
 * For production, you may want to use DynamoDB instead:
 *   const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
 *   const persistenceAdapter = new DynamoDbPersistenceAdapter({
 *     tableName: 'AzanSkillUserData',
 *     createTable: true,
 *   });
 */
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

      // Merge persistent into session (session takes precedence)
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
    // Only save if we have a session (AudioPlayer events don't have sessions)
    if (handlerInput.requestEnvelope.session) {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      // Only persist user settings, not transient session data
      const persistKeys = [
        'city', 'country', 'latitude', 'longitude', 'timezone',
        'calculationMethod', 'azanSound', 'remindersEnabled',
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

    // Custom intents
    PlayAzanIntentHandler,
    GetPrayerTimeIntentHandler,
    GetAllPrayerTimesIntentHandler,
    SetCityIntentHandler,
    SetMethodIntentHandler,
    SetReminderIntentHandler,

    // AudioPlayer events (must be before generic intent handlers)
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
