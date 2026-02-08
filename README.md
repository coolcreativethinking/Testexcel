# My Azan - Alexa Prayer Times & Azan Skill

An Alexa Custom Skill that plays the full Azan (Islamic call to prayer) and provides accurate prayer times for any city worldwide. Works on all Alexa devices -- Echo Dot, Echo Show, Echo Studio, Fire TV, and more.

## Features

- **Full Azan Playback** (~2 minutes) via the AudioPlayer interface
- **Accurate Prayer Times** for any city worldwide using the AlAdhan API + adhan.js
- **12 Calculation Methods** (ISNA, MWL, Egyptian, Umm Al-Qura, Karachi, Tehran, Jafari, Kuwait, Qatar, Turkey, Dubai, Singapore)
- **Screen Support** (APL) -- prayer schedule display on Echo Show devices
- **Spoken Reminders** for each prayer via the Alexa Reminders API
- **Automatic Azan** via Alexa Routines (user-configured)
- **Voice Controls** -- play, pause, resume, stop
- **Multi-Device** -- works on all Alexa-enabled devices

## Voice Commands

| Command | What It Does |
|---|---|
| "Alexa, open My Azan" | Launch the skill, hear next prayer time |
| "Play the Azan" | Play full Azan audio |
| "Play the Fajr Azan" | Play Azan for a specific prayer |
| "What time is Fajr?" | Get a specific prayer time |
| "When is the next prayer?" | Get the next upcoming prayer |
| "What are today's prayer times?" | List all 5 prayer times + sunrise |
| "Set my city to Cairo" | Configure your location |
| "Set calculation method to Egyptian" | Change calculation method |
| "Set reminders" | Enable spoken prayer reminders |
| "Alexa, pause" | Pause Azan playback |
| "Alexa, resume" | Resume paused Azan |
| "Alexa, stop" | Stop playback |

## Project Structure

```
.
├── ARCHITECTURE.md                          # Detailed architecture & feasibility doc
├── README.md                                # This file
├── skill-package/
│   ├── skill.json                           # Skill manifest (permissions, interfaces)
│   └── interactionModels/
│       └── custom/
│           └── en-US.json                   # Interaction model (intents, slots, utterances)
└── lambda/
    ├── index.js                             # Main Lambda entry point & skill builder
    ├── package.json                         # Node.js dependencies
    ├── handlers/
    │   ├── launchHandler.js                 # LaunchRequest (welcome, next prayer)
    │   ├── azanHandler.js                   # PlayAzanIntent (audio playback)
    │   ├── prayerTimeHandler.js             # GetPrayerTime & GetAllPrayerTimes
    │   ├── settingsHandler.js               # SetCity & SetMethod
    │   ├── reminderHandler.js               # SetReminder (Reminders API)
    │   ├── audioPlayerHandler.js            # AudioPlayer events + pause/resume/stop
    │   └── builtInHandler.js                # Help, Fallback, SessionEnded, Error
    ├── services/
    │   ├── prayerTimeService.js             # adhan.js + AlAdhan API integration
    │   ├── audioService.js                  # Azan audio URL & AudioPlayer directives
    │   └── locationService.js               # Device Address API + geocoding
    ├── apl/
    │   ├── launchDocument.json              # Welcome screen (Echo Show)
    │   ├── prayerTimesDocument.json         # Prayer schedule (Echo Show)
    │   └── azanPlaybackDocument.json        # Now playing screen (Echo Show)
    └── utils/
        ├── constants.js                     # Config: prayers, methods, strings, URLs
        └── helpers.js                       # Utility functions
```

## Prerequisites

