import { describe, expect, it } from 'vitest'
import type { GeoLocation, PublicSafetyIncident } from '@/types'
import {
  mergePublicSafetyResults,
  normalizePulsePointAgencies,
  normalizePulsePointIncidents,
} from '@/utils/publicSafetyAdapters'

const location: GeoLocation = {
  lat: 37.9,
  lon: -122,
  city: 'Concord',
  state: 'CA',
  zip: '94520',
  displayName: 'Concord, CA',
  source: 'OpenStreetMap/Nominatim',
  fetchedAt: new Date('2026-04-27T00:00:00Z'),
}

describe('public safety adapters', () => {
  it('normalizes captured PulsePoint agency and incident data', () => {
    const agencies = normalizePulsePointAgencies([
      {
        Display1: 'Contra Costa FPD [CA]',
        Display2: 'Port Chicago',
        agencyid: '07090',
        lat: 37.9479786,
        lng: -122.0607963,
      },
    ], location)

    const incidents = normalizePulsePointIncidents({
      incidents: {
        active: [{
          ID: '2462257766',
          AgencyID: '07090',
          Latitude: '37.9197760000',
          Longitude: '-121.7255470000',
          PulsePointIncidentCallType: 'ME',
          CallReceivedDateTime: '2026-04-27T02:31:52Z',
          Unit: [
            { UnitID: 'E192', PulsePointDispatchStatus: 'ER' },
            { UnitID: 'M84', PulsePointDispatchStatus: 'ER' },
          ],
          FullDisplayAddress: 'RUBIDOUX LN, BRENTWOOD, CA',
          AddressTruncated: '1',
        }],
      },
    }, agencies)

    expect(incidents).toHaveLength(1)
    expect(incidents[0]).toMatchObject({
      id: 'pulsepoint-2462257766',
      title: 'Medical Emergency',
      source: 'PULSEPOINT',
      status: 'Active',
      severity: 'LOW',
      agencyName: 'Contra Costa FPD [CA]',
      lat: 37.919776,
      lon: -121.725547,
      address: 'RUBIDOUX LN, BRENTWOOD, CA',
    })
  })

  it('handles empty PulsePoint incident responses', () => {
    expect(normalizePulsePointIncidents({ incidents: { active: [], recent: [] } })).toEqual([])
    expect(normalizePulsePointIncidents({})).toEqual([])
  })

  it('keeps successful source data when another source fails', () => {
    const incident: PublicSafetyIncident = {
      id: 'pulsepoint-1',
      title: 'Traffic Collision',
      category: 'Traffic Collision',
      source: 'PULSEPOINT',
      timestamp: new Date('2026-04-27T02:00:00Z'),
      lat: 37,
      lon: -122,
      address: 'Main St',
      severity: 'MODERATE',
      status: 'Active',
      raw: {},
    }

    const merged = mergePublicSafetyResults([
      { status: 'fulfilled', value: [incident] },
      { status: 'rejected', reason: new Error('Socrata HTTP 500') },
    ])

    expect(merged.incidents).toEqual([incident])
    expect(merged.errors).toEqual(['Socrata HTTP 500'])
    expect(merged.allFailed).toBe(false)
  })
})
