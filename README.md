# Local Monitor

Situation dashboard for ZIP-based weather and public alert monitoring.

## Data Sources

- [OpenStreetMap/Nominatim](https://nominatim.org/release-docs/latest/api/Search/) for ZIP geocoding
- [Open-Meteo](https://open-meteo.com/en/docs) for current weather
- [National Weather Service alerts API](https://www.weather.gov/documentation/services-web-alerts) for active public alerts
- [USGS earthquake event API](https://earthquake.usgs.gov/fdsnws/event/1/) for recent earthquake events near the selected ZIP
- User-entered local notes stored in browser local storage

The live feed contains only sourced NWS alerts, sourced USGS earthquake events, and user-entered local notes that are labeled as local notes. The app does not include mock traffic, power, news, police, fire, EMS, utility outage, or dispatch data.

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
