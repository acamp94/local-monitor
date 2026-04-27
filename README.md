# Local Monitor

Situation dashboard for ZIP-based weather and public alert monitoring.

## Data Sources

- OpenStreetMap/Nominatim for ZIP geocoding
- Open-Meteo for current weather
- National Weather Service for active alerts
- User-entered local notes stored in browser local storage

The app does not include mock traffic, power, news, police, fire, EMS, or dispatch data.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run typecheck
npm run build
```

## Configuration

No API keys are required for the current version. The browser must have public internet access for map tiles, ZIP lookup, weather, and NWS alerts.
