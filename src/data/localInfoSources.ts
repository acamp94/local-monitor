import type { GeoLocation, SourceStatus } from '@/types'

interface LocalInfoSource {
  id: string
  label: string
  city: string
  state: string
  detail: string
  url: string
}

const LOCAL_INFO_SOURCES: LocalInfoSource[] = [
  {
    id: 'jackson-ms-broadcastify-police-fire',
    label: 'Jackson Police and Fire audio',
    city: 'Jackson',
    state: 'Mississippi',
    detail: 'External live audio exists for Jackson Police and Fire, but no structured incident API is available.',
    url: 'https://www.broadcastify.com/listen/ctid/1421',
  },
  {
    id: 'jackson-ms-public-safety-comms',
    label: 'Jackson Public Safety Communications',
    city: 'Jackson',
    state: 'Mississippi',
    detail: 'Official dispatch center information is available; incident records are not published as a live feed.',
    url: 'https://www.jacksonms.gov/emergency-services-2/',
  },
]

export function getLocalInfoStatuses(location: GeoLocation | null): SourceStatus[] {
  if (!location) return []

  return LOCAL_INFO_SOURCES
    .filter(source => (
      source.city.toLowerCase() === location.city.toLowerCase() &&
      source.state.toLowerCase() === location.state.toLowerCase()
    ))
    .map(source => ({
      id: source.id,
      label: source.label,
      kind: 'ok',
      detail: source.detail,
      url: source.url,
    } satisfies SourceStatus))
}
