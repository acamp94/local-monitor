import CryptoJS from 'crypto-js'
import type {
  ArcGISPublicSafetySource,
  GeoLocation,
  PublicSafetyIncident,
  SeverityLevel,
  SocrataPublicSafetySource,
} from '@/types'

const PULSEPOINT_BASE_URL = 'https://api.pulsepoint.org/v1/webapp'
const PULSEPOINT_RESPONSE_KEY = 'tombrady5rings'
const MAX_PULSEPOINT_AGENCIES = 4
const MAX_PUBLIC_SAFETY_ITEMS = 75

interface PulsePointEncryptedResponse {
  ct: string
  iv?: string
  s?: string
}

interface PulsePointSearchAgencyRaw {
  Display1?: string
  Display2?: string
  agencyid?: string
  id?: string
  lat?: number
  lng?: number
}

interface PulsePointIncidentRaw {
  ID?: string
  AgencyID?: string
  Latitude?: string
  Longitude?: string
  PulsePointIncidentCallType?: string
  CallReceivedDateTime?: string
  ClosedDateTime?: string
  FullDisplayAddress?: string
  MedicalEmergencyDisplayAddress?: string
  AddressTruncated?: string
  PublicLocation?: string
  IsShareable?: string
  Unit?: Array<{ UnitID?: string; PulsePointDispatchStatus?: string }>
}

interface PulsePointSearchResponse {
  searchagencies?: PulsePointSearchAgencyRaw[]
}

interface PulsePointIncidentsResponse {
  incidents?: {
    active?: PulsePointIncidentRaw[]
    recent?: PulsePointIncidentRaw[]
  }
}

export interface PulsePointAgency {
  agencyId: string
  name: string
  jurisdiction: string | null
  state: string | null
  lat: number | null
  lon: number | null
}

export interface PulsePointIncidentResult {
  incidents: PublicSafetyIncident[]
  agencyCount: number
  searchedTerms: string[]
}

const pulsePointFormatter = {
  stringify(params: CryptoJS.lib.CipherParams) {
    const json: PulsePointEncryptedResponse = {
      ct: params.ciphertext.toString(CryptoJS.enc.Base64),
    }
    if (params.iv) json.iv = params.iv.toString()
    if (params.salt) json.s = params.salt.toString()
    return JSON.stringify(json)
  },
  parse(value: string) {
    const json = JSON.parse(value) as PulsePointEncryptedResponse
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(json.ct),
    })
    if (json.iv) cipherParams.iv = CryptoJS.enc.Hex.parse(json.iv)
    if (json.s) cipherParams.salt = CryptoJS.enc.Hex.parse(json.s)
    return cipherParams
  },
}

export function decryptPulsePointResponse<T>(payload: PulsePointEncryptedResponse): T {
  const decrypted = CryptoJS.AES.decrypt(JSON.stringify(payload), PULSEPOINT_RESPONSE_KEY, {
    format: pulsePointFormatter,
  }).toString(CryptoJS.enc.Utf8)

  if (!decrypted) throw new Error('PulsePoint response could not be decrypted')
  const parsed = JSON.parse(decrypted) as string
  return JSON.parse(parsed) as T
}

function sourceMatchesLocation(
  source: { city?: string; state?: string },
  location: GeoLocation,
): boolean {
  const cityMatches = !source.city || source.city.toLowerCase() === location.city.toLowerCase()
  const stateMatches = !source.state || source.state.toLowerCase() === location.state.toLowerCase()
  return cityMatches && stateMatches
}

