import type { FishingSession, PhotoMetadata, PhotoSessionPlan, Water } from '../types'

export const extendSessionToCatch = (session: Pick<FishingSession, 'from' | 'to'>, time: string) => ({
  from: time < session.from ? time : session.from,
  to: session.to && time > session.to ? time : session.to
})

const distanceToWater = (photo: PhotoMetadata, water: Water) => {
  const { latitude, longitude } = water
  if (
    latitude === undefined || longitude === undefined
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90
    || longitude < -180 || longitude > 180
  ) return Infinity

  const radians = Math.PI / 180
  const latitudeDifference = (latitude - photo.latitude) * radians
  const longitudeDifference = (longitude - photo.longitude) * radians
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(photo.latitude * radians) * Math.cos(latitude * radians)
    * Math.sin(longitudeDifference / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, haversine))))
}

export const planPhotoSession = (
  photo: PhotoMetadata,
  waters: Water[],
  sessions: FishingSession[]
): PhotoSessionPlan => {
  const nearbyWaters = waters
    .map((water) => ({ water, distance: distanceToWater(photo, water) }))
    .filter((entry) => entry.distance <= 5)
    .sort((first, second) => first.distance - second.distance || first.water.id.localeCompare(second.water.id))
  const distanceByWater = new Map(nearbyWaters.map(({ water, distance }) => [water.id, distance]))
  const timeDistance = (session: FishingSession) => Math.max(
    Date.parse(`${session.from}Z`) - Date.parse(`${photo.time}Z`),
    Date.parse(`${photo.time}Z`) - Date.parse(`${session.to || photo.time}Z`),
    0
  )
  const session = sessions
    .filter((entry) => entry.from.slice(0, 10) === photo.time.slice(0, 10) && distanceByWater.has(entry.waterId))
    .sort((first, second) =>
      distanceByWater.get(first.waterId)! - distanceByWater.get(second.waterId)!
      || timeDistance(first) - timeDistance(second)
      || first.id.localeCompare(second.id)
    )[0]

  if (session) {
    return { kind: 'existing', session: { ...session, ...extendSessionToCatch(session, photo.time) } }
  }

  const water = nearbyWaters[0]?.water
  return {
    kind: water ? 'new' : 'manual',
    session: {
      from: photo.time,
      to: photo.time,
      waterId: water?.id ?? '',
      temperature: 0,
      population: 0,
      precipitation: 'Kein'
    }
  }
}