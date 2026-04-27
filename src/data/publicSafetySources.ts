import type { ArcGISPublicSafetySource, SocrataPublicSafetySource } from '@/types'

export type ConfiguredPublicSafetySource = SocrataPublicSafetySource | ArcGISPublicSafetySource

// Official public-safety feeds are fragmented by jurisdiction. Add enabled city/county
// sources here as datasets are verified.
export const OFFICIAL_PUBLIC_SAFETY_SOURCES: ConfiguredPublicSafetySource[] = [
  {
    id: 'austin-real-time-fire',
    label: 'Austin Fire Active Incidents',
    type: 'SOCRATA',
    enabled: true,
    city: 'Austin',
    state: 'Texas',
    domain: 'data.austintexas.gov',
    datasetId: 'wpu4-x69d',
    timeField: 'traffic_report_status_date_time',
    where: "traffic_report_status='ACTIVE'",
    titleField: 'issue_reported',
    categoryField: 'agency',
    addressField: 'address',
    latField: 'latitude',
    lonField: 'longitude',
  },
]