export function sourceAppliesToLocation(
  source: SocrataPublicSafetySource | ArcGISPublicSafetySource,
  location: GeoLocation,
): boolean {
  return source.enabled && sourceMatchesLocation(source, location)
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeCoordinate(value: unknown, axis: 'lat' | 'lon'): number | null {
  const parsed = parseNumber(value)
  if (parsed == null) return null
  const maxAbs = axis === 'lat' ? 90 : 180
  if (Math.abs(parsed) <= maxAbs) return parsed
  const scaled = parsed / 1_000_000
  return Math.abs(scaled) <= maxAbs ? scaled : null
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function extractState(displayName: string): string | null {
  return displayName.match(/\[([A-Z]{2})\]/)?.[1] ?? null
}

export function normalizePulsePointAgencies(
  agencies: PulsePointSearchAgencyRaw[],
  location: GeoLocation,
): PulsePointAgency[] {
  const seen = new Set<string>()
  return agencies
    .map(agency => {
      const agencyId = agency.agencyid ?? agency.id
      const name = agency.Display1 ?? 'PulsePoint agency'
      if (!agencyId) return null
      return {
        agencyId,
        name,
        jurisdiction: agency.Display2 ?? null,
        state: extractState(name),
        lat: parseNumber(agency.lat),
        lon: parseNumber(agency.lng),
      } satisfies PulsePointAgency
    })
    .filter((agency): agency is PulsePointAgency => agency !== null)
    .filter(agency => !agency.state || agency.state === location.state)
    .filter(agency => {
      if (seen.has(agency.agencyId)) return false
      seen.add(agency.agencyId)
      return true
    })
}

function pulsePointCallTypeLabel(code: string | undefined): string {
  const labels: Record<string, string> = {
    ME: 'Medical Emergency',
    TC: 'Traffic Collision',
    TCF: 'Traffic Collision / Fire',
    SF: 'Structure Fire',
    RF: 'Residential Fire',
    CF: 'Commercial Fire',
    WF: 'Working Fire',
    WSF: 'Confirmed Structure Fire',
    VEG: 'Vegetation Fire',
    WVEG: 'Confirmed Vegetation Fire',
    VF: 'Vehicle Fire',
    GAS: 'Gas Leak',
    HMR: 'Hazmat Response',
    PA: 'Police Assist',
    PLE: 'Powerline Emergency',
    WD: 'Wires Down',
    WA: 'Wires Arcing',
    FL: 'Flooding',
  }
  return code ? labels[code] ?? code : 'Public Safety Incident'
}

function pulsePointSeverity(code: string | undefined, active: boolean): SeverityLevel {
  if (!active) return 'LOW'
  if (!code) return 'MODERATE'
  if (['WSF', 'WCF', 'WRF', 'WF', 'HMR', 'GAS', 'WVEG', 'PLE', 'WD', 'WA'].includes(code)) return 'HIGH'
  if (['SF', 'RF', 'CF', 'VEG', 'VF', 'TCF', 'TC', 'FL'].includes(code)) return 'MODERATE'
  return 'LOW'
}

export function normalizePulsePointIncidents(
  response: PulsePointIncidentsResponse,
  agencies: PulsePointAgency[] = [],
): PublicSafetyIncident[] {
  const agencyNames = new Map(agencies.map(agency => [agency.agencyId, agency.name]))
  const active = response.incidents?.active ?? []
  const recent = response.incidents?.recent ?? []

  return [
    ...active.map(incident => ({ incident, active: true })),
    ...recent.map(incident => ({ incident, active: false })),
  ]
    .map(({ incident, active }): PublicSafetyIncident | null => {
      const timestamp = parseDate(incident.CallReceivedDateTime)
      const id = incident.ID
      if (!id || !timestamp) return null
      const category = pulsePointCallTypeLabel(incident.PulsePointIncidentCallType)
      const address = incident.FullDisplayAddress ?? incident.MedicalEmergencyDisplayAddress ?? null
      const unitCount = incident.Unit?.length ?? 0
      return {
        id: `pulsepoint-${id}`,
        title: category,
        category,
        source: 'PULSEPOINT',
        timestamp,
        lat: parseNumber(incident.Latitude),
        lon: parseNumber(incident.Longitude),
        address,
        severity: pulsePointSeverity(incident.PulsePointIncidentCallType, active),
        status: active ? 'Active' : 'Recent',
        agencyName: incident.AgencyID ? agencyNames.get(incident.AgencyID) : undefined,
        raw: { ...incident, normalizedUnitCount: unitCount },
        url: undefined,
      } satisfies PublicSafetyIncident
    })
    .filter((incident): incident is PublicSafetyIncident => incident !== null)
    .slice(0, MAX_PUBLIC_SAFETY_ITEMS)
}

async function fetchPulsePointEncrypted<T>(params: URLSearchParams, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${PULSEPOINT_BASE_URL}?${params.toString()}`, { signal })
  if (!response.ok) throw new Error(`PulsePoint HTTP ${response.status}`)
  const json = await response.json() as PulsePointEncryptedResponse
  return decryptPulsePointResponse<T>(json)
}

export async function fetchPulsePointIncidentResult(
  location: GeoLocation,
  signal: AbortSignal,
): Promise<PulsePointIncidentResult> {
  const searchTerms = [location.city, location.zip].filter(Boolean)
  const agencies: PulsePointAgency[] = []

  for (const term of searchTerms) {
    const params = new URLSearchParams({ resource: 'searchagencies', token: term })
    const search = await fetchPulsePointEncrypted<PulsePointSearchResponse>(params, signal)
    agencies.push(...normalizePulsePointAgencies(search.searchagencies ?? [], location))
    if (agencies.length > 0) break
  }

  const uniqueAgencies = Array.from(
    new Map(agencies.map(agency => [agency.agencyId, agency])).values(),
  ).slice(0, MAX_PULSEPOINT_AGENCIES)

  if (!uniqueAgencies.length) {
    return { incidents: [], agencyCount: 0, searchedTerms: searchTerms }
  }

  const params = new URLSearchParams({
    resource: 'incidents',
    agencyid: uniqueAgencies.map(agency => agency.agencyId).join(','),
  })
  const incidents = await fetchPulsePointEncrypted<PulsePointIncidentsResponse>(params, signal)
  return {
    incidents: normalizePulsePointIncidents(incidents, uniqueAgencies),
    agencyCount: uniqueAgencies.length,
    searchedTerms: searchTerms,
  }
}

export async function fetchPulsePointIncidents(
  location: GeoLocation,
  signal: AbortSignal,
): Promise<PublicSafetyIncident[]> {
  return (await fetchPulsePointIncidentResult(location, signal)).incidents
}

export async function fetchSocrataIncidents(
  source: SocrataPublicSafetySource,
  signal: AbortSignal,
): Promise<PublicSafetyIncident[]> {
  const params = new URLSearchParams({
    $limit: '50',
    $order: `${source.timeField} DESC`,
  })
  if (source.where) params.set('$where', source.where)
  const response = await fetch(`https://${source.domain}/resource/${source.datasetId}.json?${params.toString()}`, { signal })
  if (!response.ok) throw new Error(`Socrata HTTP ${response.status}`)
  const rows = await response.json() as Array<Record<string, unknown>>

  return rows
    .map((row, index): PublicSafetyIncident | null => {
      const timestamp = parseDate(row[source.timeField])
      if (!timestamp) return null
      const category = String(row[source.categoryField ?? 'category'] ?? source.label)
      return {
        id: `socrata-${source.id}-${String(row.id ?? row.case_number ?? index)}`,
        title: String(row[source.titleField ?? 'title'] ?? category),
        category,
        source: 'SOCRATA',
        timestamp,
        lat: source.latField ? normalizeCoordinate(row[source.latField], 'lat') : null,
        lon: source.lonField ? normalizeCoordinate(row[source.lonField], 'lon') : null,
        address: source.addressField ? String(row[source.addressField] ?? '') || null : null,
        severity: 'LOW',
        status: source.label,
        agencyName: source.label,
        raw: row,
      } satisfies PublicSafetyIncident
    })
    .filter((incident): incident is PublicSafetyIncident => incident !== null)
}

export async function fetchArcGISIncidents(
  source: ArcGISPublicSafetySource,
  signal: AbortSignal,
): Promise<PublicSafetyIncident[]> {
  const baseUrl = source.layerId == null ? source.url : `${source.url.replace(/\/$/, '')}/${source.layerId}`
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    f: 'json',
  })
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/query?${params.toString()}`, { signal })
  if (!response.ok) throw new Error(`ArcGIS HTTP ${response.status}`)
  const json = await response.json() as { features?: Array<{ attributes?: Record<string, unknown>; geometry?: { x?: number; y?: number } }> }

  return (json.features ?? [])
    .map((feature, index): PublicSafetyIncident | null => {
      const attributes = feature.attributes ?? {}
      const timestamp = source.timeField ? parseDate(attributes[source.timeField]) : new Date()
      if (!timestamp) return null
      const category = String(attributes[source.categoryField ?? 'category'] ?? source.label)
      return {
        id: `arcgis-${source.id}-${String(attributes.OBJECTID ?? attributes.objectid ?? index)}`,
        title: String(attributes[source.titleField ?? 'title'] ?? category),
        category,
        source: 'ARCGIS',
        timestamp,
        lat: typeof feature.geometry?.y === 'number' ? feature.geometry.y : null,
        lon: typeof feature.geometry?.x === 'number' ? feature.geometry.x : null,
        address: source.addressField ? String(attributes[source.addressField] ?? '') || null : null,
        severity: 'LOW',
        status: source.label,
        agencyName: source.label,
        raw: feature,
      } satisfies PublicSafetyIncident
    })
    .filter((incident): incident is PublicSafetyIncident => incident !== null)
}

export function mergePublicSafetyResults(results: Array<PromiseSettledResult<PublicSafetyIncident[]>>) {
  const incidents = results
    .flatMap(result => result.status === 'fulfilled' ? result.value : [])
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map(result => result.reason instanceof Error ? result.reason.message : 'Public-safety source unavailable')

  return {
    incidents,
    errors,
    allFailed: results.length > 0 && errors.length === results.length,
  }
}
