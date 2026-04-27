# Local Monitor

Situation dashboard for ZIP-based weather and public alert monitoring.

## Data Sources

- [OpenStreetMap/Nominatim](https://nominatim.org/release-docs/latest/api/Search/) for ZIP geocoding
- [Open-Meteo](https://open-meteo.com/en/docs) for current weather
- [National Weather Service alerts API](https://www.weather.gov/documentation/services-web-alerts) for active public alerts
- [USGS earthquake event API](https://earthquake.usgs.gov/fdsnws/event/1/) for recent earthquake events near the selected ZIP
- PulsePoint public web feed for participating fire/EMS agencies where a matching agency is available
- Optional configured Socrata or ArcGIS public-safety open-data feeds in `src/data/publicSafetySources.ts`
- Location-specific official or external context links in `src/data/localInfoSources.ts` when structured incident APIs are not available
- User-entered local notes stored in browser local storage

The live feed contains only sourced NWS alerts, public-safety feed items, sourced USGS earthquake events, and user-entered local notes that are labeled as local notes. The app does not include mock traffic, power, news, police, fire, EMS, utility outage, or dispatch data.

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

No API keys are required for the current version. The browser must have public internet access for map tiles, ZIP lookup, weather, NWS alerts, USGS events, and public-safety feeds.

PulsePoint coverage depends on participating agencies and should be treated as prototype-source integration until API use is formally cleared. Production-grade police/fire/EMS coverage requires verified jurisdiction-specific Socrata or ArcGIS datasets.
