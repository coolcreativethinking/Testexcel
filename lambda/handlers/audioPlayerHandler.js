'use strict';

const Alexa = require('ask-sdk-core');
const { addStopDirective } = require('../services/audioService');

/**
 * AudioPlayer event handlers.
 *
 * These handle lifecycle events from the AudioPlayer interface.
 * AudioPlayer requests do NOT have a session object.
 */

/**
 * PlaybackStarted - Audio has started playing.
 * Can only respond with AudioPlayer directives (Stop or ClearQueue).
 */
const PlaybackStartedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackStarted';
  },
  handle(handlerInput) {
    // No action needed; just acknowledge
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * PlaybackFinished - Audio has finished playing.
 * Can only respond with AudioPlayer directives.
 */
const PlaybackFinishedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackFinished';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * PlaybackStopped - Audio was stopped (user said "stop" or another audio took over).
 * Save the offset so we can resume later.
 * Cannot include any response directives.
 */
const PlaybackStoppedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackStopped';
  },
  async handle(handlerInput) {
    // Save playback offset for resume capability
    const offset = handlerInput.requestEnvelope.request.offsetInMilliseconds || 0;
    const token = handlerInput.requestEnvelope.request.token || '';

    try {
      const { attributesManager } = handlerInput;
      const attributes = await attributesManager.getPersistentAttributes();
      attributes.playbackOffset = offset;
      attributes.playbackToken = token;
      attributesManager.setPersistentAttributes(attributes);
      await attributesManager.savePersistentAttributes();
    } catch (e) {
      console.error('Error saving playback state:', e);
    }

    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * PlaybackNearlyFinished - Track is almost done.
 * Could enqueue the next track here if we had a playlist.
 * For Azan, we just let it finish.
 */
const PlaybackNearlyFinishedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackNearlyFinished';
  },
  handle(handlerInput) {
    // Azan is a single track, no queue needed
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * PlaybackFailed - Error during audio playback.
 */
const PlaybackFailedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackFailed';
  },
  handle(handlerInput) {
    const error = handlerInput.requestEnvelope.request.error;
    console.error('AudioPlayer.PlaybackFailed:', JSON.stringify(error));
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * PauseIntent - user says "Alexa, pause"
 */
const PauseIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PauseIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent')
    );
  },
  handle(handlerInput) {
    addStopDirective(handlerInput.responseBuilder);
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * ResumeIntent - user says "Alexa, resume"
 */
const ResumeIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;

    let attributes;
    try {
      attributes = await attributesManager.getPersistentAttributes();
    } catch (e) {
      attributes = {};
    }

    const offset = attributes.playbackOffset || 0;
    const url = attributes.lastPlayedUrl;

    if (!url) {
      return responseBuilder
        .speak('There is nothing to resume. Say "play the Azan" to start.')
        .reprompt('Say "play the Azan" to hear the call to prayer.')
        .getResponse();
    }

    const token = 'azan-resume-' + Date.now();
    responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', url, token, offset);

    return responseBuilder.getResponse();
  },
};

/**
 * StopIntent - user says "Alexa, stop"
 */
const StopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
    );
  },
  handle(handlerInput) {
    addStopDirective(handlerInput.responseBuilder);
    return handlerInput.responseBuilder
      .speak('Assalamu Alaikum.')
      .withShouldEndSession(true)
      .getResponse();
  },
};

/**
 * PlaybackController.PauseCommandIssued - hardware/touch pause button
 */
const PlaybackControllerPauseHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'PlaybackController.PauseCommandIssued';
  },
  handle(handlerInput) {
    addStopDirective(handlerInput.responseBuilder);
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * PlaybackController.PlayCommandIssued - hardware/touch play button
 */
const PlaybackControllerPlayHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'PlaybackController.PlayCommandIssued';
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;

    let attributes;
    try {
      attributes = await attributesManager.getPersistentAttributes();
    } catch (e) {
      attributes = {};
    }

    const offset = attributes.playbackOffset || 0;
    const url = attributes.lastPlayedUrl;

    if (url) {
      const token = 'azan-playback-ctrl-' + Date.now();
      responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', url, token, offset);
    }

    return responseBuilder.getResponse();
  },
};

module.exports = {
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
};
