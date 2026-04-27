import { useEffect, useMemo } from 'react'
import { MapPin } from 'lucide-react'
import L from 'leaflet'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import type { EarthquakeEvent, GeoLocation, NWSAlert, LocalReport, SeverityLevel } from '@/types'
import { DARK_TILE_URL, DARK_TILE_ATTRIBUTION, DEFAULT_ZOOM, MAX_ZOOM } from '@/data/tileLayer'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function mapNWSSeverityToColor(s: string): string {
  if (s === 'Extreme') return '#ef4444'
  if (s === 'Severe')  return '#f59e0b'
  if (s === 'Moderate') return '#eab308'
  return '#22c55e'
}

function nwsToSeverity(s: string): SeverityLevel {
  if (s === 'Extreme') return 'CRITICAL'
  if (s === 'Severe') return 'HIGH'
  if (s === 'Moderate') return 'MODERATE'
  if (s === 'Minor') return 'LOW'
  return 'NONE'
}

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], DEFAULT_ZOOM, { animate: true, duration: 0.8 })
  }, [map, lat, lon])
  return null
}

function LocationMarker({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const icon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:40px;height:40px;">
        <div style="position:absolute;inset:0;border-radius:50%;border:1px solid rgba(0,200,255,0.55);${reducedMotion ? '' : 'animation:pulse-ring 2.2s ease-out infinite;'}"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;border:1.5px solid #00c8ff;opacity:0.9;"></div>
        <div style="position:absolute;top:2px;left:50%;transform:translateX(-50%);width:1.5px;height:7px;background:#00c8ff;opacity:0.7;"></div>
        <div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:1.5px;height:7px;background:#00c8ff;opacity:0.7;"></div>
        <div style="position:absolute;top:50%;left:2px;transform:translateY(-50%);width:7px;height:1.5px;background:#00c8ff;opacity:0.7;"></div>
        <div style="position:absolute;top:50%;right:2px;transform:translateY(-50%);width:7px;height:1.5px;background:#00c8ff;opacity:0.7;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;border-radius:50%;background:#00c8ff;box-shadow:0 0 6px #00c8ff;"></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
    const marker = L.marker([lat, lon], { icon, interactive: false }).addTo(map)
    return () => { map.removeLayer(marker) }
  }, [map, lat, lon])
  return null
}

function ReportMarkers({ reports }: { reports: LocalReport[] }) {
  const map = useMap()
  useEffect(() => {
    const markers: L.Marker[] = []
    reports.forEach(report => {
      if (report.lat == null || report.lon == null) return
      const color = '#22c55e'
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:32px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:rgba(34,197,94,0.9);
          border:3px solid ${color};
          box-shadow:0 2px 8px rgba(0,0,0,0.5),0 0 8px rgba(34,197,94,0.5);
          display:flex;align-items:center;justify-content:center;
        "><span style="transform:rotate(45deg);color:#0c1524;font-size:12px;font-weight:bold;">!</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })
      const popup = L.popup({ className: '', closeButton: false }).setContent(`
        <div style="font-family:monospace;font-size:11px;min-width:160px;">
          <div style="color:${color};font-weight:bold;margin-bottom:4px;font-size:10px;letter-spacing:0.05em;">
            USER NOTE · ${escapeHtml(report.category.toUpperCase())}
          </div>
          <div style="color:#e2e8f0;margin-bottom:4px;">${escapeHtml(report.title)}</div>
          ${report.body ? `<div style="color:#94a3b8;font-size:10px;">${escapeHtml(report.body.slice(0, 100))}${report.body.length > 100 ? '...' : ''}</div>` : ''}
        </div>
      `)
      const marker = L.marker([report.lat, report.lon], { icon }).bindPopup(popup).addTo(map)
      markers.push(marker)
    })
    return () => { markers.forEach(marker => map.removeLayer(marker)) }
  }, [map, reports])
  return null
}

function magnitudeToColor(magnitude: number | null): string {
  if (magnitude == null) return '#64748b'
  if (magnitude >= 6) return '#ef4444'
  if (magnitude >= 4) return '#f59e0b'
  if (magnitude >= 2.5) return '#eab308'
  return '#00c8ff'
}

function EarthquakeMarkers({ earthquakes }: { earthquakes: EarthquakeEvent[] }) {
  const map = useMap()
  useEffect(() => {
    const markers: L.CircleMarker[] = []

    earthquakes.forEach(event => {
      const color = magnitudeToColor(event.magnitude)
      const radius = Math.max(5, Math.min(16, (event.magnitude ?? 1) * 2.4))
      const marker = L.circleMarker([event.lat, event.lon], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.45,
        opacity: 0.95,
        weight: 2,
      }).bindPopup(`
        <div style="font-family:monospace;font-size:11px;min-width:180px;">
          <div style="color:${color};font-weight:bold;margin-bottom:4px;font-size:10px;letter-spacing:0.05em;">
            USGS EARTHQUAKE${event.magnitude == null ? '' : ` · M ${escapeHtml(event.magnitude.toFixed(1))}`}
          </div>
          <div style="color:#e2e8f0;margin-bottom:4px;">${escapeHtml(event.place)}</div>
          <div style="color:#94a3b8;font-size:10px;">${escapeHtml(event.time.toLocaleString())}</div>
          ${event.depthKm == null ? '' : `<div style="color:#64748b;font-size:9px;margin-top:4px;">Depth: ${escapeHtml(event.depthKm.toFixed(1))} km</div>`}
        </div>
      `).addTo(map)
      markers.push(marker)
    })

    return () => { markers.forEach(marker => map.removeLayer(marker)) }
  }, [map, earthquakes])
  return null
}

