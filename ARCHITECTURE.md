# Alexa Azan Prayer Skill - Architecture & Feasibility

## Overview

An Alexa Custom Skill that plays the full Azan (Islamic call to prayer) at the correct times based on the user's city/country. Works on all Alexa devices -- Echo Dot (voice-only), Echo Show (with screen), Echo Studio, and Fire TV.

## Feasibility Analysis

### Does This Idea Work?

**Yes, with one important design constraint:** Alexa does not allow skills to proactively play audio without user interaction. The solution uses **Alexa Routines** (user sets up 5 time-triggered routines, one per prayer) combined with the **AudioPlayer interface** for full Azan playback.

This is the same approach used by Smart Azan, the most successful Azan skill on the Alexa Store.

### Key Platform Constraints

| Constraint | Impact | Workaround |
|---|---|---|
| No proactive audio playback | Skill cannot auto-play Azan at prayer times | Alexa Routines trigger the skill at scheduled times |
| SSML audio limit: 30s per clip | Too short for full Azan (2-4 min) | Use AudioPlayer interface (unlimited duration) |
| 8-second Lambda timeout | Must respond quickly | Cache prayer times, pre-compute responses |
| Device Address API is user-entered | Location may be incomplete | Fallback to voice-based city setting |
| Quiet hours (10PM-7AM) block reminders | Affects Fajr and Isha reminders | Routines are not affected by quiet hours |

## Architecture

```
User: "Alexa, open My Azan"
         |
         v
+------------------+     +-------------------+
|  Alexa Service   | --> | AWS Lambda         |
|  (NLU + Voice)   |     | (Node.js 20)       |
+------------------+     |                    |
                          | Intent Handlers:   |
                          | - LaunchRequest    |
                          | - PlayAzanIntent   |
                          | - GetPrayerTimes   |
                          | - SetCity          |
                          | - SetMethod        |
                          | - AudioPlayer evts |
                          +----+-----+----+----+
                               |     |    |
                    +----------+  +--+--+ +--------+
                    |             |     |           |
              +-----v----+  +----v---+ +--v--------+
              | DynamoDB  |  |  S3    | | AlAdhan   |
              | User prefs|  | Azan   | | API       |
              | Playback  |  | MP3s   | | (prayer   |
              | state     |  |        | |  times)   |
              +-----------+  +--------+ +-----------+
```

### Components

| Component | Technology | Purpose |
|---|---|---|
| Skill Backend | AWS Lambda (Node.js 20) | Handle all Alexa requests |
| Skill SDK | ASK SDK v2 (`ask-sdk`) | Alexa request/response framework |
| Prayer Times | AlAdhan API + `adhan` npm | Calculate prayer times by city |
| User Storage | DynamoDB | Store city, method, preferences |
| Audio Hosting | S3 + CloudFront | Host Azan MP3 files (HTTPS) |
| Scheduling | Alexa Routines | Trigger skill at prayer times |
| Notifications | Reminders API | Spoken prayer time reminders |
| Screen UI | APL (Alexa Presentation Language) | Visual display on Echo Show |

## Skill Features

### Voice Commands

| Command | Response |
|---|---|
| "Alexa, open My Azan" | Welcome + current/next prayer info |
| "Play the Azan" | Plays full Azan audio (~2 min) via AudioPlayer |
| "Play Fajr Azan" | Plays Azan for specific prayer |
| "What time is Fajr?" | Speaks the Fajr prayer time |
| "What are today's prayer times?" | Lists all 5 prayer times |
| "Set my city to London" | Saves user's city preference |
| "Set calculation method to ISNA" | Changes calculation method |
| "Set reminders" | Creates spoken reminders for all prayers |
| "Alexa, stop" / "Alexa, pause" | Stops/pauses Azan playback |
| "Alexa, resume" | Resumes paused Azan |

### Echo Show (Screen) Features

When running on a screen device, the skill displays:
- Prayer schedule for the day with times
- Current/next prayer highlighted
- Islamic geometric art background
- Playback controls during Azan

### Supported Calculation Methods

| Method | Region |
|---|---|
| MWL (Muslim World League) | Europe, Far East |
| ISNA | North America |
| Egyptian | Africa, Syria, Lebanon |
| Umm Al-Qura | Saudi Arabia |
| Karachi | Pakistan, India, Bangladesh |
| Tehran | Iran |
| Jafari | Shia communities |

## Scheduling Strategy

Since Alexa cannot proactively play audio, the scheduling uses a layered approach:

### Layer 1: Alexa Routines (Primary - Plays Audio)
- User creates 5 Routines in the Alexa app, one per prayer
- Each Routine triggers at the prayer time and opens the skill
- The skill detects the current prayer and plays the correct Azan
- **This is the only method that achieves automatic Azan playback**

### Layer 2: Reminders API (Secondary - Spoken Alert)
- Skill programmatically sets reminders for each prayer
- Alexa speaks "It's time for Fajr prayer" at the scheduled time
- Reminders update daily via the backend as prayer times shift

### Layer 3: On-Demand (User-Initiated)
- User can say "Alexa, open My Azan and play Azan" at any time

## Audio Requirements

| Property | Requirement |
|---|---|
| Format | MP3 (MPEG v2) |
| Bitrate | 48-192 kbps |
| Hosting | HTTPS with valid SSL (S3/CloudFront) |
| Duration | ~2 minutes per Azan |
| Interface | AudioPlayer (supports unlimited duration) |

## Project Structure

```
alexa-azan-skill/
  skill-package/
    interactionModels/
      custom/
        en-US.json          # English interaction model
        ar-SA.json          # Arabic interaction model
    skill.json              # Skill manifest
  lambda/
    index.js                # Main Lambda handler
    handlers/
      launchHandler.js      # LaunchRequest handler
      azanHandler.js        # PlayAzanIntent handler
      prayerTimeHandler.js  # GetPrayerTime/GetAllPrayerTimes
      settingsHandler.js    # SetCity, SetMethod handlers
      reminderHandler.js    # SetReminder handler
      audioPlayerHandler.js # AudioPlayer event handlers
      builtInHandler.js     # Help, Stop, Cancel, Fallback
    services/
      prayerTimeService.js  # AlAdhan API + adhan.js integration
      audioService.js       # Azan audio URL management
      locationService.js    # Device Address API integration
    apl/
      prayerTimesDocument.json  # APL template for prayer schedule
      azanPlaybackDocument.json # APL template for Azan playback
      launchDocument.json       # APL template for welcome screen
    utils/
      constants.js          # Azan URLs, method mappings, strings
      helpers.js            # Utility functions
    package.json
  README.md
  ARCHITECTURE.md
```

## Publishing

- **Category**: Lifestyle > Religion & Spirituality
- **Content Rating**: Guidance Suggested (dynamic content)
- **Supported Locales**: en-US, en-GB, en-IN, en-AU, ar-SA
- **No policy issues**: Multiple Azan skills already approved on the store