1. **Amazon Developer Account** -- [developer.amazon.com](https://developer.amazon.com)
2. **AWS Account** -- [aws.amazon.com](https://aws.amazon.com)
3. **ASK CLI** (optional but recommended) -- `npm install -g ask-cli`
4. **Node.js** 18+ installed locally

## Setup & Deployment

### Option A: Alexa-Hosted Skill (Easiest)

1. Go to the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Click **Create Skill** > name it "My Azan" > choose **Custom** model > **Alexa-Hosted (Node.js)**
3. In the code editor:
   - Replace the interaction model with `skill-package/interactionModels/custom/en-US.json`
   - Replace the Lambda code with the contents of the `lambda/` directory
   - Update `skill.json` interfaces and permissions in the Build tab
4. Click **Deploy**

### Option B: AWS Lambda (Production)

#### 1. Prepare the Lambda Package

```bash
cd lambda
npm install
zip -r ../alexa-azan-skill.zip .
```

#### 2. Create the Lambda Function

```bash
aws lambda create-function \
  --function-name alexa-azan-skill \
  --runtime nodejs20.x \
  --handler index.handler \
  --role arn:aws:iam::ACCOUNT_ID:role/alexa-skill-lambda-role \
  --zip-file fileb://../alexa-azan-skill.zip \
  --timeout 7 \
  --memory-size 256 \
  --environment Variables="{S3_PERSISTENCE_BUCKET=alexa-azan-skill-data}"
```

#### 3. Create S3 Bucket for User Data

```bash
aws s3 mb s3://alexa-azan-skill-data --region us-east-1
```

#### 4. Upload Azan Audio Files

```bash
# Convert audio to Alexa-compatible format
ffmpeg -i azan-original.mp3 -ac 2 -codec:a libmp3lame -b:a 192k -ar 44100 azan.mp3

# Upload to S3
aws s3 cp azan.mp3 s3://your-audio-bucket/azan/default.mp3 --acl public-read
```

#### 5. Configure the Alexa Skill

1. Create a new skill in the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Import the interaction model from `skill-package/interactionModels/custom/en-US.json`
3. Set the Lambda ARN as the endpoint
4. Enable **AudioPlayer** and **Alexa Presentation Language** interfaces
5. Add permissions: **Device Address** (full) and **Reminders** (read/write)
6. Build the model and test

### Option C: ASK CLI

```bash
# Configure ASK CLI
ask configure

# Deploy everything
ask deploy

# Test locally
ask dialog --locale en-US
```

## Configuration

### Audio URLs

Update `lambda/utils/constants.js` with your actual Azan audio URLs:

```javascript
const AZAN_AUDIO = {
  default: 'https://your-cloudfront-domain.com/azan/default.mp3',
  makkah:  'https://your-cloudfront-domain.com/azan/makkah.mp3',
  fajr:    'https://your-cloudfront-domain.com/azan/fajr.mp3',
};
```

Audio files must be:
- **Format**: MP3 (MPEG v2)
- **Bitrate**: 48-384 kbps
- **Hosted**: HTTPS with valid SSL certificate
- **Duration**: ~2 minutes recommended

### Azan Audio Sources

Free, royalty-free Azan recordings are available from:
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/search/azan/)
- [Creazilla Audio](https://creazilla.com/search/audio/azan)
- [AlAdhan Downloads](https://aladhan.com/download-adhans)

## Setting Up Automatic Azan (Alexa Routines)

Alexa cannot proactively play audio without user interaction. To get automatic Azan at prayer times, users must create **Alexa Routines**:

1. Open the **Alexa app** on your phone
2. Go to **More** > **Routines** > **+** (create new)
3. **When this happens**: Choose **Schedule** > set the prayer time (e.g., 5:30 AM for Fajr)
4. **Add action**: Choose **Skills** > select **My Azan**
5. **Save**
6. Repeat for each prayer (5 routines total)

The skill will detect the current prayer based on the time and play the correct Azan.

## How It Works

### Prayer Time Calculation

The skill uses a two-layer approach:

1. **Primary (offline)**: The `adhan` npm package calculates prayer times locally using astronomical algorithms from Jean Meeus's "Astronomical Algorithms." No network call needed once the user's coordinates are known.

2. **Fallback (API)**: The [AlAdhan API](https://aladhan.com/prayer-times-api) provides prayer times by city name and handles geocoding. Used when only a city name is available (first-time setup).

### Audio Playback

Uses the **AudioPlayer interface** (not SSML audio tags) for full-length Azan playback:
- No duration limit (SSML is capped at 30 seconds per tag)
- Supports background playback (continues after skill session ends)
- Provides play/pause/resume controls on screen devices
- User can control with voice: "Alexa, pause", "Alexa, resume"

### Screen Support

On Echo Show and other screen devices, the skill displays:
- **Welcome Screen**: Islamic-themed welcome with setup instructions
- **Prayer Times Screen**: Full daily schedule with all 6 times
- **Playback Screen**: "Now Playing" display during Azan

The APL templates use a dark theme with gold accents for an elegant Islamic aesthetic.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation including:
- Full feasibility analysis
- Platform constraints and workarounds
- System architecture diagram
- Scheduling strategy (Routines + Reminders + On-Demand)
- Supported calculation methods

## Testing

```bash
cd lambda
npm test
```

Test in the Alexa Developer Console:
1. Go to the **Test** tab
2. Enable testing in "Development"
3. Type or speak: "open my azan"

## Known Limitations

1. **No automatic audio playback**: Alexa Routines are required for scheduled Azan. This is a platform-level limitation.
2. **Quiet hours**: Alexa Reminders may be suppressed between 10 PM - 7 AM, affecting Fajr and late Isha reminders. Routines are NOT affected.
3. **Location accuracy**: Device Address API depends on user-entered data. GPS/geolocation is only available on mobile Alexa devices.
4. **Prayer time variations**: Times may differ slightly from local mosques, which often apply manual adjustments.

## License

MIT