function AlertGeometryLayers({ alerts }: { alerts: NWSAlert[] }) {
  const map = useMap()
  useEffect(() => {
    const layers: L.GeoJSON[] = []

    alerts.forEach(alert => {
      if (!alert.geometry) return
      const color = mapNWSSeverityToColor(alert.severity)
      const layer = L.geoJSON(alert.geometry as GeoJSON.GeoJsonObject, {
        style: {
          color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 2.5,
          dashArray: '8 4',
          opacity: 0.95,
        },
      }).bindPopup(`
        <div style="font-family:monospace;font-size:11px;min-width:160px;">
          <div style="color:${color};font-weight:bold;margin-bottom:4px;">
            ${nwsToSeverity(alert.severity)} · ${escapeHtml(alert.event)}
          </div>
          <div style="color:#94a3b8;font-size:10px;">${escapeHtml(alert.areaDesc)}</div>
          ${alert.expires ? `<div style="color:#64748b;font-size:9px;margin-top:4px;">Expires: ${escapeHtml(new Date(alert.expires).toLocaleString())}</div>` : ''}
        </div>
      `)
      layer.addTo(map)
      layers.push(layer)
    })

    return () => { layers.forEach(layer => map.removeLayer(layer)) }
  }, [map, alerts])
  return null
}

interface Props {
  location: GeoLocation | null
  alerts: NWSAlert[]
  earthquakes: EarthquakeEvent[]
  userReports: LocalReport[]
}

export function OperationalMap({ location, alerts, earthquakes, userReports }: Props) {
  const center: [number, number] = location ? [location.lat, location.lon] : [39.5, -98.35]
  const zoom = location ? DEFAULT_ZOOM : 4
  const mappableReports = useMemo(
    () => userReports.filter(report => report.lat != null && report.lon != null),
    [userReports],
  )
  const alertsWithGeometry = useMemo(() => alerts.filter(alert => alert.geometry), [alerts])

  return (
    <div className="w-full h-full min-w-0 relative">
      {!location && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-page/70 pointer-events-none">
          <MapPin size={32} className="text-line-accent" aria-hidden="true" />
          <span className="font-mono text-sm text-muted text-center px-4 max-w-[22rem] break-words">
            Enter a ZIP code to load the area map. Map tiles require public internet access.
          </span>
        </div>
      )}

      <MapContainer center={center} zoom={zoom} className="w-full h-full" zoomControl={false} scrollWheelZoom>
        <TileLayer url={DARK_TILE_URL} attribution={DARK_TILE_ATTRIBUTION} maxZoom={MAX_ZOOM} subdomains="abcd" />
        <ZoomControl position="bottomright" />

        {location && <RecenterMap lat={location.lat} lon={location.lon} />}
        {location && <LocationMarker lat={location.lat} lon={location.lon} />}
        {location && <EarthquakeMarkers earthquakes={earthquakes} />}
        {location && <ReportMarkers reports={mappableReports} />}
        {location && <AlertGeometryLayers alerts={alertsWithGeometry} />}
      </MapContainer>

      {location && (
        <>
          <div className="absolute top-2 left-2 z-[400] pointer-events-none">
            <div className="bg-card/90 backdrop-blur-sm border border-line rounded-sm px-2 py-1">
              <div className="font-mono text-[10px] text-cyan">{location.zip} · {location.city}, {location.state}</div>
              <div className="font-mono text-[9px] text-muted">{location.lat.toFixed(4)}°N {Math.abs(location.lon).toFixed(4)}°W</div>
              <div className="font-mono text-[8px] text-muted uppercase">SOURCE: {location.source}</div>
            </div>
          </div>

          <div className="absolute top-2 right-2 z-[400] pointer-events-none flex flex-col gap-1 items-end">
            {alerts.length > 0 && (
              <div className="bg-danger/15 border border-danger/40 rounded-sm px-2 py-0.5">
                <span className="font-mono text-[9px] text-danger">
                  {alerts.length} NWS ALERT{alerts.length !== 1 ? 'S' : ''}
                </span>
              </div>
            )}
            {alerts.length > alertsWithGeometry.length && (
              <div className="bg-card/90 border border-line rounded-sm px-2 py-0.5">
                <span className="font-mono text-[8px] text-muted">
                  {alerts.length - alertsWithGeometry.length} ALERT{alerts.length - alertsWithGeometry.length !== 1 ? 'S' : ''} WITHOUT MAP GEOMETRY
                </span>
              </div>
            )}
            {mappableReports.length > 0 && (
              <div className="bg-amber/10 border border-amber/30 rounded-sm px-2 py-0.5">
                <span className="font-mono text-[9px] text-amber">
                  {mappableReports.length} LOCAL NOTE{mappableReports.length !== 1 ? 'S' : ''}
                </span>
              </div>
            )}
            {earthquakes.length > 0 && (
              <div className="bg-cyan/10 border border-cyan/30 rounded-sm px-2 py-0.5">
                <span className="font-mono text-[9px] text-cyan">
                  {earthquakes.length} USGS EVENT{earthquakes.length !== 1 ? 'S' : ''}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
